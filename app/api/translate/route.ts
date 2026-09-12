// 文件路径：app/api/translate/route.ts
import { NextResponse } from "next/server";

// 1. 调用 Gemini 翻译
async function translateWithGemini(text: string, apiKey: string) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Translate the following text into English. If it is already in English, just return the original text. Do not include any extra explanations or quotes, ONLY return the translated text:\n\n${text}`,
              },
            ],
          },
        ],
      }),
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || `Gemini error: ${response.status}`);
  }

  return data.candidates[0]?.content?.parts[0]?.text?.trim();
}

// 2. 备用调用 Groq 翻译
async function translateWithGroq(text: string, apiKey: string) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "qwen/qwen3.8-27b",
      messages: [
        {
          role: "system",
          content:
            "You are a translator. Translate the given text into natural English. If the text is already in English, return the original text directly. Do not include quotes, markdown formatting, or any extra explanation.",
        },
        { role: "user", content: text },
      ],
      temperature: 0.2,
      max_tokens: 500, // 限制 token 防止触发免费层 OTPM 上限
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || `Groq error: ${response.status}`);
  }

  return data.choices[0]?.message?.content?.trim();
}

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    // --- 优先尝试 Gemini ---
    if (geminiKey) {
      try {
        const translatedText = await translateWithGemini(text, geminiKey);
        if (translatedText) {
          return NextResponse.json({ translatedText, source: "gemini" });
        }
      } catch (geminiError: any) {
        console.warn("Gemini translation failed, falling back to Groq:", geminiError.message);
      }
    }

    // --- Gemini 失败或无 Key 时，触发 Groq 备选 ---
    if (groqKey) {
      try {
        const translatedText = await translateWithGroq(text, groqKey);
        if (translatedText) {
          return NextResponse.json({ translatedText, source: "groq" });
        }
      } catch (groqError: any) {
        console.error("Groq translation also failed:", groqError.message);
      }
    }

    throw new Error("All translation services are currently unavailable.");
  } catch (error: any) {
    console.error("Translation route error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}