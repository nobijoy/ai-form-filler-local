console.log("AI Form Filler popup loaded");

// --- UI Elements ---
const fillButton = document.getElementById("fill-btn");
const checkModelButton = document.getElementById("check-model-btn");
const testModelButton = document.getElementById("test-model-btn");
const downloadButton = document.getElementById("download-btn");
const toggleDebugButton = document.getElementById("toggle-debug-btn");
const statusDiv = document.getElementById("status");

// Mode selector elements
const aiModeTab = document.getElementById("ai-mode-tab");
const basicModeTab = document.getElementById("basic-mode-tab");
const aiModeInfo = document.getElementById("ai-mode-info");
const basicModeInfo = document.getElementById("basic-mode-info");
const aiSetupSection = document.getElementById("ai-setup-section");

// AI status elements
const modelStatusDiv = document.getElementById("model-status");
const statusIndicator = document.getElementById("status-indicator");
const statusText = document.getElementById("status-text");
const loadingSpinner = document.getElementById("loading-spinner");
const progressBar = document.getElementById("progress-bar");
const progressFill = document.getElementById("progress-fill");
const progressText = document.getElementById("progress-text");
const debugSection = document.getElementById("debug-section");

// --- State ---
let currentMode = "basic"; // 'ai' or 'basic'
let aiModelReady = false;
let progressInterval = null;

// --- Progress Update Handler (Single source of truth) ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "progressUpdate") {
    const { progress, status, model } = message;
    console.log(`📥 Progress Update: ${progress}% (${status})`);

    if (status === "loading") {
      // Show progress only in the model status area (without percentage in text)
      updateModelStatus("loading", `Downloading AI model...`, progress);
    } else if (status === "loaded") {
      console.log("🎉 AI model loaded successfully!");
      aiModelReady = true;
      setStatus("success", `✅ AI Model Downloaded Successfully!`);

      // Hide model status section once download is complete
      modelStatusDiv.style.display = "none";

      // Update UI for AI mode
      if (currentMode === "ai") {
        aiSetupSection.style.display = "none";
        fillButton.disabled = false;
        fillButton.textContent = "Fill Forms with AI";
        downloadButton.disabled = false; // Re-enable for future use
      }

      // Save the fact that model is ready
      chrome.storage.sync.set({ aiModelReady: true });

      // Clear any timeout
      if (window.downloadTimeout) {
        clearTimeout(window.downloadTimeout);
        window.downloadTimeout = null;
      }
    } else if (status === "failed") {
      aiModelReady = false;
      updateModelStatus("error", "❌ AI model failed to load");
      setStatus("error", "❌ AI Model Download Failed");

      // Show setup section again
      if (currentMode === "ai") {
        aiSetupSection.style.display = "block";
        fillButton.disabled = true;
        downloadButton.disabled = false;
      }
    }
  }
});

// --- Mode Management ---
function switchMode(mode) {
  currentMode = mode;
  console.log(`🔄 Switching to ${mode} mode`);

  // Update tab appearance
  aiModeTab.classList.toggle("active", mode === "ai");
  basicModeTab.classList.toggle("active", mode === "basic");

  // Update info sections
  aiModeInfo.style.display = mode === "ai" ? "block" : "none";
  basicModeInfo.style.display = mode === "basic" ? "block" : "none";

  // Clear any existing status
  setStatus("", "");

  // Update UI based on mode
  if (mode === "ai") {
    if (aiModelReady) {
      // AI model is ready - hide status section
      modelStatusDiv.style.display = "none";
      aiSetupSection.style.display = "none";
      fillButton.textContent = "Fill Forms with AI";
      fillButton.disabled = false;
      setStatus(
        "success",
        "AI mode active - ready for intelligent form filling"
      );
    } else {
      // AI model needs to be downloaded - hide status section until download starts
      modelStatusDiv.style.display = "none";
      aiSetupSection.style.display = "block";
      fillButton.textContent = "Fill Forms with AI";
      fillButton.disabled = true;
      setStatus("info", "AI model needs to be downloaded first");
    }
  } else {
    // Basic mode - always hide status section
    modelStatusDiv.style.display = "none";
    aiSetupSection.style.display = "none";
    fillButton.textContent = "Fill Forms (Basic Mode)";
    fillButton.disabled = false;
    setStatus(
      "success",
      "Basic mode active - ready for instant pattern matching"
    );
  }

  // Save preference and notify background script
  chrome.storage.sync.set({ preferredMode: mode });

  // Notify background script of mode change
  try {
    chrome.runtime.sendMessage({
      action: "setMode",
      mode: mode,
      aiModelReady: aiModelReady,
    });
  } catch (error) {
    console.log("Could not notify background script of mode change:", error);
  }
}

