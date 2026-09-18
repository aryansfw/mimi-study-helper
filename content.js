let lastContext = null;

document.addEventListener("contextmenu", (event) => {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) {
    lastContext = null;
    return;
  }
  const anchor = selection.anchorNode;
  const el = anchor && anchor.nodeType === Node.TEXT_NODE ? anchor.parentElement : anchor;
  const block = el ? el.closest("p, li, pre, td, blockquote, div") : null;
  lastContext = {
    selectionText: selection.toString(),
    nearbyText: block ? block.innerText.slice(0, 600) : ""
  };
});

browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "get-context") {
    sendResponse(lastContext || { selectionText: "", nearbyText: "" });
    return;
  }
  if (msg.type === "explanation-result") {
    showOverlay(msg.explanation, false);
  } else if (msg.type === "explanation-error") {
    showOverlay(msg.error, true);
  }
});

function showOverlay(text, isError) {
  removeOverlay();
  const box = document.createElement("div");
  box.id = "mimi-overlay";
  box.style.cssText = `
    position: fixed; top: 20px; right: 20px; max-width: 360px;
    background: ${isError ? "#4a1616" : "#1e1e1e"}; color: #f0f0f0;
    padding: 14px 16px; border-radius: 8px;
    font: 14px/1.5 system-ui, sans-serif;
    z-index: 2147483647; box-shadow: 0 4px 16px rgba(0,0,0,0.4);
  `;

  const p = document.createElement("p");
  p.style.cssText = "margin: 0 0 10px 0; white-space: pre-wrap;";
  p.textContent = text;
  box.appendChild(p);

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "Close";
  closeBtn.style.cssText = "cursor: pointer; padding: 4px 10px;";
  closeBtn.onclick = removeOverlay;
  box.appendChild(closeBtn);

  document.body.appendChild(box);
}

function removeOverlay() {
  const existing = document.getElementById("mimi-overlay");
  if (existing) existing.remove();
}
