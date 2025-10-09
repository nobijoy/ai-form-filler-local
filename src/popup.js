console.log('AI Form Filler popup loaded');

// --- UI Elements ---
const fillButton = document.getElementById('fill-btn');
const checkModelButton = document.getElementById('check-model-btn');
const testModelButton = document.getElementById('test-model-btn');
const statusDiv = document.getElementById('status');

// --- Progress Tracking ---
let progressInterval = null;

// Function to start polling for progress updates
function startProgressPolling() {
    if (progressInterval) {
        clearInterval(progressInterval);
    }
    
    progressInterval = setInterval(async () => {
        try {
            const response = await chrome.runtime.sendMessage({ action: 'getModelStatus' });
            if (response && response.status === 'loading') {
                setStatus('info', `⏳ Downloading AI Model: ${response.progress || 0}%`);
            } else if (response && response.status === 'loaded') {
                setStatus('success', `✅ AI Model Loaded: ${response.model} (${response.progress || 100}%)`);
                stopProgressPolling();
            } else if (response && response.status === 'failed') {
                setStatus('error', '❌ AI Model: Failed to load');
                stopProgressPolling();
            }
        } catch (error) {
            console.log('Progress polling error:', error);
        }
    }, 500); // Poll every 500ms
}

// Function to stop progress polling
function stopProgressPolling() {
    if (progressInterval) {
        clearInterval(progressInterval);
        progressInterval = null;
    }
}

// --- Progress Update Handler ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'progressUpdate') {
        const { progress, status, model } = message;
        console.log(`📥 Progress Update: ${progress}% (${status})`);
        
        if (status === 'loading') {
            setStatus('info', `⏳ Downloading AI Model: ${progress}%`);
        } else if (status === 'loaded') {
            setStatus('success', `✅ AI Model Loaded: ${model} (${progress}%)`);
        }
    }
});

// --- UI and Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    setStatus('success', 'Ready for intelligent form filling!');
    fillButton.disabled = false;
    
    // Set up progress callback with background script
    try {
        await chrome.runtime.sendMessage({ action: 'setProgressCallback' });
        console.log('Progress callback set up');
    } catch (error) {
        console.log('Could not set up progress callback:', error);
    }
    
    console.log('AI Form Filler popup ready');
});


// Check model status button
checkModelButton.addEventListener('click', async () => {
    setStatus('info', 'Checking AI model status...');
    checkModelButton.disabled = true;
    
    try {
        const response = await chrome.runtime.sendMessage({ action: 'getModelStatus' });
        console.log('Model status response:', response);
        
        if (response) {
            const { status, model, pipelineReady, progress } = response;
            let statusMessage = '';
            
            switch (status) {
                case 'not_loaded':
                    statusMessage = '❌ AI Model: Not loaded yet';
                    break;
                case 'loading':
                    statusMessage = `⏳ AI Model: Downloading... ${progress || 0}%`;
                    break;
                case 'loaded':
                    statusMessage = `✅ AI Model: Loaded and ready (${model}) - ${progress || 100}%`;
                    break;
                case 'failed':
                    statusMessage = '❌ AI Model: Failed to load';
                    break;
                default:
                    statusMessage = `❓ AI Model: Unknown status (${status})`;
            }
            
            statusMessage += ` | Pipeline Ready: ${pipelineReady ? '✅' : '❌'}`;
            setStatus('info', statusMessage);
        } else {
            setStatus('error', 'Failed to get model status');
        }
    } catch (error) {
        console.error('Error checking model status:', error);
        setStatus('error', `Error: ${error.message}`);
    }
    
    checkModelButton.disabled = false;
});

// Test model loading button
testModelButton.addEventListener('click', async () => {
    setStatus('info', 'Testing model loading...');
    testModelButton.disabled = true;
    
    try {
        console.log('Testing model loading for default model');
        
        const response = await chrome.runtime.sendMessage({ 
            action: 'testModelLoading'
        });
        
        if (response.success) {
            if (response.usedFallback) {
                setStatus('success', '✅ Model loading test successful! (Used fallback model)');
                console.log('Model loading test successful with fallback:', response.message);
            } else {
                setStatus('success', '✅ Model loading test successful!');
                console.log('Model loading test successful:', response.message);
            }
        } else {
            let errorMessage = response.error;
            if (errorMessage.includes('Network/CORS error')) {
                errorMessage = 'Network/CORS error: Unable to fetch model files. This might be due to:\n• Internet connection issues\n• Browser security restrictions\n• Hugging Face server issues\n\nTry refreshing the page and testing again.';
            }
            setStatus('error', `❌ Model loading test failed: ${errorMessage}`);
            console.error('Model loading test failed:', response.error);
        }
    } catch (error) {
        console.error('Error during model loading test:', error);
        setStatus('error', `Error: ${error.message}`);
    }
    
    testModelButton.disabled = false;
});

// Main button click listener
fillButton.addEventListener('click', async () => {
    setStatus('info', 'AI analyzing and filling forms...');
    fillButton.disabled = true;
    
    // Start progress polling in case model needs to be loaded
    startProgressPolling();

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) throw new Error('No active tab found.');

        // Disallow non-injectable schemes
        if (tab.url && !/^https?:|^file:/i.test(tab.url)) {
            throw new Error('This page type cannot be accessed by the extension. Open an http(s) page.');
        }

        const sendFillMessage = () => new Promise((resolve) => {
            chrome.tabs.sendMessage(tab.id, { action: 'executeFill', model: 'Xenova/bert-base-NER' }, (response) => {
                resolve(response);
            });
        });

        let response = await sendFillMessage();
        if (chrome.runtime.lastError || !response) {
            // Try injecting the content script and retry once
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['src/content.js']
                });
                response = await sendFillMessage();
            } catch (injectErr) {
                stopProgressPolling();
                setStatus('error', `Injection failed: ${injectErr.message}`);
                fillButton.disabled = false;
                return;
            }
        }

        stopProgressPolling(); // Stop polling when form filling is complete
        if (response?.success) {
            const count = response.results?.length || 0;
            const aiCount = response.results?.filter(r => r.method === 'ai-ner').length || 0;
            const fallbackCount = response.results?.filter(r => r.method === 'fallback').length || 0;
            setStatus('success', `Filled ${count} fields (${aiCount} AI, ${fallbackCount} pattern).`);
        } else {
            const errMsg = chrome.runtime.lastError?.message || response?.error || 'Failed to fill forms.';
            setStatus('error', `Error: ${errMsg}`);
        }
        fillButton.disabled = false;

    } catch (error) {
        console.error('Error during form fill process:', error);
        setStatus('error', `Error: ${error.message}`);
        stopProgressPolling();
        fillButton.disabled = false;
    }
});

function setStatus(type, message) {
    statusDiv.textContent = message;
    statusDiv.className = `status-${type}`;
}

// Cleanup when popup is closed
window.addEventListener('beforeunload', () => {
    stopProgressPolling();
});