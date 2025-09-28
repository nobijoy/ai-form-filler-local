import { pipeline, env } from '@xenova/transformers';

// Configure transformers.js for Chrome extension environment
env.allowRemoteModels = true;
env.allowLocalModels = false;
env.useBrowserCache = true;
env.backends.onnx.wasm.numThreads = 1;
env.backends.onnx.wasm.simd = false;
env.backends.onnx.wasm.proxy = false;

console.log('AI Form Filler with transformers.js loaded');

// --- UI Elements ---
const modelSelect = document.getElementById('model-select');
const fillButton = document.getElementById('fill-btn');
const statusDiv = document.getElementById('status');

// --- AI Model State ---
let lastModel = null;
let lastPipeline = null;

// --- AI Model Logic ---
async function getPipeline(model, progress_callback = null) {
    if (model === lastModel && lastPipeline) {
        return lastPipeline;
    }

    lastModel = model;
    
    try {
        console.log(`Loading AI model: ${model}`);
        
        // Try different models in order of reliability
        let modelToLoad = model;
        
        // Use a more reliable model that's known to work
        if (model === "dslim/bert-base-NER") {
            modelToLoad = "Xenova/bert-base-NER";
        } else if (model === "gunghio/distilbert-base-multilingual-cased-finetuned-conll2003-ner") {
            modelToLoad = "Xenova/distilbert-base-multilingual-cased-ner";
        }
        
        lastPipeline = await pipeline('token-classification', modelToLoad, {
            quantized: true,
            progress_callback,
        });
        
        console.log('AI model loaded successfully:', modelToLoad);
        return lastPipeline;
    } catch (error) {
        console.error('Failed to load AI model:', error);
        
        // Fallback to a simpler model
        try {
            console.log('Trying fallback model...');
            lastPipeline = await pipeline('token-classification', 'Xenova/distilbert-base-cased-ner', {
                quantized: true,
                progress_callback,
            });
            console.log('Fallback AI model loaded successfully');
            return lastPipeline;
        } catch (fallbackError) {
            console.error('Fallback model also failed:', fallbackError);
            throw new Error(`AI model loading failed: ${error.message}`);
        }
    }
}

// --- Content Script Communication ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'performNER') {
        if (!lastPipeline) {
            console.warn('AI pipeline not ready, using fallback');
            sendResponse({ success: false, error: 'AI pipeline not ready' });
            return false;
        }
        
        // Perform NER asynchronously with better error handling
        (async () => {
            try {
                console.log('🤖 AI NER Request:', message.text);
                console.log('🤖 Pipeline status:', !!lastPipeline);
                
                if (!lastPipeline) {
                    throw new Error('Pipeline is null');
                }
                
                const entities = await lastPipeline(message.text);
                console.log('🤖 AI NER Success:', entities);
                
                // Filter and format entities
                const validEntities = entities.filter(e => e.score > 0.5);
                console.log('🤖 Filtered entities (>50% confidence):', validEntities);
                
                sendResponse({ success: true, entities: validEntities });
            } catch (error) {
                console.error('🤖 AI NER Error:', error);
                sendResponse({ success: false, error: error.message });
            }
        })();
        
        return true; // Keep message channel open for async response
    }
});

// --- UI and Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    fillButton.disabled = true;
    setStatus('info', 'Loading AI model...');

    try {
        // Try to load a reliable model
        const selectedModel = "Xenova/bert-base-NER";
        modelSelect.value = "dslim/bert-base-NER"; // Update UI to show equivalent
        
        await getPipeline(selectedModel, (progress) => {
            if (progress && progress.progress) {
                const percent = Math.round(progress.progress);
                setStatus('info', `Loading AI model: ${percent}%`);
            } else {
                setStatus('info', 'Downloading AI model...');
            }
        });

        setStatus('success', 'AI model loaded! Ready for intelligent form filling.');
        fillButton.disabled = false;
        console.log('AI Form Filler ready with transformer model');
        
        // Test the AI pipeline immediately with various texts
        console.log('🧪 Testing AI pipeline...');
        try {
            const tests = [
                "John works at Microsoft in Seattle",
                "My manager is Sarah Johnson",
                "I work for Google",
                "Born in New York",
                "supervisor",
                "manager", 
                "company",
                "workplace"
            ];
            
            for (const testText of tests) {
                console.log(`🧪 Testing: "${testText}"`);
                const testResult = await lastPipeline(testText);
                console.log(`🧪 AI Test "${testText}":`, testResult);
                
                // Also test with filtering
                const filtered = testResult.filter(e => e.score > 0.5);
                console.log(`🧪 Filtered (>50%):`, filtered);
                
                // Show all entities regardless of score
                const allEntities = testResult.filter(e => e.score > 0.1);
                console.log(`🧪 All entities (>10%):`, allEntities);
            }
        } catch (testError) {
            console.error('🧪 AI Test Failed:', testError);
        }
    } catch (error) {
        console.error('Failed to load AI model:', error);
        setStatus('info', 'AI model failed to load. Using pattern matching fallback.');
        fillButton.disabled = false;
    }
});

// Save model selection when changed
modelSelect.addEventListener('change', () => {
    chrome.storage.sync.set({ selectedModel: modelSelect.value });
});

// Main button click listener
fillButton.addEventListener('click', async () => {
    setStatus('info', 'AI analyzing and filling forms...');
    fillButton.disabled = true;

    try {
        const selectedModel = modelSelect.value;
        
        // Switch models if needed
        if (selectedModel !== lastModel && lastPipeline) {
            setStatus('info', 'Switching AI model...');
            await getPipeline(selectedModel, (progress) => {
                if (progress && progress.progress) {
                    const percent = Math.round(progress.progress);
                    setStatus('info', `Loading: ${percent}%`);
                }
            });
        }

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab) throw new Error('No active tab found.');

        chrome.tabs.sendMessage(tab.id, { action: 'executeFill', model: selectedModel }, (response) => {
            if (chrome.runtime.lastError) {
                setStatus('error', `Error: ${chrome.runtime.lastError.message}`);
                fillButton.disabled = false;
                return;
            }
            if (response?.success) {
                const count = response.results?.length || 0;
                const aiCount = response.results?.filter(r => r.method === 'ai-ner').length || 0;
                const fastCount = response.results?.filter(r => r.method === 'fast-path').length || 0;
                setStatus('success', `Filled ${count} fields (${aiCount} AI, ${fastCount} pattern).`);
            } else {
                setStatus('error', `Error: ${response?.error || 'Failed to fill forms.'}`);
            }
            fillButton.disabled = false;
        });

    } catch (error) {
        console.error('Error during form fill process:', error);
        setStatus('error', `Error: ${error.message}`);
        fillButton.disabled = false;
    }
});

function setStatus(type, message) {
    statusDiv.textContent = message;
    statusDiv.className = `status-${type}`;
}