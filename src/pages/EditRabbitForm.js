import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:3000";

export default function EditRabbitForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);

  const [form, setForm] = useState({
    name: "",
    breed: "",
    age: "",
    gender: "male",
    price: "",
    description: "",
    image_url: "",
    status: "available",
  });

  useEffect(() => {
    const fetchRabbit = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/rabbits?page=1&limit=999`);
        const data = await res.json();
        const rabbit = data.items.find((r) => r.rabbit_id === Number(id));
        if (!rabbit) throw new Error("ไม่พบกระต่าย");
        setForm(rabbit);
        setPreview(rabbit.image_url);
      } catch (err) {
        alert(err.message);
        navigate("/manage-rabbits");
      } finally {
        setLoading(false);
      }
    };
    fetchRabbit();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let image_url = form.image_url;

      // ถ้าเลือกไฟล์ใหม่ ให้อัปโหลดก่อน
      if (file) {
        const fd = new FormData();
        fd.append("profileImage", file);

        const up = await fetch(`${API_BASE}/api/upload`, {
          method: "POST",
          body: fd,
        });

        if (!up.ok) throw new Error("อัปโหลดรูปไม่สำเร็จ");
        const r = await up.json();
        image_url = r.url;
      }

      // อัปเดตข้อมูลกระต่าย
      const res = await fetch(`${API_BASE}/api/admin/rabbits/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, image_url }),
      });

      if (!res.ok) throw new Error("อัปเดตไม่สำเร็จ");
      alert("แก้ไขข้อมูลสำเร็จ");
      navigate("/manage-rabbits");
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <p className="text-center mt-10">⏳ กำลังโหลด...</p>;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center text-pink-600 flex items-center justify-center gap-2">
        ✏️ แก้ไขข้อมูลกระต่าย
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5 bg-white p-6 rounded-xl shadow-md">
        {/* อัปโหลดรูป */}
        <div className="flex flex-col items-center">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            id="fileUpload"
            hidden
          />
          <div
            onClick={() => document.getElementById("fileUpload").click()}
            className="w-40 h-40 border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center cursor-pointer overflow-hidden hover:border-pink-500"
          >
            {preview ? (
              <img src={preview} alt="Preview" className="object-cover w-full h-full" />
            ) : (
              <span className="text-gray-400 text-3xl">+</span>
            )}
          </div>
          <p className="text-gray-500 text-sm mt-2">คลิกเพื่อเปลี่ยนรูป</p>
        </div>

        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="ชื่อกระต่าย"
          className="w-full p-3 border rounded-lg"
        />
        <input
          name="breed"
          value={form.breed}
          onChange={handleChange}
          placeholder="สายพันธุ์"
          className="w-full p-3 border rounded-lg"
        />
        <input
          type="number"
          name="age"
          value={form.age}
          onChange={handleChange}
          placeholder="อายุ (ปี)"
          className="w-full p-3 border rounded-lg"
        />
        <select
          name="gender"
          value={form.gender}
          onChange={handleChange}
          className="w-full p-3 border rounded-lg"
        >
          <option value="male">♂ เพศผู้</option>
          <option value="female">♀ เพศเมีย</option>
        </select>
        <input
          type="number"
          name="price"
          value={form.price}
          onChange={handleChange}
          placeholder="ราคา"
          className="w-full p-3 border rounded-lg"
        />
        <textarea
          name="description"
          value={form.description || ""}
          onChange={handleChange}
          placeholder="รายละเอียด"
          className="w-full p-3 border rounded-lg"
        />
        <select
          name="status"
          value={form.status}
          onChange={handleChange}
          className="w-full p-3 border rounded-lg"
        >
          <option value="available">พร้อมขาย</option>
          <option value="reserved">จองแล้ว</option>
        </select>

        <button
          type="submit"
          className="w-full bg-green-500 text-white p-3 rounded-lg hover:bg-green-600 transition"
        >
          บันทึกการแก้ไข
        </button>
      </form>
    </div>
  );
}
