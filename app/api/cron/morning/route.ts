import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: tasks, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('is_completed', false);

    if (error) throw error;

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    let message = '';
    // Ép kiểu cực mạnh ở đây để Vercel không báo lỗi type 'never'
    const pendingTasks: any[] = tasks || [];

    if (pendingTasks.length === 0) {
      message = '🌅 Chào buổi sáng sếp Phúc Hậu!\nHiện tại sếp không có công việc nào tồn đọng cả. Chúc sếp một ngày mới thảnh thơi nhé! ☕';
    } else {
      message = `🌅 Chào buổi sáng sếp Phúc Hậu!\nDưới đây là ${pendingTasks.length} việc sếp cần xử lý hôm nay:\n\n`;
      pendingTasks.forEach((task: any, index: number) => {
        const cat = task.category === 'cong_viec' ? '🏢' : '👤';
        const time = task.due_time ? ` (⏰ ${new Date(task.due_time).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})})` : '';
        message += `${index + 1}. ${cat} ${task.title}${time}\n`;
      });
      message += '\nSếp cố gắng hoàn thành nhé! 💪';
    }

    if (BOT_TOKEN && CHAT_ID) {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: CHAT_ID, text: message }),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}