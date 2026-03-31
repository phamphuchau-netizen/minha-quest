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
    const pendingTasks: any[] = tasks || [];

    if (pendingTasks.length === 0) {
      message = '🌅 Chào buổi sáng sếp Phúc Hậu!\nHiện tại sếp không có công việc nào tồn đọng cả. Chúc sếp một ngày mới thảnh thơi nhé! ☕';
    } else {
      message = `🌅 Chào buổi sáng sếp Phúc Hậu!\nDưới đây là ${pendingTasks.length} việc sếp cần xử lý:\n\n`;
      
      let index = 1;
      for (const task of pendingTasks) {
        const cat = task.category === 'cong_viec' ? '🏢' : '👤';
        let timeStr = '';
        if (task.due_time) {
          // 👉 ĐÃ FIX: Ép múi giờ hiển thị luôn luôn là giờ Việt Nam
          timeStr = ` (⏰ ${new Date(task.due_time).toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' })})`;
        }
        message += `${index}. ${cat} ${task.title}${timeStr}\n`;
        index++;
      }
      
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
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}