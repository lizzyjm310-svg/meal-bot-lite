// api/chat.js  (Vercel serverless function — no framework needed)
export default async function handler(req, res) {
  try {
    const body = req.method === "POST" ? await getBody(req) : {};
    const prompt = body.prompt || "Give me a simple dinner idea.";

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    }

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are Meal Planning Bot (Lite). Be budget-friendly, gluten-free, dairy-free, low-carb, high-protein. Give 3 options per meal, a 3-day plan, one consolidated shopping list, and batch-prep steps. Keep prep under 15 minutes and include protein grams. If the user asks for more depth (7-day plan, snack ladder, CSV), suggest upgrading to All-Access.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    const data = await r.json();
    const text =
      data?.choices?.[0]?.message?.content ||
      data?.error?.message ||
      "No response";
    res.status(200).json({ reply: text });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}

// helper to read POST body when not using a framework
function getBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}
