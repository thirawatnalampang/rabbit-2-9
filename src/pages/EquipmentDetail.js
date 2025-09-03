// src/pages/EquipmentDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:3000";

export default function EquipmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [item, setItem] = useState(null);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [mainImg, setMainImg] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setErr(null);
        const res = await fetch(`${API_BASE}/api/admin/products/${id}`);
        if (!res.ok) throw new Error(`โหลดข้อมูลไม่สำเร็จ (HTTP ${res.status})`);
        const data = await res.json();
        setItem(data);
        setMainImg(data.image_url);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleAddToCart = () => {
    if (!item) return;
    addToCart({
      ...item,
      id: item.product_id,
      quantity: qty,
    });
    alert(`เพิ่ม ${item.name} จำนวน ${qty} ชิ้น ไปยังตะกร้าแล้ว!`);
  };

  if (loading) return <p className="text-center p-8">กำลังโหลด...</p>;
  if (err)
    return (
      <div className="max-w-xl mx-auto p-6 mt-10 text-center text-red-600">
        {err}
        <div className="mt-4">
          <button
            onClick={() => navigate("/equipment")}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800"
          >
            ← กลับไปหน้ารายการอุปกรณ์
          </button>
        </div>
      </div>
    );
  if (!item) {
    return (
      <div className="max-w-xl mx-auto p-6 text-center mt-10">
        <p className="text-red-600 font-semibold text-xl">
          ไม่พบข้อมูลอุปกรณ์นี้
        </p>
        <button
          onClick={() => navigate("/equipment")}
          className="mt-4 px-6 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 transition"
        >
          ← กลับไปหน้ารายการอุปกรณ์
        </button>
      </div>
    );
  }

  // mock gallery (ถ้ามี field images[] จริงจะ map ได้)
  const gallery = [item.image_url, item.image_url, item.image_url].filter(Boolean);

  return (
    <div className="container mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-12 gap-8">
      {/* Gallery ซ้าย */}
      <div className="md:col-span-2 flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto">
        {gallery.map((img, idx) => (
          <img
            key={idx}
            src={img || "https://placehold.co/150x150?text=No+Image"}
            alt={`${item.name}-thumb-${idx}`}
            className={`w-24 h-24 object-cover rounded cursor-pointer border ${
              mainImg === img ? "border-black" : "hover:border-gray-400"
            }`}
            onClick={() => setMainImg(img)}
          />
        ))}
      </div>

      {/* รูปหลักตรงกลาง */}
      <div className="md:col-span-5 flex justify-center items-start">
        <img
          src={mainImg || "https://placehold.co/400x400?text=No+Image"}
          alt={item.name}
          className="rounded-lg w-full max-w-md object-contain"
        />
      </div>

      {/* รายละเอียดขวา */}
      <div className="md:col-span-5">
        <h1 className="text-2xl font-bold mb-2">{item.name}</h1>
        <p className="text-xl font-bold mb-4">
          ราคา{" "}
          <span className="text-green-600">
            {(Number(item.price) || 0).toLocaleString()} บาท
          </span>
        </p>

        <div className="bg-gray-50 p-4 rounded-lg mb-4 shadow">
          <h2 className="font-semibold mb-2">รายละเอียดสินค้า</h2>
          <p className="text-gray-700 leading-relaxed">
            {item.description || "ไม่มีรายละเอียดสินค้า"}
          </p>
        </div>

        {/* จำนวน + Add to cart */}
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="px-3 py-1 border rounded text-lg"
          >
            −
          </button>
          <span className="min-w-[30px] text-center">{qty}</span>
          <button
            onClick={() => setQty((q) => q + 1)}
            className="px-3 py-1 border rounded text-lg"
          >
            +
          </button>
        </div>

        {/* ปุ่ม Add to Cart ดำเหมือน Food */}
        <button
          onClick={handleAddToCart}
          className="px-6 py-3 bg-black text-white rounded-full hover:bg-gray-900 transition w-full md:w-auto"
        >
          Add to Cart
        </button>

        <div className="mt-6">
          <Link
            to="/equipment"
            className="inline-block px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800"
          >
            ← กลับไปหน้ารายการอุปกรณ์
          </Link>
        </div>
      </div>
    </div>
  );
}
