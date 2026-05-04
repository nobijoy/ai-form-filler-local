// background.js - Manifest V3 Service Worker
// Deterministic mode by default: no remote model downloads.

const AI_EXPERIMENTAL_ENABLED = false;
const modelLoadStatus = AI_EXPERIMENTAL_ENABLED ? "not_loaded" : "not_available";
const MODEL_LABEL = AI_EXPERIMENTAL_ENABLED ? "experimental" : "disabled";

console.log("[background.js] Service worker started");
console.log("[background.js] AI experimental mode:", AI_EXPERIMENTAL_ENABLED);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "performNER") {
    if (!AI_EXPERIMENTAL_ENABLED) {
      sendResponse({
        success: false,
        error: "AI model path is disabled in deterministic mode.",
        modelStatus: modelLoadStatus,
      });
      return true;
    }
  }

  if (message.action === "getModelStatus") {
    sendResponse({
      status: modelLoadStatus,
      model: MODEL_LABEL,
      pipelineReady: false,
      progress: 0,
    });
    return true;
  }

  if (message.action === "setProgressCallback") {
    sendResponse({ success: true });
    return true;
  }

  if (message.action === "testModelLoading") {
    sendResponse({
      success: false,
      error:
        "Experimental AI model loading is disabled. Deterministic mode is active.",
      modelStatus: modelLoadStatus,
    });
    return true;
  }

  if (message.action === "setMode") {
    chrome.storage.local.set({
      currentMode: message.mode,
      aiModelReady: false,
    });
    updateContextMenuTitle(message.mode, false);
    sendResponse({ success: true });
    return true;
  }
});

chrome.runtime.onInstalled.addListener(async () => {
  console.log("[background.js] Extension installed, creating context menu");
  const result = await chrome.storage.local.get(["currentMode"]);
  const currentMode = result.currentMode || "basic";
  chrome.contextMenus.create({
    id: "fillForm",
    title: getContextMenuTitle(currentMode),
    contexts: ["page"],
  });
});

function getContextMenuTitle(mode) {
  if (mode === "ai") {
    return "Fill Form (Deterministic Mode)";
  }
  return "Fill Form (Basic Mode)";
}

function updateContextMenuTitle(mode) {
  const newTitle = getContextMenuTitle(mode);
  chrome.contextMenus.update("fillForm", {
    title: newTitle,
  });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "fillForm") return;

  try {
    const result = await chrome.storage.local.get(["currentMode"]);
    const currentMode = result.currentMode || "basic";

    chrome.tabs.sendMessage(
      tab.id,
      {
        action: "executeFill",
        model: "disabled",
        useBasicMode: true,
        requestedMode: currentMode,
      },
      (response) => {
        if (chrome.runtime.lastError) {
          chrome.scripting
            .executeScript({
              target: { tabId: tab.id },
              files: ["src/content.js"],
            })
            .then(() => {
              chrome.tabs.sendMessage(tab.id, {
                action: "executeFill",
                model: "disabled",
                useBasicMode: true,
                requestedMode: currentMode,
              });
            })
            .catch((error) => {
              console.error("[background.js] Failed to inject content script:", error);
            });
        } else if (!response?.success) {
          console.warn("[background.js] Form fill returned no success:", response);
        }
      }
    );
  } catch (error) {
    console.error("[background.js] Error in context menu handler:", error);
  }
});
