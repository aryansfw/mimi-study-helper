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
    showOverlay(msg.explanation, false, msg.selectionText);
  } else if (msg.type === "explanation-error") {
    showOverlay(msg.error, true);
  }
});

function extractAnswer(text) {
  const idx = text.indexOf("\n\n");
  return idx === -1 ? text : text.slice(0, idx);
}

async function saveFlashcard(selectionText, explanation) {
  const answer = extractAnswer(explanation);
  const { flashcards = [] } = await browser.storage.local.get("flashcards");
  flashcards.push({ front: selectionText, answer, explanation, created: Date.now() });
  await browser.storage.local.set({ flashcards });
}

function showOverlay(text, isError, selectionText) {
  removeOverlay();

  const bg = isError ? "#4a1616" : "#1e1e1e";
  const fg = isError ? "#f0a8a8" : "#f0f0f0";

  const box = document.createElement("div");
  box.id = "mimi-overlay";
  box.style.cssText = `
    position: fixed; top: 20px; right: 20px; width: 360px;
    max-height: min(70vh, 480px);
    display: flex; flex-direction: column;
    background: ${bg}; color: ${fg};
    border-radius: 8px;
    font: 14px/1.5 system-ui, sans-serif;
    z-index: 2147483647; box-shadow: 0 4px 16px rgba(0,0,0,0.4);
    opacity: 0; transform: translateY(-8px);
    transition: opacity 180ms ease-out, transform 180ms ease-out;
  `;

  const header = document.createElement("div");
  header.style.cssText = `
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 14px; border-bottom: 1px solid #3a3a3a;
    flex-shrink: 0;
  `;

  const label = document.createElement("span");
  label.textContent = "Mimi";
  label.style.cssText = "font-weight: 600;";
  header.appendChild(label);

  const toolbar = document.createElement("div");
  toolbar.style.cssText = "display: flex; gap: 8px;";

  if (!isError) {
    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save";
    saveBtn.type = "button";
    saveBtn.style.cssText = `
      cursor: pointer; padding: 4px 10px; font: inherit;
      background: #9d7cf2; color: #ffffff;
      border: none; border-radius: 6px;
      transition: background-color 120ms ease-out, transform 120ms ease-out;
    `;
    saveBtn.onmouseenter = () => {
      if (saveBtn.disabled) return;
      saveBtn.style.background = "#ab8ff5";
      saveBtn.style.transform = "scale(1.02)";
    };
    saveBtn.onmouseleave = () => {
      saveBtn.style.background = "#9d7cf2";
      saveBtn.style.transform = "scale(1)";
    };
    saveBtn.onclick = async () => {
      await saveFlashcard(selectionText, text);
      saveBtn.textContent = "Saved";
      saveBtn.disabled = true;
      saveBtn.style.opacity = "0.6";
      saveBtn.style.cursor = "default";
    };
    toolbar.appendChild(saveBtn);
  }

  const closeBtn = document.createElement("button");
  closeBtn.textContent = "Close";
  closeBtn.type = "button";
  closeBtn.style.cssText = `
    cursor: pointer; padding: 4px 10px; font: inherit;
    background: transparent; color: ${fg};
    border: 1px solid #3a3a3a; border-radius: 6px;
    transition: border-color 120ms ease-out, transform 120ms ease-out;
  `;
  closeBtn.onmouseenter = () => {
    closeBtn.style.borderColor = "#9d7cf2";
    closeBtn.style.transform = "scale(1.02)";
  };
  closeBtn.onmouseleave = () => {
    closeBtn.style.borderColor = "#3a3a3a";
    closeBtn.style.transform = "scale(1)";
  };
  closeBtn.onclick = removeOverlay;
  toolbar.appendChild(closeBtn);

  header.appendChild(toolbar);
  box.appendChild(header);

  const body = document.createElement("div");
  body.style.cssText = "padding: 12px 14px; overflow-y: auto;";

  const p = document.createElement("p");
  p.style.cssText = "margin: 0; white-space: pre-wrap;";
  p.textContent = text;
  body.appendChild(p);

  box.appendChild(body);
  document.body.appendChild(box);

  requestAnimationFrame(() => {
    box.style.opacity = "1";
    box.style.transform = "translateY(0)";
  });
}

function removeOverlay() {
  const existing = document.getElementById("mimi-overlay");
  if (existing) existing.remove();
}
