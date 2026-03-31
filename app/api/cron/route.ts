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
        if (BOT_TOKEN && CHAT_ID) {
          
          // 👉 ĐÃ FIX: Tạo nội dung tin nhắn đàng hoàng trước khi gửi
          const message = `🚨 Sếp ơi! Còn 30 phút nữa là đến hạn công việc:\n👉 [${task.category === 'cong_viec' ? '🏢' : '👤'}] ${task.title}`;

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
  } catch (error: any) {
    console.error("Lỗi Cronjob: ", error); // Ghi log lỗi ra nếu có
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}