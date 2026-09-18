const input = document.getElementById("groq-key");
const status = document.getElementById("status");
const editBtn = document.getElementById("edit");
const saveBtn = document.getElementById("save");
const toggleBtn = document.getElementById("toggle");

function setLocked(locked) {
  input.disabled = locked;
  editBtn.hidden = !locked;
  saveBtn.hidden = locked;
  if (locked) {
    input.type = "password";
    toggleBtn.textContent = "Show";
  }
}

browser.storage.local.get("groqApiKey").then(({ groqApiKey }) => {
  if (groqApiKey) {
    input.value = groqApiKey;
    setLocked(true);
  } else {
    setLocked(false);
  }
});

editBtn.addEventListener("click", () => {
  setLocked(false);
  input.focus();
});

saveBtn.addEventListener("click", async () => {
  await browser.storage.local.set({ groqApiKey: input.value.trim() });
  setLocked(true);
  status.textContent = "Saved.";
  setTimeout(() => { status.textContent = ""; }, 1500);
});

toggleBtn.addEventListener("click", () => {
  const showing = input.type === "text";
  input.type = showing ? "password" : "text";
  toggleBtn.textContent = showing ? "Show" : "Hide";
});
