"use client";
import { useState, useEffect } from "react";
// SẾP LƯU Ý: Đảm bảo dòng import supabase này đúng với file cấu hình của sếp nhé (ví dụ: '@/lib/supabase' hoặc thư mục tương đương)
import { supabase } from "@/lib/supabase"; 

export default function Home() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Công việc");
  const [recurrence, setRecurrence] = useState("Làm 1 lần");
  const [deadline, setDeadline] = useState("");
  const [endTime, setEndTime] = useState(""); 
  const [editingId, setEditingId] = useState(null); 

  // 1. Hàm lấy dữ liệu từ Supabase khi mở web
  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .order('deadline', { ascending: true });
    
    if (data) setTasks(data);
    if (error) console.error("Lỗi tải dữ liệu:", error);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // 2. Hàm Lưu (Thêm mới hoặc Cập nhật)
  const handleSaveTask = async () => {
    if (!title || !deadline) {
      alert("Sếp vui lòng nhập đủ Tên công việc và Hạn chót nhé!");
      return;
    }

    const taskData = {
      title,
      type,
      recurrence,
      deadline,
      end_time: endTime || null, // Nếu không chọn ngày kết thúc thì để null
    };

    if (editingId) {
      // Đang ở chế độ Sửa -> Cập nhật dữ liệu
      const { error } = await supabase.from('reminders').update(taskData).eq('id', editingId);
      if (error) alert("Lỗi khi cập nhật!");
    } else {
      // Thêm mới
      const { error } = await supabase.from('reminders').insert([taskData]);
      if (error) alert("Lỗi khi thêm mới!");
    }

    // Xong việc thì reset form và tải lại danh sách
    handleCancelEdit();
    fetchTasks();
  };

  // 3. Hàm bấm Sửa (Đẩy dữ liệu lên form)
  const handleEdit = (task) => {
    setEditingId(task.id);
    setTitle(task.title);
    setType(task.type);
    setRecurrence(task.recurrence);
    setDeadline(task.deadline);
    setEndTime(task.end_time || "");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 4. Hàm Hủy Sửa (Làm trống form)
  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle("");
    setDeadline("");
    setEndTime("");
  };

  // 5. Hàm bấm "Xong!" (Xóa công việc)
  const handleComplete = async (id) => {
    const { error } = await supabase.from('reminders').delete().eq('id', id);
    if (!error) {
      fetchTasks(); // Tải lại danh sách sau khi xóa
    }
  };

  // Phân loại công việc để hiển thị 2 cột
  const personalTasks = tasks.filter(t => t.type === "Cá nhân");
  const workTasks = tasks.filter(t => t.type === "Công việc");

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-800">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-center text-blue-600 mb-6 flex items-center justify-center gap-2">
          🚀 MINHA TASK MANAGER
        </h1>

        {/* Form Thêm/Sửa Công Việc */}
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-md border border-gray-100 mb-8 max-w-lg mx-auto">
          <input
            type="text"
            placeholder="Việc gì quan trọng vậy sếp?"
            className="w-full p-3 border rounded-lg mb-4 focus:ring-2 focus:ring-blue-500"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4 mb-4">
            <select className="p-3 border rounded-lg w-full" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="Công việc">🏢 Công việc</option>
              <option value="Cá nhân">👤 Cá nhân</option>
            </select>
            <select className="p-3 border rounded-lg w-full" value={recurrence} onChange={(e) => setRecurrence(e.target.value)}>
              <option value="Làm 1 lần">⏱ Làm 1 lần</option>
              <option value="Hàng ngày">🔄 Hàng ngày</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Bắt đầu / Hạn chót</label>
              <input
                type="datetime-local"
                className="w-full p-3 border rounded-lg"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Kết thúc (Tùy chọn)</label>
              <input
                type="datetime-local"
                className="w-full p-3 border rounded-lg"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={handleSaveTask}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition"
            >
              {editingId ? "CẬP NHẬT NHIỆM VỤ" : "THÊM NHIỆM VỤ"}
            </button>
            {editingId && (
              <button 
                onClick={handleCancelEdit} 
                className="w-1/3 bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 rounded-lg transition"
              >
                HỦY
              </button>
            )}
          </div>
        </div>

        {/* Danh sách Công việc - CHIA 2 CỘT */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Cột 1: Công việc */}
          <div>
            <h2 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2">🏢 Danh sách Công việc</h2>
            <div className="space-y-3">
              {workTasks.map((task) => (
                <div key={task.id} className="bg-white border-l-4 border-blue-500 p-4 rounded-lg shadow-sm flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-gray-800">{task.title}</h3>
                    <p className="text-sm text-gray-500">Bắt đầu: {new Date(task.deadline).toLocaleString()}</p>
                    {task.end_time && (
                      <p className="text-sm text-gray-500">Kết thúc: {new Date(task.end_time).toLocaleString()}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(task)} className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded-md text-sm font-bold">
                      Sửa
                    </button>
                    <button onClick={() => handleComplete(task.id)} className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1 rounded-md text-sm font-bold">
                      Xong!
                    </button>
                  </div>
                </div>
              ))}
              {workTasks.length === 0 && <p className="text-gray-400 text-sm italic">Chưa có công việc nào.</p>}
            </div>
          </div>

          {/* Cột 2: Cá nhân */}
          <div>
            <h2 className="text-xl font-bold text-gray-700 mb-4 border-b pb-2">👤 Danh sách Cá nhân</h2>
            <div className="space-y-3">
              {personalTasks.map((task) => (
                <div key={task.id} className="bg-white border-l-4 border-orange-400 p-4 rounded-lg shadow-sm flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-gray-800">{task.title}</h3>
                    <p className="text-sm text-gray-500">Bắt đầu: {new Date(task.deadline).toLocaleString()}</p>
                    {task.end_time && (
                      <p className="text-sm text-gray-500">Kết thúc: {new Date(task.end_time).toLocaleString()}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(task)} className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded-md text-sm font-bold">
                      Sửa
                    </button>
                    <button onClick={() => handleComplete(task.id)} className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1 rounded-md text-sm font-bold">
                      Xong!
                    </button>
                  </div>
                </div>
              ))}
              {personalTasks.length === 0 && <p className="text-gray-400 text-sm italic">Chưa có công việc nào.</p>}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}