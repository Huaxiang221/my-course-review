// 文件路径: app/actions.ts
"use server";

export async function getGeminiSummary(reviewsText: string) {
  // 1. 优先尝试读取环境变量
  let apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  // ⚠️⚠️⚠️ 调试专用：如果环境变量读不到，请把你的 Key 临时粘贴在下面引号里
  // 如果 .env.local 没生效，这里会作为备用
  const HARDCODED_KEY = process.env.GEMINI_API_KEY; // <--- 把 Key 贴在这里试试！例如 "AIzaSy..."
  
  if (!apiKey && HARDCODED_KEY) {
    apiKey = HARDCODED_KEY;
    console.log("Using Hardcoded Key for debugging...");
  }

  if (!apiKey) {
    console.error("❌ No API Key found.");
    return { success: false, error: "Missing API Key." };
  }

  // 2. 使用最底层的 fetch 请求 (绕过 SDK 问题)
  // 我们使用目前最通用的 gemini-1.5-flash
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        parts: [
          {
            text: `Summarize these lecturer reviews in 3 short sentences: ${reviewsText}`
          }
        ]
      }
    ]
  };

  try {
    console.log("🚀 Sending request to Google...");
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    // 3. 检查 Google 返回的具体错误
    if (!response.ok) {
      console.error("❌ Google API Error:", JSON.stringify(data, null, 2));
      return { 
        success: false, 
        error: data.error?.message || `Error ${response.status}: ${response.statusText}` 
      };
    }

    // 4. 提取结果
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!text) {
      return { success: false, error: "AI returned empty response." };
    }

    return { success: true, data: text };

  } catch (error: any) {
    console.error("❌ Network/Server Error:", error);
    return { success: false, error: error.message };
  }
}