// --- UI Helper Functions ---
function updateModelStatus(status, message, progress = 0) {
  statusText.textContent = message;

  // Update spinner and indicator
  if (status === "loading") {
    loadingSpinner.classList.remove("hidden");
    statusIndicator.className = "status-indicator loading";
    progressBar.style.display = "block";
    progressFill.style.width = `${progress}%`;
    progressText.textContent = `${progress}%`;
  } else if (status === "ready") {
    loadingSpinner.classList.add("hidden");
    statusIndicator.className = "status-indicator ready";
    progressBar.style.display = "none";
    aiModelReady = true;

    // Hide the model status section when ready
    setTimeout(() => {
      modelStatusDiv.style.display = "none";
    }, 2000); // Hide after 2 seconds to let user see the success message

    // Update UI properly for AI mode
    if (currentMode === "ai") {
      fillButton.disabled = false;
      fillButton.textContent = "Fill Forms with AI";
      aiSetupSection.style.display = "none";
    }
  } else if (status === "error") {
    loadingSpinner.classList.add("hidden");
    statusIndicator.className = "status-indicator error";
    progressBar.style.display = "none";
    aiModelReady = false;

    // Show setup section again for AI mode
    if (currentMode === "ai") {
      aiSetupSection.style.display = "block";
      fillButton.disabled = true;
    }
  } else {
    loadingSpinner.classList.add("hidden");
    statusIndicator.className = "status-indicator";
    progressBar.style.display = "none";
  }
}

// --- UI and Initialization ---
document.addEventListener("DOMContentLoaded", async () => {
  console.log("AI Form Filler popup initializing...");

  // Set up progress callback with background script
  try {
    await chrome.runtime.sendMessage({ action: "setProgressCallback" });
    console.log("Progress callback set up");
  } catch (error) {
    console.log("Could not set up progress callback:", error);
  }

  // Load saved preferences
  try {
    const result = await chrome.storage.sync.get([
      "preferredMode",
      "aiModelReady",
    ]);
    const savedMode = result.preferredMode || "basic";
    const savedModelReady = result.aiModelReady || false;

    currentMode = savedMode;
    aiModelReady = savedModelReady;

    console.log(
      `📋 Loaded preferences: mode=${savedMode}, aiReady=${savedModelReady}`
    );
  } catch (error) {
    console.log("Could not load saved preferences:", error);
  }

  // Check current AI model status
  await checkModelStatus();

  // Initialize UI with saved/default mode
  switchMode(currentMode);

  console.log("AI Form Filler popup ready");
});

// --- Model Status Check ---
async function checkModelStatus() {
  // Don't show any UI updates during initial check - just set the internal state
  try {
    const response = await chrome.runtime.sendMessage({
      action: "getModelStatus",
    });
    console.log("Model status:", response);

    if (response) {
      const { status } = response;

      switch (status) {
        case "loaded":
          aiModelReady = true;
          break;
        case "loading":
          aiModelReady = false;
          // Only show status if we're actively in AI mode and downloading
          if (currentMode === "ai") {
            modelStatusDiv.style.display = "block";
            updateModelStatus(
              "loading",
              `Downloading AI model...`,
              response.progress || 0
            );
          }
          break;
        case "not_loaded":
        case "failed":
        default:
          aiModelReady = false;
          // Don't show status section - let switchMode handle it
          break;
      }
    } else {
      aiModelReady = false;
    }
  } catch (error) {
    console.error("Error checking model status:", error);
    aiModelReady = false;
  }
}

