import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:3000";

export default function Food() {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setErr(null);

        const res = await fetch(`${API_BASE}/api/admin/products`);
        if (!res.ok) {
          const t = await res.text();
          throw new Error(`โหลดข้อมูลไม่สำเร็จ: ${t}`);
        }
        const data = await res.json();

        // filter เฉพาะ category = Pet food
        const petFoods = (data.items || data).filter(
          (p) => String(p.category).toLowerCase() === "pet food"
        );
        setFoods(petFoods);
      } catch (e) {
        console.error("โหลดสินค้าไม่สำเร็จ:", e);
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // คำนวณหน้า
  const totalPages = Math.max(1, Math.ceil(foods.length / itemsPerPage));
  const lastIdx = currentPage * itemsPerPage;
  const firstIdx = lastIdx - itemsPerPage;
  const currentItems = foods.slice(firstIdx, lastIdx);

  const goToPage = (p) => {
    if (p < 1 || p > totalPages) return;
    setCurrentPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (loading) return <p className="text-center mt-10">กำลังโหลด...</p>;
  if (err) return <p className="text-center text-red-500 mt-10">{err}</p>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-8 text-center">สินค้าอาหารสัตว์</h1>

      {foods.length === 0 && (
        <p className="text-center text-gray-500">ยังไม่มีสินค้าในหมวดนี้</p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        {currentItems.map((food) => (
          <div
            key={food.product_id}
            className="border rounded-lg p-4 text-center shadow hover:shadow-md transition"
          >
            <img
              src={food.image_url || "https://placehold.co/200x200?text=No+Image"}
              alt={food.name}
              className="w-full h-40 object-cover rounded-lg"
              onError={(e) => {
                e.currentTarget.src = "https://placehold.co/200x200?text=No+Image";
              }}
            />
            <p className="mt-2 font-semibold">{food.name}</p>
            <p className="text-sm text-gray-600">
              ราคา {Number(food.price).toFixed(2)} บาท
            </p>
            <Link
              to={`/pet-food/${food.product_id}`}
              className="inline-block px-4 py-1 mt-2 bg-green-600 text-white rounded-full hover:bg-green-700 text-sm"
            >
              ดูรายละเอียด
            </Link>
          </div>
        ))}
      </div>

      {/* Pagination จริง แบบเดียวกับ Pets */}
      {foods.length > itemsPerPage && (
        <div className="flex justify-center items-center space-x-2 mb-12">
          <button
            onClick={() => goToPage(currentPage - 1)}
            className="px-3 py-1 border rounded-full"
            disabled={currentPage === 1}
          >
            &laquo;
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => goToPage(p)}
              className={
                "px-3 py-1 border rounded-full " +
                (currentPage === p ? "bg-black text-white" : "")
              }
            >
              {p}
            </button>
          ))}

          <button
            onClick={() => goToPage(currentPage + 1)}
            className="px-3 py-1 border rounded-full"
            disabled={currentPage === totalPages}
          >
            &raquo;
          </button>
        </div>
      )}
    </div>
  );
}
