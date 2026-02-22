import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { reviewsText } = await request.json();

    // 👇 确保这里是你的新 API Key
    const apiKey = process.env.GEMINI_API_KEY; 

    if (!apiKey || apiKey.includes("...")) {
      return NextResponse.json({ error: "请填入正确的 API Key" }, { status: 500 });
    }

    // 🌟 核心修改：使用 "gemini-flash-latest"
    // 这是一个通用别名，专门指向当前账号可用的最新免费 Flash 模型，不会有配额问题。
    const modelName = "gemini-flash-latest"; 
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    
    console.log(`🚀 正在连接 Google (${modelName})...`);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Summarize these lecturer reviews in 3 short sentences: ${reviewsText}`
          }]
        }]
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Google Error:", JSON.stringify(data, null, 2));
      return NextResponse.json({ error: data.error?.message || "Model error" }, { status: response.status });
    }

    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    return NextResponse.json({ summary });

  } catch (error: any) {
    console.error("❌ Server Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}