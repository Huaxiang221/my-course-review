// 文件路径：app/api/translate/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // 假设你使用之前生成 Summary 的 GEMINI_API_KEY
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key is missing" }, { status: 500 });
    }

    // 调用 Gemini API 进行翻译
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
      throw new Error(data.error?.message || "Translation API failed");
    }

    const translatedText = data.candidates[0].content.parts[0].text.trim();

    return NextResponse.json({ translatedText });
  } catch (error: any) {
    console.error("Translation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}