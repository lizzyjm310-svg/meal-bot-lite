// api/chat.js — conversational endpoint
export default async function handler(req, res) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    }
    const SYSTEM_PROMPT =
      process.env.SYSTEM_PROMPT || "You are a helpful meal-planning assistant.";

    const body = req.method === "POST" ? await getBody(req) : {};
    // Expect messages: [{ role: 'user'|'assistant', content: '...' }, ...]
    const messages = Array.isArray(body.messages) ? body.messages : [];
    const finalMessages = [{ role: "system", content: SYSTEM_PROMPT }, ...messages];

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: finalMessages,
        temperature: 0.6,
      }),
    });

    if (!r.ok) {
      return res
        .status(r.status)
        .json({ reply: "I’m at capacity—please try again shortly." });
    }
    const data = await r.json();
    const text = data?.choices?.[0]?.message?.content || "No response.";
    res.status(200).json({ reply: text });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}

function getBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => {
      try { resolve(data ? JSON.parse(data) : {}); }
      catch (err) { reject(err); }
    });
    req.on("error", reject);
  });
}
