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

    if (!tasks || tasks.length === 0) {
      message = '🌙 Chúc sếp Phúc Hậu ngủ ngon!\nHôm nay sếp đã hoàn thành xuất sắc mọi nhiệm vụ. Nghỉ ngơi thôi sếp ơi! 🛌';
    } else {
      message = `🌙 Đã muộn rồi sếp Phúc Hậu ơi!\nHôm nay sếp còn ${tasks.length} việc chưa kịp xong:\n\n`;
      tasks.forEach((task: any, index: number) => {
        const cat = task.category === 'cong_viec' ? '🏢' : '👤';
        message += `${index + 1}. ${cat} ${task.title}\n`;
      });
      message += '\nSếp nghỉ sớm lấy sức mai mình xử lý nốt nhé! Chúc sếp ngủ ngon 🛌';
    }

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text: message }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}