// Check model status button
checkModelButton.addEventListener("click", async () => {
  setStatus("info", "Checking AI model status...");
  checkModelButton.disabled = true;

  try {
    const response = await chrome.runtime.sendMessage({
      action: "getModelStatus",
    });
    console.log("Model status response:", response);

    if (response) {
      const { status, model, pipelineReady, progress } = response;
      let statusMessage = "";

      switch (status) {
        case "not_loaded":
          statusMessage = "❌ AI Model: Not loaded yet";
          break;
        case "loading":
          statusMessage = `⏳ AI Model: Downloading... ${progress || 0}%`;
          break;
        case "loaded":
          statusMessage = `✅ AI Model: Loaded and ready (${model}) - ${
            progress || 100
          }%`;
          break;
        case "failed":
          statusMessage = "❌ AI Model: Failed to load";
          break;
        default:
          statusMessage = `❓ AI Model: Unknown status (${status})`;
      }

      statusMessage += ` | Pipeline Ready: ${pipelineReady ? "✅" : "❌"}`;
      setStatus("info", statusMessage);
    } else {
      setStatus("error", "Failed to get model status");
    }
  } catch (error) {
    console.error("Error checking model status:", error);
    setStatus("error", `Error: ${error.message}`);
  }

  checkModelButton.disabled = false;
});

// Test model loading button
testModelButton.addEventListener("click", async () => {
  setStatus("info", "Testing model loading...");
  testModelButton.disabled = true;

  try {
    console.log("Testing model loading for default model");

    const response = await chrome.runtime.sendMessage({
      action: "testModelLoading",
    });

    if (response.success) {
      if (response.usedFallback) {
        setStatus(
          "success",
          "✅ Model loading test successful! (Used fallback model)"
        );
        console.log(
          "Model loading test successful with fallback:",
          response.message
        );
      } else {
        setStatus("success", "✅ Model loading test successful!");
        console.log("Model loading test successful:", response.message);
      }
    } else {
      let errorMessage = response.error;
      if (errorMessage.includes("Network/CORS error")) {
        errorMessage =
          "Network/CORS error: Unable to fetch model files. This might be due to:\n• Internet connection issues\n• Browser security restrictions\n• Hugging Face server issues\n\nTry refreshing the page and testing again.";
      }
      setStatus("error", `❌ Model loading test failed: ${errorMessage}`);
      console.error("Model loading test failed:", response.error);
    }
  } catch (error) {
    console.error("Error during model loading test:", error);
    setStatus("error", `Error: ${error.message}`);
  }

  testModelButton.disabled = false;
});

// --- Event Listeners ---

// Mode tab switching
aiModeTab.addEventListener("click", () => {
  switchMode("ai");
});

basicModeTab.addEventListener("click", () => {
  switchMode("basic");
});

// Download AI Model button
downloadButton.addEventListener("click", async () => {
  console.log("🔄 Starting AI model download...");

  // Show model status section and update UI to show download starting
  modelStatusDiv.style.display = "block";
  updateModelStatus("loading", "Starting AI model download...", 0);
  aiSetupSection.style.display = "none";
  fillButton.disabled = true;
  downloadButton.disabled = true;

  // Set a timeout to prevent getting stuck
  window.downloadTimeout = setTimeout(() => {
    console.warn("⏰ Download timeout - model loading took too long");
    aiModelReady = false;
    updateModelStatus("error", "❌ Download timed out");
    aiSetupSection.style.display = "block";
    fillButton.disabled = true;
    downloadButton.disabled = false;
    setStatus("error", "Download timed out. Please try again.");
  }, 300000); // 5 minutes timeout

  try {
    // Just trigger the download - progress updates will come via message handler
    const response = await chrome.runtime.sendMessage({
      action: "testModelLoading",
    });

    console.log("📥 Download initiated:", response);

    // If response indicates already loaded, handle immediately
    if (
      response &&
      response.success &&
      response.message.includes("already loaded")
    ) {
      console.log("🎉 Model was already loaded!");
      clearTimeout(window.downloadTimeout);
      window.downloadTimeout = null;

      aiModelReady = true;
      setStatus("success", `✅ AI Model Ready!`);

      // Hide model status section once ready
      modelStatusDiv.style.display = "none";

      if (currentMode === "ai") {
        aiSetupSection.style.display = "none";
        fillButton.disabled = false;
        fillButton.textContent = "Fill Forms with AI";
        downloadButton.disabled = false;
      }

      chrome.storage.sync.set({ aiModelReady: true });
    }
  } catch (error) {
    console.error("❌ Error initiating model download:", error);
    clearTimeout(window.downloadTimeout);
    window.downloadTimeout = null;

    aiModelReady = false;
    updateModelStatus("error", "❌ Error starting download");
    aiSetupSection.style.display = "block";
    fillButton.disabled = true;
    downloadButton.disabled = false;
    setStatus("error", `Download error: ${error.message}`);
  }
});

