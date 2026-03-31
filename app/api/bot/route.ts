import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Lấy Token của Bot từ biến môi trường
const TELEGRAM_TOKEN = process.env.NEXT_PUBLIC_TELEGRAM_TOKEN || "ĐIỀN_TOKEN_BOT_CỦA_SẾP_VÀO_ĐÂY";

// Hàm gửi tin nhắn qua Telegram
const sendMessage = async (chatId: number, text: string, replyMarkup: any = null) => {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  const body: any = { chat_id: chatId, text, parse_mode: 'HTML' };
  if (replyMarkup) body.reply_markup = replyMarkup;

  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. XỬ LÝ KHI SẾP BẤM NÚT "ĐÃ XONG" TRÊN TELEGRAM
    if (body.callback_query) {
      const chatId = body.callback_query.message.chat.id;
      const data = body.callback_query.data; // Ví dụ: "complete_12345"

      if (data.startsWith('complete_')) {
        const taskId = data.replace('complete_', '');
        
        // Cập nhật Supabase
        await supabase.from('reminders').update({ is_completed: true }).eq('id', taskId);
        
        // Báo lại cho sếp
        await sendMessage(chatId, `✅ Đã đánh dấu hoàn thành công việc!`);
      }
      return NextResponse.json({ ok: true });
    }

    // 2. XỬ LÝ KHI SẾP GÕ LỆNH (VD: /homnay, /baocao)
    if (body.message && body.message.text) {
      const chatId = body.message.chat.id;
      const text = body.message.text.toLowerCase();

      // LỆNH: /homnay
      if (text === '/homnay') {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const { data: tasks } = await supabase
          .from('reminders')
          .select('*')
          .eq('is_completed', false)
          .gte('due_time', todayStart.toISOString())
          .lte('due_time', todayEnd.toISOString());

        if (!tasks || tasks.length === 0) {
          await sendMessage(chatId, "🎉 Tuyệt vời sếp ơi, hôm nay không có việc nào tồn đọng!");
        } else {
          let msg = `📋 <b>CÔNG VIỆC HÔM NAY CỦA SẾP:</b>\n\n`;
          tasks.forEach(t => {
            msg += `🔸 <b>${t.title}</b> (${new Date(t.due_time).getHours()}:${new Date(t.due_time).getMinutes()})\n`;
          });
          await sendMessage(chatId, msg);
        }
      }

      // LỆNH: /baocao (Ví dụ báo cáo các việc đã xong)
      else if (text === '/baocao') {
        const { data: doneTasks } = await supabase
          .from('reminders')
          .select('*')
          .eq('is_completed', true);
        
        const count = doneTasks ? doneTasks.length : 0;
        await sendMessage(chatId, `📊 <b>BÁO CÁO NHANH:</b>\nSếp đã hoàn thành tổng cộng <b>${count}</b> công việc! Tiến độ rất tốt 🚀`);
      }
      
      else {
        await sendMessage(chatId, "🤖 Dạ sếp, em đang nghe đây! Sếp gõ /homnay hoặc /baocao để xem nhé.");
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Lỗi Webhook:", error);
    return NextResponse.json({ ok: false });
  }
}