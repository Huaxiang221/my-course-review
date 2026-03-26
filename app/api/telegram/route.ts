import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { lecturerName, courseCode, comment, rating } = await req.json();

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      return NextResponse.json({ error: "Telegram config missing" }, { status: 500 });
    }

    // 组装你要在 Telegram 看到的文字排版 (支持 Markdown)
    const message = `🚨 *New Review Alert!*\n\n📚 *Course:* ${courseCode || 'Unknown'}\n👨‍🏫 *Lecturer:* ${lecturerName}\n⭐ *Rating:* ${rating}/5\n💬 *Comment:* ${comment}`;

    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    
    // 呼叫 Telegram API
    const response = await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown",
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to send Telegram message");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Telegram API Error:", error);
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
  }
}