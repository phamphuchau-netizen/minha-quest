import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Dùng lệnh GET để chúng ta có thể dễ dàng test trên trình duyệt
export async function GET() {
  try {
    // 1. Lấy thời gian hiện tại
    const now = new Date();

    // 2. Quét kho dữ liệu lấy các công việc CHƯA HOÀN THÀNH và CÓ HẠN CHÓT
    const { data: tasks, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('is_completed', false)
      .not('due_time', 'is', null);

    if (error) throw error;

    // 3. Dò tìm xem có việc nào sắp hết hạn trong 30 phút tới không
    const tasksToRemind = tasks?.filter((task) => {
      // Bỏ qua nếu đã nhắc rồi
      if (task.is_reminded_30m) return false; 

      const taskTime = new Date(task.due_time).getTime();
      const timeDiff = taskTime - now.getTime(); // Tính khoảng cách thời gian (bằng mili-giây)

      // Kiểm tra: Còn lớn hơn 0 phút và nhỏ hơn hoặc bằng 30 phút (30 * 60 * 1000 mili-giây)
      return timeDiff > 0 && timeDiff <= 30 * 60 * 1000;
    }) || [];

    if (tasksToRemind.length === 0) {
      return NextResponse.json({ message: "Không có việc nào cần nhắc gấp lúc này." });
    }

    // 4. Chuẩn bị gọi Telegram
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    // 5. Gửi tin nhắn cho TỪNG công việc sắp đến hạn
    for (const task of tasksToRemind) {
      const timeString = new Date(task.due_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const message = `🚨 BÁO ĐỘNG ĐỎ SẾP ƠI!\n👉 Việc: "${task.title}"\n⏰ Sẽ hết hạn lúc ${timeString} (chỉ còn chưa tới 30 phút nữa!).\nSếp làm ngay đi nhé!`;

      // Gửi Telegram
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT_ID, text: message }),
      });

      // Đánh dấu vào Supabase là "ĐÃ NHẮC" để lần sau không bị spam nữa
      await supabase
        .from('reminders')
        .update({ is_reminded_30m: true })
        .eq('id', task.id);
    }

    return NextResponse.json({ 
      success: true, 
      message: `Đã phát hiện và nhắc nhở thành công ${tasksToRemind.length} công việc!` 
    });

  } catch (error) {
    console.error("Lỗi Cron:", error);
    return NextResponse.json({ success: false, error: "Có lỗi xảy ra khi chạy tuần tra" }, { status: 500 });
  }
}