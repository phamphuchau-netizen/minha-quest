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
    const { error } = await supabase.from('reminders').insert([
      { 
        title, 
        category, 
        due_time: dueTime || null, 
        frequency, 
        is_completed: false 
      }
    ]);
    
    // ĐOẠN NÀY ĐỂ BẮT LỖI NÈ SẾP
    if (error) {
      console.error("Lỗi chi tiết:", error);
      alert("⚠️ Supabase báo lỗi sếp ơi: \n" + error.message);
    } else {
      setTitle('');
      setDueTime('');
      setFrequency('once');
      fetchReminders();
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
    <main className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-center">🚀 MINHA TECH - TASK MANAGER</h1>
      
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 border">
        <div className="mb-4">
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
            placeholder="Tên công việc sếp ơi..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <select 
            value={category} 
            onChange={(e) => setCategory(e.target.value)}
            className="block w-full border rounded py-2 px-3 bg-white"
          >
            <option value="cong_viec">🏢 Công việc</option>
            <option value="ca_nhan">👤 Cá nhân</option>
          </select>

          <select 
            value={frequency} 
            onChange={(e) => setFrequency(e.target.value)}
            className="block w-full border rounded py-2 px-3 bg-white"
          >
            <option value="once">🕒 Làm 1 lần</option>
            <option value="daily">📅 Hằng ngày</option>
            <option value="weekly">🗓️ Hằng tuần</option>
            <option value="monthly">🌙 Hằng tháng</option>
          </select>
        </div>

        <div className="mb-4">
          <input
            type="datetime-local"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:shadow-outline"
            value={dueTime}
            onChange={(e) => setDueTime(e.target.value)}
          />
        </div>

        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full">
          THÊM NHIỆM VỤ
        </button>
      </form>

      <div className="space-y-3">
        {reminders.map((task) => (
          <div key={task.id} className="flex items-center justify-between p-3 border rounded bg-gray-50">
            <div>
              <p className="font-semibold">{task.category === 'cong_viec' ? '🏢' : '👤'} {task.title}</p>
              <p className="text-xs text-gray-500">
                ⏰ {task.due_time ? new Date(task.due_time).toLocaleString('vi-VN') : 'Không hạn'} 
                {task.frequency !== 'once' && ` | 🔄 ${task.frequency}`}
              </p>
            </div>
            <button 
              onClick={() => handleComplete(task.id, task.due_time, task.frequency)}
              className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
            >
              Xong!
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}