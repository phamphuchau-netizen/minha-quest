// @ts-nocheck
"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('cong_viec');
  const [dueTime, setDueTime] = useState('');
  const [endTime, setEndTime] = useState(''); // Thêm state cho ngày kết thúc
  const [frequency, setFrequency] = useState('once');
  const [reminders, setReminders] = useState([]);
  const [editingId, setEditingId] = useState(null); // Để biết đang sửa việc nào

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

    const isoDueTime = new Date(dueTime).toISOString();
    const isoEndTime = endTime ? new Date(endTime).toISOString() : null;

    const taskData = {
      title,
      category,
      description: "EMPTY", 
      due_time: isoDueTime,
      end_time: isoEndTime, // Lưu thêm giờ kết thúc
      frequency,
      is_completed: false
    };

    if (editingId) {
      // Đang Sửa
      const { error } = await supabase.from('reminders').update(taskData).eq('id', editingId);
      if (error) alert("Lỗi Supabase: " + error.message);
      else alert("Đã cập nhật xong!");
    } else {
      // Đang Thêm Mới
      const { error } = await supabase.from('reminders').insert([taskData]);
      if (error) alert("Lỗi Supabase: " + error.message);
      else alert("Đã thêm thành công! Bot sẽ canh giờ báo sếp nhé.");
    }

    // Reset form
    handleCancelEdit();
    fetchReminders();
  };

  // Hàm bấm Sửa
  const handleEdit = (task) => {
    setEditingId(task.id);
    setTitle(task.title);
    setCategory(task.category);
    setFrequency(task.frequency || 'once');
    // Cắt chuỗi ISO để nhét vừa vào input datetime-local
    if (task.due_time) setDueTime(new Date(task.due_time).toISOString().slice(0, 16));
    if (task.end_time) setEndTime(new Date(task.end_time).toISOString().slice(0, 16));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Hàm hủy Sửa
  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setDueTime('');
    setEndTime('');
    setFrequency('once');
    setCategory('cong_viec');
  };

  // Giữ nguyên logic lặp lại đỉnh cao của sếp
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

  // Lọc 2 cột dựa trên category chuẩn của sếp
  const workTasks = reminders.filter(t => t.category === 'cong_viec');
  const personalTasks = reminders.filter(t => t.category === 'ca_nhan');

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-800">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center text-blue-600">🚀 MINHA TASK MANAGER</h1>
        
        {/* FORM THÊM / SỬA */}
        <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-xl p-6 mb-8 border border-blue-100 max-w-lg mx-auto">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Bắt đầu / Hạn chót</label>
              <input
                type="datetime-local"
                className="w-full p-3 border rounded-lg outline-none"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Kết thúc (Tùy chọn)</label>
              <input
                type="datetime-local"
                className="w-full p-3 border rounded-lg outline-none"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all">
              {editingId ? "CẬP NHẬT NHIỆM VỤ" : "THÊM NHIỆM VỤ"}
            </button>
            {editingId && (
              <button type="button" onClick={handleCancelEdit} className="w-1/3 bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 rounded-lg transition">
                HỦY
              </button>
            )}
          </div>
        </form>

        {/* DANH SÁCH 2 CỘT */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* CỘT CÔNG VIỆC */}
          <div>
            <h2 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2">🏢 Danh sách Công việc</h2>
            <div className="space-y-3">
              {workTasks.map((task) => (
                <div key={task.id} className="bg-white border-l-4 border-blue-500 p-4 rounded-xl shadow-sm">
                  <div className="mb-3">
                    <p className="font-bold text-gray-800">{task.title}</p>
                    <p className="text-sm text-gray-500">⏰ Bắt đầu: {new Date(task.due_time).toLocaleString('vi-VN')}</p>
                    {task.end_time && (
                      <p className="text-sm text-gray-500">🏁 Kết thúc: {new Date(task.end_time).toLocaleString('vi-VN')}</p>
                    )}
                    {task.frequency !== 'once' && <span className="text-blue-500 font-medium text-sm italic inline-block mt-1">🔄 Lặp lại: {task.frequency}</span>}
                  </div>
                  <div className="flex gap-2 justify-end border-t pt-2">
                    <button onClick={() => handleEdit(task)} className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 px-3 py-1.5 rounded-md text-sm font-bold transition">
                      Sửa
                    </button>
                    <button onClick={() => handleComplete(task.id, task.due_time, task.frequency)} className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5 rounded-md text-sm font-bold transition">
                      Xong!
                    </button>
                  </div>
                </div>
              ))}
              {workTasks.length === 0 && <p className="text-gray-400 text-sm italic text-center py-4 bg-white rounded-xl">Chưa có công việc nào.</p>}
            </div>
          </div>

          {/* CỘT CÁ NHÂN */}
          <div>
            <h2 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2">👤 Danh sách Cá nhân</h2>
            <div className="space-y-3">
              {personalTasks.map((task) => (
                <div key={task.id} className="bg-white border-l-4 border-orange-400 p-4 rounded-xl shadow-sm">
                  <div className="mb-3">
                    <p className="font-bold text-gray-800">{task.title}</p>
                    <p className="text-sm text-gray-500">⏰ Bắt đầu: {new Date(task.due_time).toLocaleString('vi-VN')}</p>
                    {task.end_time && (
                      <p className="text-sm text-gray-500">🏁 Kết thúc: {new Date(task.end_time).toLocaleString('vi-VN')}</p>
                    )}
                    {task.frequency !== 'once' && <span className="text-orange-500 font-medium text-sm italic inline-block mt-1">🔄 Lặp lại: {task.frequency}</span>}
                  </div>
                  <div className="flex gap-2 justify-end border-t pt-2">
                    <button onClick={() => handleEdit(task)} className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 px-3 py-1.5 rounded-md text-sm font-bold transition">
                      Sửa
                    </button>
                    <button onClick={() => handleComplete(task.id, task.due_time, task.frequency)} className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5 rounded-md text-sm font-bold transition">
                      Xong!
                    </button>
                  </div>
                </div>
              ))}
              {personalTasks.length === 0 && <p className="text-gray-400 text-sm italic text-center py-4 bg-white rounded-xl">Chưa có việc cá nhân nào.</p>}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}