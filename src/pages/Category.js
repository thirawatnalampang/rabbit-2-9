import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:3000";

export default function Category() {
  const [searchParams] = useSearchParams();
  const type = searchParams.get("type") || "Pet food"; // default category
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setErr(null);
        const res = await fetch(
          `${API_BASE}/api/admin/products?category=${encodeURIComponent(type)}`
        );
        if (!res.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ");
        const data = await res.json();
        setProducts(data.items || []);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [type]);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6 text-center">
        หมวดหมู่: {type}
      </h1>

      {loading && <p className="text-gray-500">กำลังโหลด...</p>}
      {err && <p className="text-red-500">{err}</p>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {products.map((p) => (
          <div
            key={p.product_id}
            className="border rounded-lg p-4 shadow hover:shadow-md transition text-center"
          >
            <img
              src={p.image_url || "https://placehold.co/200x200?text=No+Image"}
              alt={p.name}
              className="w-full h-40 object-cover rounded-lg"
              onError={(e) =>
                (e.currentTarget.src =
                  "https://placehold.co/200x200?text=No+Image")
              }
            />
            <p className="mt-2 font-semibold">{p.name}</p>
            <p className="text-sm text-gray-600">{p.price} บาท</p>
          </div>
        ))}
      </div>

      {!loading && products.length === 0 && (
        <p className="text-gray-400 text-center mt-6">ยังไม่มีสินค้าในหมวดนี้</p>
      )}
    </div>
  );
}
