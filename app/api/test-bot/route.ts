import { NextResponse } from 'next/server';

export async function GET() {
  // Lấy Token và Chat ID từ file .env.local
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    return NextResponse.json({ 
      error: "Thiếu TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID. Bạn đã lưu trong .env.local chưa?" 
    }, { status: 400 });
  }

  // Nội dung tin nhắn gửi đi
  const message = "🎉 Xin chào Phúc Hậu! Mình là Trợ lý MinHa Taskbot đây. Mình đã kết nối thành công với dự án Next.js rồi nhé!";
  
  // Đường dẫn API của Telegram
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
      }),
    });

    const data = await response.json();

    if (data.ok) {
      return NextResponse.json({ success: true, message: "Đã gửi tin nhắn Telegram thành công! Hãy kiểm tra điện thoại của bạn." });
    } else {
      return NextResponse.json({ success: false, error: data.description }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: "Lỗi kết nối đến Telegram" }, { status: 500 });
  }
}