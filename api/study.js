const modes = {
  reviewer: "Build a study reviewer with key concepts, examples, and common mistakes.",
  explanation: "Explain step by step in plain language, with a worked example.",
  flashcards: "Make eight flashcards with one concept per card.",
  quiz: "Make five practice questions with answers and short explanations.",
  summary: "Summarize the main ideas and essential details.",
};

const json = (body, status = 200) => Response.json(body, {
  status, headers: { "Cache-Control": "no-store" },
});

export async function POST(request) {
  let input;
  try {
    const body = await request.text();
    if (body.length > 60000) return json({ error: "Request too long." }, 413);
    input = JSON.parse(body);
  } catch {
    return json({ error: "Invalid request." }, 400);
  }
  const { mode, source } = input ?? {};
  if (typeof mode !== "string" || !Object.hasOwn(modes, mode) ||
      typeof source !== "string" || !source.trim() || source.length > 8000) {
    return json({ error: "Choose a study format and enter up to 8,000 characters." }, 400);
  }
  const key = process.env.GEMINI_API_KEY;
  if (!key) return json({ error: "The AI study tools need an API key configured on the server." }, 503);

  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: "You are a study tutor. Match the language of the topic or notes. Use plain text. Put questions in heading and answers in text. " + modes[mode] }] },
        contents: [{ parts: [{ text: source.trim() }] }],
        generationConfig: {
          maxOutputTokens: 3500,
          responseMimeType: "application/json",
          responseSchema: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: { heading: { type: "STRING" }, text: { type: "STRING" } },
              required: ["heading", "text"],
            },
          },
        },
      }),
    });
    if (response.status === 429) return json({ error: "AI usage limit reached. Try again later." }, 429);
    if (!response.ok) return json({ error: "The AI service is unavailable." }, 502);
    const data = await response.json();
    const candidate = data.candidates?.[0];
    const output = candidate?.content?.parts?.filter((part) => !part.thought).map((part) => part.text ?? "").join("");
    const sections = JSON.parse(output || "null");
    if (candidate?.finishReason !== "STOP" || !Array.isArray(sections) || !sections.length ||
        !sections.every((item) => typeof item?.heading === "string" && typeof item.text === "string")) {
      return json({ error: "No complete study material was generated. Try a narrower topic." }, 502);
    }
    return json({ sections });
  } catch {
    return json({ error: "The AI service did not return a usable result. Try again." }, 502);
  }
}
