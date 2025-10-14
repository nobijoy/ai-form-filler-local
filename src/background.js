// background.js - Manifest V3 Service Worker
// Handle NER requests from content scripts using AI models

import { pipeline, AutoTokenizer, AutoModelForTokenClassification, env } from '@xenova/transformers';
env.debug = true;

console.log('[background.js] Transformers.js imported successfully');

// Configure transformers.js for Chrome extension environment
env.remoteModels = true;
env.allowRemoteModels = true;
env.allowLocalModels = false;
env.useBrowserCache = true;
env.HF_HUB_URL = "https://huggingface.co";
env.HF_HUB_CACHE = null;

// Additional configuration for better browser compatibility
env.allowRemoteModels = true;
env.remotePath = "https://huggingface.co/";
env.remoteURL = "https://huggingface.co/";
env.allowLocalModels = false;
env.useBrowserCache = true;
env.useCustomCache = false;

// Force CPU-only execution to avoid WASM issues
env.backends.onnx.cpu = true;
// Ensure WASM config is an object (not a boolean)
if (!env.backends.onnx.wasm || typeof env.backends.onnx.wasm !== 'object') {
    env.backends.onnx.wasm = {};
}

// Tweak WASM-related features safely on the object
// Leave wasmPaths undefined to allow auto-resolution
env.backends.onnx.wasm.numThreads = 1;
env.backends.onnx.wasm.simd = false;
env.backends.onnx.wasm.proxy = false;

// Use default execution providers (don't force), to avoid 'no available backend found'

// Add custom fetch function to handle corrupted JSON responses
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, options) => {
    try {
        const response = await originalFetch(url, options);
        
        // If it's a JSON response, check for null bytes
        if (response.headers.get('content-type')?.includes('application/json')) {
            const text = await response.text();
            
            // Check for null bytes or corrupted content
            if (text.includes('\x00') || text.trim() === '' || !text.startsWith('{') && !text.startsWith('[')) {
                console.warn(`[background.js] Detected corrupted JSON response from ${url}, retrying...`);
                // Retry the request
                return originalFetch(url, { ...options, cache: 'no-cache' });
            }
            
            // Create a new response with the cleaned text
            return new Response(text, {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers
            });
        }
        
        return response;
    } catch (error) {
        console.error(`[background.js] Fetch error for ${url}:`, error);
        throw error;
    }
};

console.log('[background.js] Transformers.js environment configured');
console.log('[background.js] Backend configuration:', {
    cpu: env.backends.onnx.cpu,
    wasm: env.backends.onnx.wasm,
    executionProviders: env.backends.onnx.executionProviders,
    wasmPaths: env.backends.onnx.wasm.wasmPaths
});

console.log('[background.js] AI Form Filler extension installed.');

// --- Constants ---
const DEFAULT_MODEL = 'Xenova/bert-base-NER';

// --- AI Model State ---
let lastModel = null;
let lastPipeline = null;
let modelLoadStatus = 'not_loaded'; // 'not_loaded', 'loading', 'loaded', 'failed'
let downloadProgress = 0; // 0-100 percentage
let lastLoggedProgress = -1;
let progressCallback = null;

console.log("[background.js] Service worker loaded");

