const input = document.getElementById("groq-key");
const status = document.getElementById("status");

browser.storage.local.get("groqApiKey").then(({ groqApiKey }) => {
  if (groqApiKey) input.value = groqApiKey;
});

document.getElementById("save").addEventListener("click", async () => {
  await browser.storage.local.set({ groqApiKey: input.value.trim() });
  status.textContent = "Saved.";
  setTimeout(() => { status.textContent = ""; }, 1500);
});
