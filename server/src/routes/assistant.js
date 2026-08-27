import { Router } from "express";

const router = Router();

const SYSTEM_PROMPT = `You are the friendly on-site assistant for DragonByte, a cybersecurity community website.
Help visitors understand what DragonByte offers and where to find things on the site.

Key facts about DragonByte:
- Founded by Sanjai Rathinam. Mission: Learn, Build, Practice, Compete, Defend — together as a community.
- Pages: Home (/index.html), About (/about.html), Community (/community.html), Learn (/learn.html),
  Events (/events.html), Projects (/projects.html), Join (/join.html), Contact (/contact.html).
- CTF Arena is a separate live platform at https://dragonbyte-ctf-web.vercel.app/ (opens in a new tab).
- People can join the community via the Join page, the WhatsApp group, or the LinkedIn group (links are in the site footer and homepage).
- Events page lists upcoming workshops, meetups and CTF nights. Projects page showcases open-source security tools built by members.

Keep answers short (2-4 sentences), warm, and practical. If asked something outside DragonByte/cybersecurity basics,
answer briefly and steer back to how DragonByte can help. If you don't know something specific about the site
(e.g. exact event dates), tell the visitor to check the relevant page or use the Contact form instead of guessing.`;

// Public: chat with the site assistant
router.post("/chat", async (req, res) => {
  const { messages } = req.body || {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array is required" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error:
        "The AI assistant isn't configured yet. Add ANTHROPIC_API_KEY to server/.env to enable it.",
    });
  }

  if (typeof fetch !== "function") {
    console.error(
      `Assistant chat error: global fetch is not available (Node ${process.version}). ` +
        "Node.js 18 or newer is required. Download the latest LTS from https://nodejs.org and reinstall.",
    );
    return res.status(500).json({
      error: `Your server is running Node.js ${process.version}, which is too old for the AI assistant (needs Node 18+). Please update Node.js from nodejs.org and restart the server.`,
    });
  }

  // Keep the request small and safe: cap history length and message size.
  const trimmed = messages.slice(-12).map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: String(m.content || "").slice(0, 2000),
  }));

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages: trimmed,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic API error:", response.status, errText);
      let userMessage = "The assistant is temporarily unavailable. Please try again shortly.";
      if (errText.includes("credit balance is too low")) {
        userMessage = "The AI assistant's Anthropic account needs credits added at console.anthropic.com (Plans & Billing) before it can respond.";
      } else if (response.status === 401) {
        userMessage = "The AI assistant's API key looks invalid. Please check ANTHROPIC_API_KEY in server/.env.";
      }
      return res.status(502).json({ error: userMessage });
    }

    const data = await response.json();
    const reply = (data.content || [])
      .map((block) => (block.type === "text" ? block.text : ""))
      .filter(Boolean)
      .join("\n")
      .trim();

    res.json({ reply: reply || "Sorry, I didn't catch that — could you rephrase?" });
  } catch (err) {
    // Log full diagnostic detail server-side; keep the browser-facing message safe.
    console.error("Assistant chat error:", err.code || err.name, "-", err.message);
    let userMessage = "Something went wrong talking to the assistant. Check the server terminal for details.";
    if (err.cause?.code === "ENOTFOUND" || err.code === "ENOTFOUND") {
      userMessage = "The server couldn't reach the internet (DNS lookup failed). Check your network connection.";
    } else if (err.cause?.code === "ECONNREFUSED" || err.code === "ECONNREFUSED") {
      userMessage = "The connection to Anthropic was refused — check your network/firewall settings.";
    }
    res.status(500).json({ error: userMessage });
  }
});

export default router;
