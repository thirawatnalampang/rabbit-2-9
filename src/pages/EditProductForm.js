import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:3000";

export default function EditProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("Pet food");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState(1);
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // โหลดข้อมูลสินค้าเดิม
    const fetchProduct = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/products/${id}`);
        if (!res.ok) throw new Error("โหลดข้อมูลสินค้าไม่สำเร็จ");
        const data = await res.json();

        setName(data.name || "");
        setCategory(data.category || "Pet food");
        setPrice(data.price || "");
        setStock(data.stock || 1);
        setDescription(data.description || "");
        setPreview(data.image_url || null);
      } catch (err) {
        alert(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleImageUpload = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    if (!name || !price || !category) {
      alert("กรุณากรอกข้อมูลให้ครบ");
      return;
    }

    try {
      setSubmitting(true);

      // อัปโหลดรูปใหม่ถ้ามี
      let image_url = preview;
      if (file) {
        const fd = new FormData();
        fd.append("profileImage", file);
        const res = await fetch(`${API_BASE}/api/upload`, {
          method: "POST",
          body: fd,
        });
        if (!res.ok) throw new Error("อัปโหลดรูปไม่สำเร็จ");
        const r = await res.json();
        image_url = r.url;
      }

      // update สินค้า
      const payload = {
        name,
        category,
        price: Number(price),
        stock: Number(stock),
        description: description || null,
        image_url,
      };

      const res = await fetch(`${API_BASE}/api/admin/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("แก้ไขสินค้าไม่สำเร็จ");

      alert("อัปเดตสินค้าเรียบร้อย ✅");
      navigate("/manage-products");
    } catch (err) {
      alert("เกิดข้อผิดพลาด: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p className="p-6 text-gray-500">กำลังโหลด...</p>;

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">✏️ แก้ไขสินค้า</h1>

      {/* Upload image */}
      <div
        className="w-40 h-40 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer mb-4"
        onClick={() => document.getElementById("fileUpload").click()}
      >
        <input
          type="file"
          hidden
          id="fileUpload"
          accept="image/*"
          onChange={handleImageUpload}
        />
        {preview ? (
          <img
            src={preview}
            alt="preview"
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <span className="text-gray-400 text-3xl">+</span>
        )}
      </div>

      {/* Form fields */}
      <label className="block mb-2">ชื่อสินค้า</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full border px-3 py-2 mb-4 rounded"
        placeholder="เช่น อาหารกระต่าย"
      />

      <label className="block mb-2">หมวดหมู่</label>
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="w-full border px-3 py-2 mb-4 rounded"
      >
        <option value="Pet food">Pet food</option>
        <option value="Equipment">Equipment</option>
      </select>

      <label className="block mb-2">ราคา (บาท)</label>
      <input
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="w-full border px-3 py-2 mb-4 rounded"
      />

      <label className="block mb-2">สต๊อกสินค้า</label>
      <input
        type="number"
        value={stock}
        onChange={(e) => setStock(e.target.value)}
        className="w-full border px-3 py-2 mb-4 rounded"
      />

      <label className="block mb-2">รายละเอียดสินค้า</label>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full border px-3 py-2 mb-4 rounded"
      />

      <div className="mt-4">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded disabled:opacity-60"
        >
          {submitting ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
        </button>
      </div>
    </div>
  );
}
