import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // 1. Tính toán khoảng thời gian "Hôm nay" theo giờ Việt Nam (UTC+7)
    const now = new Date();
    const vnTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    const startOfDay = new Date(vnTime.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(vnTime.setHours(23, 59, 59, 999)).toISOString();

    // 2. Lấy tất cả task trong ngày hôm nay
    const { data: tasks, error } = await supabase
      .from('reminders')
      .select('*')
      .gte('due_time', startOfDay)
      .lte('due_time', endOfDay);

    if (error) throw error;

    const allTasks = tasks || [];
    const completed = allTasks.filter(t => t.is_completed).length;
    const pending = allTasks.filter(t => !t.is_completed);

    // 3. Soạn nội dung báo cáo
    let message = `📊 **TỔNG KẾT NGÀY HÔM NAY** 📊\n\n`;
    message += `✅ Đã hoàn thành: ${completed}/${allTasks.length} việc\n`;
    
    if (pending.length > 0) {
      message += `❌ Các việc còn tồn đọng:\n`;
      pending.forEach((t, i) => {
        message += `${i + 1}. ${t.title}\n`;
      });
      message += `\nSếp nhớ hoàn thành sớm nhé! 💪`;
    } else {
      message += `\n🎉 Tuyệt vời! Sếp đã hoàn thành hết việc hôm nay. Nghỉ ngơi thôi sếp ơi! 🍻`;
    }

    // 4. Gửi qua Telegram
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (BOT_TOKEN && CHAT_ID) {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT_ID, text: message, parse_mode: 'Markdown' }),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}