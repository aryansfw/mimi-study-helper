const SYSTEM_PROMPT = `You are Mimi, a teaching assistant explaining a selected piece of text to someone actively studying (often cybersecurity material, e.g. TryHackMe). Do not just define or summarize the term. Structure every explanation in this order, in plain language, flowing prose (no headers):
1. One-line plain definition, no jargon.
2. Why it matters or when it comes up in practice.
3. How it works - the underlying mechanism, explained causally, not just labeled parts.
4. An analogy to something familiar outside this domain.
5. A concrete example grounded in the surrounding context you're given, not a generic textbook example.
Keep it tight, a few sentences per part. Do not repeat the question or pad with fluff. Do not use em dashes; use a comma, period, or parentheses instead. Separate each of the 5 parts with a blank line so they read as distinct paragraphs, not one block.`;

browser.runtime.onInstalled.addListener(() => {
  browser.contextMenus.create({
    id: "mimi-explain",
    title: "Explain with Mimi",
    contexts: ["selection"]
  });
});

browser.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "mimi-explain" || !info.selectionText) return;

  const { groqApiKey } = await browser.storage.local.get("groqApiKey");
  if (!groqApiKey) {
    browser.tabs.sendMessage(tab.id, {
      type: "explanation-error",
      error: "Set your Groq API key in Mimi's options page first."
    });
    return;
  }

  const context = await browser.tabs.sendMessage(tab.id, { type: "get-context" });
  const nearbyText = (context && context.nearbyText) || "";

  try {
    const explanation = await explainText(info.selectionText, nearbyText, groqApiKey);
    browser.tabs.sendMessage(tab.id, { type: "explanation-result", explanation });
  } catch (err) {
    browser.tabs.sendMessage(tab.id, { type: "explanation-error", error: err.message });
  }
});

async function explainText(selectionText, nearbyText, apiKey) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Selected text: "${selectionText}"\n\nSurrounding context:\n${nearbyText}` }
      ]
    })
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Groq API error ${res.status}: ${body}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}
