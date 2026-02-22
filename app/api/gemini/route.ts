import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { reviewsText } = await request.json();

    // 🌟 只需要这干净利落的一行，直接读取服务器环境变量
    const apiKey = process.env.GEMINI_API_KEY; 

    if (!apiKey) {
      console.error("❌ API Key is missing in Vercel Environment Variables!");
      return NextResponse.json({ error: "服务器缺少 API Key，请检查 Vercel 设置" }, { status: 500 });
    }

    const modelName = "gemini-flash-latest";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    
    console.log(`🚀 正在连接 Google (${modelName})...`);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            // 👇 强力三语魔法指令就在这里！
            text: `You are a helpful university assistant. 
            Read the following lecturer reviews and provide a concise summary.
            
            ⚠️ CRITICAL INSTRUCTION: You MUST output the summary in EXACTLY THREE languages. Do NOT give me only one language. Follow this EXACT format with the emojis:
            
            🇬🇧 **English Summary:**
            (Summarize the reviews here in 2-3 sentences)
            
            🇲🇾 **Ringkasan Bahasa Melayu:**
            (Summarize the reviews here in 2-3 sentences)
            
            🇨🇳 **中文总结:**
            (Summarize the reviews here in 2-3 sentences)
            
            Here are the reviews:
            ${reviewsText}`
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