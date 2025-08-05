import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { username, password, confirmPassword, email } = form;

    if (!username || !password || !confirmPassword || !email) {
      alert('กรุณากรอกข้อมูลให้ครบ');
      return;
    }

    if (password !== confirmPassword) {
      alert('รหัสผ่านไม่ตรงกัน');
      return;
    }

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          email,
          role: 'user',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'สมัครสมาชิกไม่สำเร็จ');
      }

      // **ลบ localStorage.setItem('user', ...) ออก**

      alert('สมัครสมาชิกสำเร็จ!');
      navigate('/login'); // ไปหน้า login หลังสมัคร
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-md p-8 w-full max-w-md">
        <h2 className="text-3xl font-bold mb-6 text-black text-center">สมัครสมาชิก</h2>

        <input
          type="text"
          name="username"
          placeholder="ชื่อผู้ใช้"
          value={form.username}
          onChange={handleChange}
          className="w-full border-b border-gray-300 py-2 mb-4 outline-none"
          required
        />

        <input
          type="password"
          name="password"
          placeholder="รหัสผ่าน"
          value={form.password}
          onChange={handleChange}
          className="w-full border-b border-gray-300 py-2 mb-4 outline-none"
          required
        />

        <input
          type="password"
          name="confirmPassword"
          placeholder="ยืนยันรหัสผ่าน"
          value={form.confirmPassword}
          onChange={handleChange}
          className="w-full border-b border-gray-300 py-2 mb-4 outline-none"
          required
        />

        <input
          type="email"
          name="email"
          placeholder="อีเมล"
          value={form.email}
          onChange={handleChange}
          className="w-full border-b border-gray-300 py-2 mb-6 outline-none"
          required
        />

        <button
          type="submit"
          className="w-full bg-black text-white py-2 rounded-md font-medium hover:bg-gray-800 transition"
        >
          สมัครสมาชิก
        </button>

        <p className="text-center text-sm text-gray-500 mt-4">
          มีบัญชีแล้ว?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">
            เข้าสู่ระบบ
          </Link>
        </p>
      </form>
    </div>
  );
}
