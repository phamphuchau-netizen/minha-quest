import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const now = new Date();
    const { data: tasks, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('is_completed', false)
      .not('due_time', 'is', null);

    if (error) throw error;

    const allTasks: any[] = tasks || [];
    
    const tasksToRemind: any[] = allTasks.filter((task: any) => {
      if (task.is_reminded_30m) return false; 
      const taskTime = new Date(task.due_time).getTime();
      const timeDiff = taskTime - now.getTime();
      return timeDiff > 0 && timeDiff <= 30 * 60 * 1000;
    });

    if (tasksToRemind.length > 0) {
      const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
      const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

      for (const task of tasksToRemind) {
        const timeString = new Date(task.due_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        const message = `🚨 BÁO ĐỘNG ĐỎ SẾP ƠI!\n👉 Việc: "${task.title}"\n⏰ Sẽ hết hạn lúc ${timeString} (chỉ còn chưa tới 30 phút nữa!).\nSếp làm ngay đi nhé!`;

        if (BOT_TOKEN && CHAT_ID) {
          await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: CHAT_ID, text: message }),
          });
        }

        await supabase
          .from('reminders')
          .update({ is_reminded_30m: true })
          .eq('id', task.id);
      }
    }

    return NextResponse.json({ success: true, count: tasksToRemind.length });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}