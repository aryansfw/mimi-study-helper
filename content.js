let lastContext = null;
let savedPosition = null;

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
    showOverlay(msg.explanation, false, msg.topic);
  } else if (msg.type === "explanation-error") {
    showOverlay(msg.error, true);
  }
});

async function saveNote(topic, explanation) {
  const { notes = [] } = await browser.storage.local.get("notes");
  notes.push({ topic, explanation, created: Date.now() });
  await browser.storage.local.set({ notes });
}

// Icon markup from Lucide (lucide.dev, ISC license), copied verbatim per icon, no library dependency.
const ICONS = {
  bookmark: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2 2 0 0 1 2 2v15a1 1 0 0 1-1.496.868l-4.512-2.578a2 2 0 0 0-1.984 0l-4.512 2.578A1 1 0 0 1 5 20V5a2 2 0 0 1 2-2z"/></svg>',
  copy: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>',
  zoomIn: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="11" x2="11" y1="8" y2="14"/><line x1="8" x2="14" y1="11" y2="11"/></svg>',
  zoomOut: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/><line x1="8" x2="14" y1="11" y2="11"/></svg>',
  x: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
  check: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  panelLeft: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/></svg>',
  arrowLeft: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>'
};

const MIN_FONT_SIZE = 10;
const MAX_FONT_SIZE = 32;

// Every button shares one style (no primary/secondary split, no border):
// transparent background, fg-colored icon/text, a subtle accent-tinted
// background on hover. Solid-accent primary buttons previously put white
// text/icons on #9d7cf2, which only measures 3.18:1 contrast, failing WCAG
// AA's 4.5:1 for text. A bordered-box look was tried after that and dropped
// too, borders around every small icon looked cluttered; the background
// tint alone reads as feedback. Scoped to #mimi-overlay so it doesn't leak
// into the host page. Keyboard focus-visible outline stays regardless,
// that's an accessibility requirement, not decoration.
const OVERLAY_STYLE = `
  #mimi-overlay button {
    display: inline-flex; align-items: center; justify-content: center;
    width: 28px; height: 28px; padding: 0;
    font: inherit;
    border: none;
    border-radius: 6px;
    background: transparent;
    cursor: pointer;
    transition: background-color 120ms ease-out;
  }
  #mimi-overlay button:hover:not(:disabled) {
    background: rgba(157, 124, 242, 0.15);
  }
  #mimi-overlay button:disabled { opacity: 0.6; cursor: default; }
  #mimi-overlay button:focus-visible {
    outline: 2px solid #9d7cf2; outline-offset: 2px;
  }
`;

function makeIconButton(icon, label, fg) {
  const btn = document.createElement("button");
  btn.innerHTML = icon;
  btn.type = "button";
  btn.title = label;
  btn.setAttribute("aria-label", label);
  btn.style.color = fg;
  return btn;
}

function makeListButton(text, fg, bold) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.textContent = text;
  btn.style.cssText = `
    width: 100%; height: auto; display: block; text-align: left;
    padding: 8px; color: ${fg}; font-weight: ${bold ? 600 : 400};
  `;
  return btn;
}

