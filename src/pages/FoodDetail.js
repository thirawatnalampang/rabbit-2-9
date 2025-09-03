import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:3000";

export default function FoodDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  const [food, setFood] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // โหลดข้อมูลจาก backend
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/admin/products/${id}`);
        if (!res.ok) throw new Error(`โหลดข้อมูลไม่สำเร็จ (HTTP ${res.status})`);
        const data = await res.json();
        setFood(data);
      } catch (e) {
        console.error(e);
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleAddToCart = () => {
    if (!food) return;
    addToCart({ ...food, quantity });
    alert(`เพิ่ม ${food.name} จำนวน ${quantity} ชิ้น ไปยังตะกร้าแล้ว!`);
  };

  if (loading) return <p className="text-center p-8">กำลังโหลด...</p>;
  if (err) return <p className="text-center text-red-500 p-8">{err}</p>;
  if (!food) {
    return (
      <div className="max-w-xl mx-auto p-6 text-center mt-10">
        <p className="text-red-600 font-semibold text-xl">
          ไม่พบข้อมูลสินค้าอาหารนี้
        </p>
        <button
          onClick={() => navigate("/pet-food")}
          className="mt-4 px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
        >
          กลับไปหน้ารายการอาหาร
        </button>
      </div>
    );
  }

  // mock gallery (จริง ๆ ถ้ามี field images[] จะ map ได้)
  const gallery = [
    food.image_url,
    food.image_url,
    food.image_url,
    food.image_url,
  ].filter(Boolean);

  return (
    <div className="container mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-12 gap-8">
      {/* Gallery ซ้าย */}
      <div className="md:col-span-2 flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto">
        {gallery.map((img, idx) => (
          <img
            key={idx}
            src={img || "https://placehold.co/150x150?text=No+Image"}
            alt={`${food.name}-thumb-${idx}`}
            className="w-24 h-24 object-cover rounded cursor-pointer border hover:border-green-500"
          />
        ))}
      </div>

      {/* รูปหลักตรงกลาง */}
      <div className="md:col-span-5 flex justify-center items-start">
        <img
          src={food.image_url || "https://placehold.co/400x400?text=No+Image"}
          alt={food.name}
          className="rounded-lg w-full max-w-md object-contain"
        />
      </div>

      {/* รายละเอียดขวา */}
      <div className="md:col-span-5">
        <h1 className="text-2xl font-bold mb-2">🐇 {food.name}</h1>
        <p className="text-xl font-bold mb-4">
          ราคา{" "}
          <span className="text-green-600">
            {Number(food.price).toLocaleString()} บาท
          </span>
        </p>

        <div className="bg-gray-50 p-4 rounded-lg mb-4 shadow">
          <h2 className="font-semibold mb-2">รายละเอียดสินค้า</h2>
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
            {food.description || "ไม่มีรายละเอียดสินค้า"}
          </p>
        </div>

        {/* จำนวน + Add to cart */}
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="px-3 py-1 border rounded text-lg"
          >
            −
          </button>
          <span className="min-w-[30px] text-center">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => q + 1)}
            className="px-3 py-1 border rounded text-lg"
          >
            +
          </button>
        </div>

        <button
          onClick={handleAddToCart}
          className="px-6 py-3 bg-black text-white rounded-full hover:bg-gray-900 transition w-full md:w-auto"
        >
          Add to Cart
        </button>

        <div className="mt-6">
          <Link
            to="/pet-food"
            className="inline-block px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800"
          >
            ← กลับไปหน้ารายการอาหาร
          </Link>
        </div>
      </div>
    </div>
  );
}