// Toggle debug section
toggleDebugButton.addEventListener("click", () => {
  const isVisible = debugSection.style.display !== "none";
  debugSection.style.display = isVisible ? "none" : "block";
});

// Main Fill Forms button
fillButton.addEventListener("click", async () => {
  const useBasicMode = currentMode === "basic";

  console.log(
    `🚀 Fill button clicked - Mode: ${currentMode}, UseBasic: ${useBasicMode}, AIReady: ${aiModelReady}`
  );

  // Validate mode state
  if (currentMode === "ai" && !aiModelReady) {
    setStatus(
      "error",
      "AI model not ready. Please download it first or switch to Basic mode."
    );
    return;
  }

  setStatus(
    "info",
    `${
      currentMode === "ai" ? "AI analyzing" : "Pattern matching"
    } and filling forms...`
  );
  fillButton.disabled = true;

  // No need for progress polling - handled by message handler

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab) throw new Error("No active tab found.");

    // Disallow non-injectable schemes
    if (tab.url && !/^https?:|^file:/i.test(tab.url)) {
      throw new Error(
        "This page type cannot be accessed by the extension. Open an http(s) page."
      );
    }

    const sendFillMessage = () =>
      new Promise((resolve) => {
        chrome.tabs.sendMessage(
          tab.id,
          {
            action: "executeFill",
            model: "Xenova/bert-base-NER",
            useBasicMode: useBasicMode,
          },
          (response) => {
            resolve(response);
          }
        );
      });

    let response = await sendFillMessage();
    if (chrome.runtime.lastError || !response) {
      // Try injecting the content script and retry once
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["src/content.js"],
        });
        response = await sendFillMessage();
      } catch (injectErr) {
        stopProgressPolling();
        setStatus("error", `Injection failed: ${injectErr.message}`);
        fillButton.disabled = false;
        return;
      }
    }

    if (response?.success) {
      const count = response.results?.length || 0;
      const aiCount =
        response.results?.filter((r) => r.method === "ai-ner").length || 0;
      const patternCount =
        response.results?.filter(
          (r) => r.method === "pattern-matching" || r.method === "fallback"
        ).length || 0;

      if (currentMode === "basic") {
        setStatus(
          "success",
          `✅ Filled ${count} fields using pattern matching`
        );
      } else {
        setStatus(
          "success",
          `✅ Filled ${count} fields (${aiCount} AI, ${patternCount} pattern)`
        );
      }
    } else {
      const errMsg =
        chrome.runtime.lastError?.message ||
        response?.error ||
        "Failed to fill forms.";
      setStatus("error", `Error: ${errMsg}`);
    }
    fillButton.disabled = false;
  } catch (error) {
    console.error("Error during form fill process:", error);
    setStatus("error", `Error: ${error.message}`);
    fillButton.disabled = false;
  }
});

function setStatus(type, message) {
  statusDiv.textContent = message;
  statusDiv.className = `status-${type}`;
}

// No cleanup needed - using message handler for progress