function showOverlay(text, isError, topic) {
  removeOverlay();

  const bg = isError ? "#4a1616" : "#1e1e1e";
  const fg = isError ? "#f0a8a8" : "#f0f0f0";
  let fontSize = 14;

  const position = savedPosition || { left: window.innerWidth - 360 - 20, top: 20 };

  const box = document.createElement("div");
  box.id = "mimi-overlay";
  box.style.cssText = `
    position: fixed; left: ${position.left}px; top: ${position.top}px; width: 360px;
    max-height: min(70vh, 480px);
    display: flex; flex-direction: column;
    background: ${bg}; color: ${fg};
    border-radius: 8px;
    font: 14px/1.5 system-ui, sans-serif;
    z-index: 2147483647; box-shadow: 0 4px 16px rgba(0,0,0,0.4);
    opacity: 0; transform: translateY(-8px);
    transition: opacity 180ms ease-out, transform 180ms ease-out;
  `;

  const styleTag = document.createElement("style");
  styleTag.textContent = OVERLAY_STYLE;
  box.appendChild(styleTag);

  const header = document.createElement("div");
  header.style.cssText = `
    padding: 10px 14px; border-bottom: 1px solid #3a3a3a; flex-shrink: 0;
  `;

  const titleRow = document.createElement("div");
  titleRow.style.cssText = "display: flex; align-items: center; gap: 8px; cursor: grab;";

  const menuBtn = makeIconButton(ICONS.panelLeft, "Menu", fg);
  titleRow.appendChild(menuBtn);

  const label = document.createElement("span");
  label.textContent = "Mimi";
  label.style.cssText = "font-weight: 600; flex: 1;";
  titleRow.appendChild(label);

  const closeBtn = makeIconButton(ICONS.x, "Close", fg);
  closeBtn.onclick = removeOverlay;
  titleRow.appendChild(closeBtn);

  titleRow.addEventListener("mousedown", (e) => {
    if (e.target.closest("button")) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startLeft = box.offsetLeft;
    const startTop = box.offsetTop;
    titleRow.style.cursor = "grabbing";

    function onMouseMove(moveEvent) {
      const maxLeft = window.innerWidth - 40;
      const maxTop = window.innerHeight - 40;
      const minLeft = -(box.offsetWidth - 40);
      const newLeft = Math.min(maxLeft, Math.max(minLeft, startLeft + moveEvent.clientX - startX));
      const newTop = Math.min(maxTop, Math.max(0, startTop + moveEvent.clientY - startY));
      box.style.left = newLeft + "px";
      box.style.top = newTop + "px";
    }

    function onMouseUp() {
      titleRow.style.cursor = "grab";
      savedPosition = { left: box.offsetLeft, top: box.offsetTop };
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  });

  header.appendChild(titleRow);

  const toolbar = document.createElement("div");
  toolbar.style.cssText = "display: flex; align-items: center; gap: 4px; margin-top: 8px; padding-top: 8px; border-top: 1px solid #3a3a3a;";

  if (!isError) {
    const saveBtn = makeIconButton(ICONS.bookmark, "Save as note", fg);
    saveBtn.onclick = async () => {
      await saveNote(topic, text);
      saveBtn.innerHTML = ICONS.check;
      saveBtn.title = "Saved";
      saveBtn.setAttribute("aria-label", "Saved");
      saveBtn.disabled = true;
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

  function applyZoom() {
    p.style.fontSize = fontSize + "px";
  }

  const zoomOutBtn = makeIconButton(ICONS.zoomOut, "Zoom out", fg);
  zoomOutBtn.onclick = () => {
    fontSize = Math.max(MIN_FONT_SIZE, fontSize - 2);
    applyZoom();
  };
  toolbar.appendChild(zoomOutBtn);

  const zoomInBtn = makeIconButton(ICONS.zoomIn, "Zoom in", fg);
  zoomInBtn.onclick = () => {
    fontSize = Math.min(MAX_FONT_SIZE, fontSize + 2);
    applyZoom();
  };
  toolbar.appendChild(zoomInBtn);

  header.appendChild(toolbar);
  box.appendChild(header);

  const body = document.createElement("div");
  body.style.cssText = "padding: 12px 14px; overflow-y: auto;";

  const p = document.createElement("p");
  p.style.cssText = `margin: 0; white-space: pre-wrap; font-size: ${fontSize}px;`;
  p.textContent = text;
  body.appendChild(p);

  const menuView = document.createElement("div");
  menuView.hidden = true;
  const notesItem = makeListButton("Notes", fg, false);
  notesItem.title = "View saved notes";
  notesItem.onclick = () => setView("notes");
  menuView.appendChild(notesItem);
  body.appendChild(menuView);

  const notesView = document.createElement("div");
  notesView.hidden = true;
  body.appendChild(notesView);

  async function renderNotes() {
    const { notes = [] } = await browser.storage.local.get("notes");
    notesView.innerHTML = "";

    if (notes.length === 0) {
      const empty = document.createElement("p");
      empty.style.cssText = "margin: 0; color: #a8a8a8;";
      empty.textContent = "No notes saved yet.";
      notesView.appendChild(empty);
      return;
    }

    notes
      .slice()
      .sort((a, b) => b.created - a.created)
      .forEach((note) => {
        const row = document.createElement("div");
        row.style.cssText = "margin-bottom: 4px; padding-bottom: 8px; border-bottom: 1px solid #3a3a3a;";

        const topicBtn = makeListButton(note.topic, fg, true);
        topicBtn.title = "Show or hide this note's explanation";

        const explanationDiv = document.createElement("div");
        explanationDiv.hidden = true;
        explanationDiv.style.cssText = "padding: 0 8px 8px; white-space: pre-wrap; color: #a8a8a8;";
        explanationDiv.textContent = note.explanation;

        topicBtn.onclick = () => {
          explanationDiv.hidden = !explanationDiv.hidden;
        };

        row.appendChild(topicBtn);
        row.appendChild(explanationDiv);
        notesView.appendChild(row);
      });
  }

  let currentView = "explanation";

  function setView(view) {
    currentView = view;
    p.hidden = view !== "explanation";
    menuView.hidden = view !== "menu";
    notesView.hidden = view !== "notes";
    toolbar.hidden = view !== "explanation";

    if (view === "explanation") {
      label.textContent = "Mimi";
      menuBtn.innerHTML = ICONS.panelLeft;
      menuBtn.title = "Menu";
      menuBtn.setAttribute("aria-label", "Menu");
    } else if (view === "menu") {
      label.textContent = "Menu";
      menuBtn.innerHTML = ICONS.arrowLeft;
      menuBtn.title = "Back";
      menuBtn.setAttribute("aria-label", "Back");
    } else if (view === "notes") {
      label.textContent = "Notes";
      menuBtn.innerHTML = ICONS.arrowLeft;
      menuBtn.title = "Back to menu";
      menuBtn.setAttribute("aria-label", "Back to menu");
      renderNotes();
    }
  }

  menuBtn.onclick = () => {
    if (currentView === "explanation") setView("menu");
    else if (currentView === "menu") setView("explanation");
    else if (currentView === "notes") setView("menu");
  };

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
