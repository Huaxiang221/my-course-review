"use server";

export async function getGeminiSummary(reviewsText: string) {
  // 🌟 同样，只保留最纯粹的环境变量读取方式，去掉容易引发 Bug 的备用逻辑
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error("❌ No API Key found in Vercel.");
    return { success: false, error: "服务器缺少 API Key" };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

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

    if (!response.ok) {
      console.error("❌ Google API Error:", JSON.stringify(data, null, 2));
      return { 
        success: false, 
        error: data.error?.message || `Error ${response.status}: ${response.statusText}` 
      };
    }

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