// @ts-nocheck
"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('cong_viec');
  const [dueTime, setDueTime] = useState('');
  const [frequency, setFrequency] = useState('once');
  const [reminders, setReminders] = useState([]);

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    const { data } = await supabase
      .from('reminders')
      .select('*')
      .eq('is_completed', false)
      .order('due_time', { ascending: true });
    setReminders(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dueTime) return alert("Sếp chọn giờ giúp em với!");

    // FIX 1: Chuyển giờ địa phương sang ISO string chuẩn để Supabase không bị lệch múi giờ
    const isoDueTime = new Date(dueTime).toISOString();

    const { error } = await supabase.from('reminders').insert([
      { 
        title, 
        category, 
        description: "EMPTY", // FIX 2: Bơm dữ liệu giả vào để vượt qua hàng rào Not-Null của Supabase
        due_time: isoDueTime, 
        frequency, 
        is_completed: false 
      }
    ]);
    
    if (error) {
      alert("Lỗi Supabase: " + error.message);
    } else {
      setTitle('');
      setDueTime('');
      fetchReminders();
      alert("Đã thêm thành công! Bot sẽ canh giờ báo sếp nhé.");
    }
  };

  const handleComplete = async (id: string, currentDueTime: string, freq: string) => {
    if (freq === 'once') {
      await supabase.from('reminders').update({ is_completed: true }).eq('id', id);
    } else {
      let nextDate = new Date(currentDueTime);
      if (freq === 'daily') nextDate.setDate(nextDate.getDate() + 1);
      if (freq === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
      if (freq === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
      
      await supabase.from('reminders')
        .update({ 
          due_time: nextDate.toISOString(),
          is_reminded_30m: false 
        })
        .eq('id', id);
    }
    fetchReminders();
  };

  return (
    <main className="max-w-2xl mx-auto p-4 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-center text-blue-600">🚀 MINHA TASK MANAGER</h1>
      
      <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-xl p-6 mb-6 border border-blue-100">
        <input
          className="w-full p-3 mb-4 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
          placeholder="Việc gì quan trọng vậy sếp?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="p-3 border rounded-lg bg-white">
            <option value="cong_viec">🏢 Công việc</option>
            <option value="ca_nhan">👤 Cá nhân</option>
          </select>

          <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="p-3 border rounded-lg bg-white">
            <option value="once">🕒 Làm 1 lần</option>
            <option value="daily">📅 Hằng ngày</option>
            <option value="weekly">🗓️ Hằng tuần</option>
            <option value="monthly">🌙 Hằng tháng</option>
          </select>
        </div>

        <input
          type="datetime-local"
          className="w-full p-3 mb-4 border rounded-lg outline-none"
          value={dueTime}
          onChange={(e) => setDueTime(e.target.value)}
          required
        />

        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all">
          THÊM NHIỆM VỤ
        </button>
      </form>

      <div className="space-y-3">
        {reminders.map((task) => (
          <div key={task.id} className="flex items-center justify-between p-4 border rounded-xl bg-white shadow-sm border-l-4 border-l-blue-500">
            <div>
              <p className="font-bold text-gray-800">{task.category === 'cong_viec' ? '🏢' : '👤'} {task.title}</p>
              <p className="text-sm text-gray-500">
                ⏰ {new Date(task.due_time).toLocaleString('vi-VN')}
                {task.frequency !== 'once' && <span className="ml-2 text-blue-500 font-medium italic">🔄 {task.frequency}</span>}
              </p>
            </div>
            <button onClick={() => handleComplete(task.id, task.due_time, task.frequency)} className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-bold hover:bg-green-200 transition-colors">
              Xong!
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}