// --- Helper: Load pipeline with retry logic ---
async function getPipeline(model, progress_callback = null, retryCount = 0) {
    const targetModel = DEFAULT_MODEL;
    if (targetModel === lastModel && lastPipeline) {
        return lastPipeline;
    }

    lastModel = targetModel;
    const maxRetries = 2;

    try {
        modelLoadStatus = 'loading';
        downloadProgress = 0;
        console.log(`[background.js] 🤖 LOADING AI MODEL: ${targetModel} (attempt ${retryCount + 1}/${maxRetries + 1})`);
        console.log(`[background.js] 📊 Model Status: ${modelLoadStatus}`);

        // Try different approaches based on the model
        try {
            // Single path: token-classification for DEFAULT_MODEL
            console.log('[background.js] Loading token-classification pipeline...');
            lastPipeline = await pipeline('token-classification', targetModel, {
                progress_callback: (progress) => {
                    if (progress && typeof progress.progress === 'number') {
                        const pct = Math.min(100, Math.max(0, Math.round(progress.progress * 100)));
                        downloadProgress = pct;
                        if (pct !== lastLoggedProgress) {
                            lastLoggedProgress = pct;
                            console.log(`[background.js] 📥 Download Progress: ${pct}%`);
                            if (progressCallback) progressCallback(pct);
                        }
                    }
                }
            });
        } catch (pipelineError) {
            console.log('[background.js] Pipeline approach failed, trying manual loading...');
            
            // Alternative approach: Load tokenizer and model separately
            const tokenizer = await AutoTokenizer.from_pretrained(targetModel);
            const modelObj = await AutoModelForTokenClassification.from_pretrained(targetModel);
            lastPipeline = await pipeline('token-classification', modelObj, tokenizer, {
                progress_callback: (progress) => {
                    if (progress && typeof progress.progress === 'number') {
                        const pct = Math.min(100, Math.max(0, Math.round(progress.progress * 100)));
                        downloadProgress = pct;
                        if (pct !== lastLoggedProgress) {
                            lastLoggedProgress = pct;
                            console.log(`[background.js] 📥 Download Progress: ${pct}%`);
                            if (progressCallback) progressCallback(pct);
                        }
                    }
                }
            });
        }

        modelLoadStatus = 'loaded';
        downloadProgress = 100;
        lastLoggedProgress = 100;
        console.log('[background.js] ✅ AI MODEL LOADED SUCCESSFULLY:', model);
        
        // Notify popup of completion
        if (progressCallback) {
            console.log('[background.js] 📤 Sending completion notification to popup');
            progressCallback(100);
        }
        
        return lastPipeline;

    } catch (error) {
        console.error('[background.js] ❌ FAILED TO LOAD AI MODEL (attempt ${retryCount + 1}):', error);
        console.error('[background.js] Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        
        // Check if it's a JSON parsing error or network issue
        const isRetryableError = error.message.includes('JSON') || 
                                error.message.includes('Unexpected token') ||
                                error.message.includes('fetch') ||
                                error.message.includes('network') ||
                                error.message.includes('CORS');
        
        if (isRetryableError && retryCount < maxRetries) {
            console.log(`[background.js] 🔄 Retrying model load in 2 seconds... (${retryCount + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            return getPipeline(targetModel, progress_callback, retryCount + 1);
        }
        
        if (isRetryableError) {
            console.error('[background.js] JSON parsing error detected - likely CORS or network issue');
            modelLoadStatus = 'failed';
            
            // Notify popup of network failure
            if (progressCallback) {
                console.log('[background.js] 📤 Sending network failure notification to popup');
                progressCallback(0);
            }
            
            throw new Error(`Network/CORS error: Unable to fetch model files from Hugging Face after ${maxRetries + 1} attempts. Please check your internet connection and try again.`);
        }
        
        modelLoadStatus = 'failed';
        
        // Notify popup of failure
        if (progressCallback) {
            console.log('[background.js] 📤 Sending failure notification to popup');
            progressCallback(0);
        }
        
        throw new Error(`AI model loading failed: ${error.message}`);
    }
}


// --- Handle messages from content scripts ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'performNER') {
        (async () => {
            try {
                if (!lastPipeline) {
                    await getPipeline(DEFAULT_MODEL);
                }

                const entities = await lastPipeline(message.text);
                const validEntities = entities.filter(e => e.score > 0.5);

                sendResponse({ success: true, entities: validEntities, modelUsed: lastModel, modelStatus: modelLoadStatus });
            } catch (error) {
                sendResponse({ success: false, error: error.message, modelStatus: modelLoadStatus });
            }
        })();
        return true; // Keep async channel open
    }

    if (message.action === 'getModelStatus') {
        sendResponse({ status: modelLoadStatus, model: lastModel, pipelineReady: !!lastPipeline, progress: downloadProgress });
        return true;
    }

    if (message.action === 'setProgressCallback') {
        progressCallback = (progress) => {
            chrome.runtime.sendMessage({
                action: 'progressUpdate',
                progress,
                status: modelLoadStatus,
                model: lastModel
            }).catch(() => {});
        };
        sendResponse({ success: true });
        return true;
    }

    if (message.action === 'testModelLoading') {
        (async () => {
            try {
                // Only reset if model is not already loaded
                if (modelLoadStatus !== 'loaded') {
                    lastModel = null;
                    lastPipeline = null;
                    modelLoadStatus = 'not_loaded';
                }
                
                const modelToTest = DEFAULT_MODEL;
                console.log(`[background.js] Testing model: ${modelToTest} (current status: ${modelLoadStatus})`);
                
                // If already loaded, just return success
                if (modelLoadStatus === 'loaded' && lastPipeline) {
                    console.log(`[background.js] Model already loaded, skipping download`);
                    sendResponse({ success: true, message: `Model already loaded: ${modelToTest}` });
                    return;
                }
                
                await getPipeline(modelToTest);
                sendResponse({ success: true, message: `Test model loaded successfully: ${modelToTest}` });
            } catch (error) {
                console.error('[background.js] Test model loading failed:', error);
                sendResponse({ success: false, error: error.message });
            }
        })();
        return true;
    }

    if (message.action === 'setMode') {
        console.log(`[background.js] Mode changed to: ${message.mode}, AI Ready: ${message.aiModelReady}`);
        // Store mode information for context
        chrome.storage.local.set({ 
            currentMode: message.mode,
            aiModelReady: message.aiModelReady 
        });
        sendResponse({ success: true });
        return true;
    }
});

console.log('[background.js] Service worker started with AI model support.');
console.log('[background.js] Environment check:', {
    allowRemoteModels: env.allowRemoteModels,
    allowLocalModels: env.allowLocalModels,
    useBrowserCache: env.useBrowserCache
});
