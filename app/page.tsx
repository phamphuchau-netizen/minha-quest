'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function ReminderPage() {
  const [reminders, setReminders] = useState<any[]>([])
  const [titleInput, setTitleInput] = useState('')
  const [category, setCategory] = useState('ca_nhan') // Mặc định là Cá nhân
  const [dueTime, setDueTime] = useState('') // Lưu thời gian
  const [loading, setLoading] = useState(true)

  const fetchReminders = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .order('id', { ascending: false })
    
    if (error) {
      console.error("Lỗi lấy dữ liệu:", error.message)
    } else {
      setReminders(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchReminders()
  }, [])

  const addReminder = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!titleInput.trim()) return

    // Lưu vào Supabase kèm Category và Due Time
    const { error } = await supabase
      .from('reminders')
      .insert([
        { 
          title: titleInput, 
          description: '', 
          is_completed: false,
          category: category,
          due_time: dueTime ? new Date(dueTime).toISOString() : null, // Chuyển đổi giờ chuẩn
          status: 'pending'
        }
      ]) 

    if (error) {
      alert("Lỗi rồi Phúc Hậu ơi: " + error.message)
    } else {
      const taskName = titleInput;
      const taskCat = category === 'cong_viec' ? '🏢 Công việc' : '👤 Cá nhân';
      const taskTime = dueTime ? `\n⏰ Hạn chót: ${new Date(dueTime).toLocaleString('vi-VN')}` : '';

      setTitleInput('')
      setDueTime('')
      fetchReminders()

      // Báo cáo qua Telegram chi tiết hơn
      try {
        await fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: `📝 Sếp vừa thêm việc mới!\n👉 ${taskName}\n🏷 Phân loại: ${taskCat}${taskTime}`
          })
        });
      } catch (err) {
        console.error("Lỗi gửi Telegram", err);
      }
    }
  }

  const toggleComplete = async (id: number, currentStatus: boolean, title: string) => {
    const { error } = await supabase
      .from('reminders')
      .update({ 
        is_completed: !currentStatus,
        status: !currentStatus ? 'completed' : 'pending' // Cập nhật cả cột status
      })
      .eq('id', id)
    
    if (!error) {
      fetchReminders()
      // Nếu vừa đánh dấu hoàn thành, báo luôn cho Telegram
      if (!currentStatus) {
        fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: `✅ Sếp đã hoàn thành việc:\n👉 ${title}\nQuá xuất sắc! 🎉` })
        });
      }
    }
  }

  const deleteReminder = async (id: number, title: string) => {
    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', id)
    
    if (!error) {
      fetchReminders()
      fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `🗑 Sếp đã xóa việc:\n👉 ${title}` })
      });
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 py-10 px-4">
      <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        
        <div className="bg-blue-600 p-6 text-white text-center">
          <h1 className="text-2xl font-bold tracking-tight">MINHA TECH</h1>
          <p className="text-blue-100 text-sm mt-1">Trợ lý nhắc việc của Phúc Hậu</p>
        </div>

        <div className="p-6">
          <form onSubmit={addReminder} className="flex flex-col gap-3 mb-8 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              placeholder="Bạn định làm gì tiếp theo?"
              className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-all text-slate-700"
            />
            
            <div className="flex gap-2">
              <select 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
                className="flex-1 border-2 border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 text-slate-700 bg-white"
              >
                <option value="ca_nhan">👤 Cá nhân</option>
                <option value="cong_viec">🏢 Công việc</option>
              </select>

              <input 
                type="datetime-local" 
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="flex-1 border-2 border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 text-slate-700 bg-white"
              />
            </div>

            <button 
              type="submit"
              className="w-full mt-1 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 active:scale-95 transition-all shadow-md"
            >
              Thêm công việc
            </button>
          </form>

          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : reminders.length > 0 ? (
              reminders.map((item) => (
                <div 
                  key={item.id}
                  className="group flex flex-col p-4 bg-slate-50 border border-slate-100 rounded-xl hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={item.is_completed}
                        onChange={() => toggleComplete(item.id, item.is_completed, item.title)}
                        className="w-5 h-5 cursor-pointer accent-blue-600 rounded"
                      />
                      <span className={`text-lg transition-all ${item.is_completed ? 'line-through text-slate-400' : 'text-slate-700 font-medium'}`}>
                        {item.title}
                      </span>
                    </div>
                    
                    <button 
                      onClick={() => deleteReminder(item.id, item.title)}
                      className="text-red-400 hover:text-red-600 p-2 transition-all"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Hiển thị thêm thông tin nhỏ ở dưới */}
                  <div className="flex gap-3 ml-8 mt-1 text-xs text-slate-500">
                    <span className="bg-slate-200 px-2 py-1 rounded-md">
                      {item.category === 'cong_viec' ? '🏢 Công việc' : '👤 Cá nhân'}
                    </span>
                    {item.due_time && (
                      <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-md">
                        ⏰ {new Date(item.due_time).toLocaleString('vi-VN')}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-slate-400">
                <p className="text-4xl mb-2">☕</p>
                <p>Không có việc gì cần làm cả!</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-slate-50 p-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400 font-medium">Vận hành bởi MinHa Tech & Supabase</p>
        </div>
      </div>
    </main>
  )
}