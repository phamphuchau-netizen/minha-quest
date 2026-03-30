import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Lấy tất cả các việc chưa hoàn thành
    const { data: tasks, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('is_completed', false);

    if (error) throw error;

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    let message = '';

    if (!tasks || tasks.length === 0) {
      message = '🌅 Chào buổi sáng sếp Phúc Hậu!\nHiện tại sếp không có công việc nào tồn đọng cả. Chúc sếp một ngày mới thảnh thơi và tràn đầy năng lượng nhé! ☕';
    } else {
      message = `🌅 Chào buổi sáng sếp Phúc Hậu!\nChúc sếp một ngày làm việc năng suất. Dưới đây là ${tasks.length} việc sếp cần xử lý:\n\n`;
      tasks.forEach((task, index) => {
        const cat = task.category === 'cong_viec' ? '🏢' : '👤';
        const time = task.due_time ? ` (⏰ ${new Date(task.due_time).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})})` : '';
        message += `${index + 1}. ${cat} ${task.title}${time}\n`;
      });
      message += '\nSếp cố gắng hoàn thành nhé! 💪';
    }

    // Gửi Telegram
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text: message }),
    });

    return NextResponse.json({ success: true, message: "Đã gửi báo cáo buổi sáng!" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Lỗi rồi" }, { status: 500 });
  }
}