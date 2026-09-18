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

// Icon markup from Lucide (lucide.dev, ISC license), copied verbatim per icon, no library dependency.
const ICONS = {
  bookmark: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2 2 0 0 1 2 2v15a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5a2 2 0 0 1 2-2z"/></svg>',
  copy: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>',
  zoomIn: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="11" x2="11" y1="8" y2="14"/><line x1="8" x2="14" y1="11" y2="11"/></svg>',
  zoomOut: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="8" x2="14" y1="11" y2="11"/></svg>',
  x: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
  check: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>'
};

function makeIconButton(icon, label, fg, { primary = false } = {}) {
  const btn = document.createElement("button");
  btn.innerHTML = icon;
  btn.type = "button";
  btn.title = label;
  btn.setAttribute("aria-label", label);
  btn.style.cssText = `
    display: inline-flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; padding: 0; cursor: pointer;
    border-radius: 6px; border: none;
    background: ${primary ? "#9d7cf2" : "transparent"};
    color: ${primary ? "#ffffff" : fg};
    transition: background-color 120ms ease-out, transform 120ms ease-out;
  `;
  btn.onmouseenter = () => {
    if (btn.disabled) return;
    btn.style.background = primary ? "#ab8ff5" : "rgba(157, 124, 242, 0.2)";
    btn.style.transform = "scale(1.08)";
  };
  btn.onmouseleave = () => {
    btn.style.background = primary ? "#9d7cf2" : "transparent";
    btn.style.transform = "scale(1)";
  };
  return btn;
}

function showOverlay(text, isError, selectionText) {
  removeOverlay();

  const bg = isError ? "#4a1616" : "#1e1e1e";
  const fg = isError ? "#f0a8a8" : "#f0f0f0";
  let fontSize = 14;

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
    padding: 10px 14px; border-bottom: 1px solid #3a3a3a; flex-shrink: 0;
  `;

  const titleRow = document.createElement("div");
  titleRow.style.cssText = "display: flex; align-items: center; justify-content: space-between;";

  const label = document.createElement("span");
  label.textContent = "Mimi";
  label.style.cssText = "font-weight: 600;";
  titleRow.appendChild(label);

  const closeBtn = makeIconButton(ICONS.x, "Close", fg);
  closeBtn.onclick = removeOverlay;
  titleRow.appendChild(closeBtn);

  header.appendChild(titleRow);

  const toolbar = document.createElement("div");
  toolbar.style.cssText = "display: flex; gap: 4px; margin-top: 8px;";

  if (!isError) {
    const saveBtn = makeIconButton(ICONS.bookmark, "Save as flashcard", fg, { primary: true });
    saveBtn.onclick = async () => {
      await saveFlashcard(selectionText, text);
      saveBtn.innerHTML = ICONS.check;
      saveBtn.title = "Saved";
      saveBtn.setAttribute("aria-label", "Saved");
      saveBtn.disabled = true;
      saveBtn.style.opacity = "0.6";
      saveBtn.style.cursor = "default";
    };
    toolbar.appendChild(saveBtn);

    const copyBtn = makeIconButton(ICONS.copy, "Copy explanation", fg);
    copyBtn.onclick = async () => {
      try {
        await navigator.clipboard.writeText(text);
        copyBtn.innerHTML = ICONS.check;
        copyBtn.title = "Copied";
      } catch (err) {
        copyBtn.title = "Copy failed";
      }
      setTimeout(() => {
        copyBtn.innerHTML = ICONS.copy;
        copyBtn.title = "Copy explanation";
      }, 1500);
    };
    toolbar.appendChild(copyBtn);
  }

  const zoomOutBtn = makeIconButton(ICONS.zoomOut, "Zoom out", fg);
  const zoomInBtn = makeIconButton(ICONS.zoomIn, "Zoom in", fg);

  function applyZoom() {
    p.style.fontSize = fontSize + "px";
  }
  zoomOutBtn.onclick = () => {
    fontSize = Math.max(12, fontSize - 2);
    applyZoom();
  };
  zoomInBtn.onclick = () => {
    fontSize = Math.min(22, fontSize + 2);
    applyZoom();
  };
  toolbar.appendChild(zoomOutBtn);
  toolbar.appendChild(zoomInBtn);

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
