import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // 🌟 1. 接收前端传来的四个核心参数
    const { reviewsText, averageRating, reviewCount, courseCode } = await request.json();

    const apiKey = process.env.GEMINI_API_KEY; 

    if (!apiKey) {
      console.error("❌ API Key is missing in Vercel Environment Variables!");
      return NextResponse.json({ error: "服务器缺少 API Key，请检查 Vercel 设置" }, { status: 500 });
    }

    const modelName = "gemini-flash-latest"; // 使用最新的 flash 模型
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    
    console.log(`🚀 正在连接 Google (${modelName})...`);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            // 👇 2. 强力 JSON & 完美开头指令
            text: `You are a helpful academic assistant summarizing student reviews for a university course (${courseCode}). 
            Here are the reviews: "${reviewsText}"

            Based on the reviews, provide a brief, objective summary of the course.
            
            ⚠️ CRITICAL INSTRUCTION 1: You MUST start the summary for EACH language with the translated version of this exact sentence:
            - For English: "Based on ${reviewCount} student reviews, ${courseCode} holds an average rating of ${averageRating}/5.0."
            - For Bahasa Melayu: "Berdasarkan ${reviewCount} ulasan pelajar, ${courseCode} mencatatkan purata rating ${averageRating}/5.0."
            - For Chinese: "综合 ${reviewCount} 条学生评价，${courseCode} 的平均得分为 ${averageRating}/5.0。"
            Then continue with the rest of the summary in that specific language.

            ⚠️ CRITICAL INSTRUCTION 2: You MUST return the output strictly in the following JSON format ONLY. 
            Do NOT include any markdown formatting like \`\`\`json. Just the raw JSON object.
            
            {
              "en": "[Insert English Summary here]",
              "ms": "[Insert Bahasa Melayu Summary here]",
              "zh": "[Insert Chinese Summary here]"
            }`
          }]
        }],
        // 🌟 3. 大厂级保险机制：强制 Gemini 的 API 只能返回 JSON 格式
        generationConfig: {
          responseMimeType: "application/json"
        }
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Google Error:", JSON.stringify(data, null, 2));
      return NextResponse.json({ error: data.error?.message || "Model error" }, { status: response.status });
    }

    // 提取 AI 返回的 JSON 字符串
    const summary = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    return NextResponse.json({ summary });

  } catch (error: any) {
    console.error("❌ Server Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}