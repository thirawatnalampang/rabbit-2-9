// src/pages/PetDetail.jsx
import { useParams, useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:3000";

export default function PetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [mainImg, setMainImg] = useState(null);

  useEffect(() => {
    const loadPet = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE}/api/admin/rabbits?page=1&limit=999`);
        if (!res.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ");
        const data = await res.json();

        const rabbit = data.items.find((r) => r.rabbit_id === Number(id));
        setPet(rabbit || null);
        setMainImg(rabbit?.image_url || null);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadPet();
  }, [id]);

  const handleAddToCart = () => {
    if (!pet) return;
    addToCart({
      id: pet.rabbit_id,
      name: pet.name,
      price: pet.price,
      image: pet.image_url,
      quantity,
    });
    alert(`เพิ่ม ${pet.name} จำนวน ${quantity} ชิ้น ไปยังตะกร้าแล้ว!`);
  };

  if (loading) return <p className="text-center mt-10 text-gray-500">กำลังโหลด...</p>;
  if (error)
    return (
      <p className="text-center mt-10 text-red-500">เกิดข้อผิดพลาด: {error}</p>
    );
  if (!pet) {
    return (
      <div className="max-w-xl mx-auto p-6 text-center mt-10">
        <p className="text-red-600 font-semibold text-xl">ไม่พบข้อมูลกระต่าย</p>
        <button
          onClick={() => navigate("/pets")}
          className="mt-4 px-6 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 transition"
        >
          ← กลับไปหน้ากระต่าย
        </button>
      </div>
    );
  }

  // mock gallery (ถ้ามี field images[] จริงจะ map ได้เลย)
  const gallery = [pet.image_url, pet.image_url, pet.image_url].filter(Boolean);

  return (
    <div className="container mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-12 gap-8">
      {/* Gallery ซ้าย */}
      <div className="md:col-span-2 flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto">
        {gallery.map((img, idx) => (
          <img
            key={idx}
            src={img || "https://placehold.co/150x150?text=Rabbit"}
            alt={`${pet.name}-thumb-${idx}`}
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
          src={mainImg || "https://placehold.co/400x400?text=Rabbit"}
          alt={pet.name}
          className="rounded-lg w-full max-w-md object-contain"
        />
      </div>

      {/* รายละเอียดขวา */}
      <div className="md:col-span-5">
        <h1 className="text-2xl font-bold mb-2">
          🐰 {pet.name} • {pet.breed || "ไม่ระบุ"} •{" "}
          {pet.gender === "male" ? "♂ เพศผู้" : "♀ เพศเมีย"}
        </h1>
        <p className="text-xl font-bold mb-4">
          ราคา{" "}
          <span className="text-green-600">
            {Number(pet.price).toLocaleString()} บาท
          </span>
        </p>

        <div className="bg-gray-50 p-4 rounded-lg mb-4 shadow">
          <h2 className="font-semibold mb-2">รายละเอียดสินค้า</h2>
          <p className="text-gray-700 leading-relaxed">
            {pet.description || "กระต่ายน่ารัก สุขภาพดี พร้อมหาบ้านใหม่ 🐇"}
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
          🛒 Add to Cart
        </button>

        <div className="mt-6">
          <Link
            to="/pets"
            className="inline-block px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-800"
          >
            ← กลับไปหน้ากระต่าย
          </Link>
        </div>
      </div>
    </div>
  );
}
