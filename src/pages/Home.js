import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3000';

// helper: ฟอร์แมตราคา
function formatTHB(n) {
  const num = typeof n === 'number' ? n : Number(n);
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(num || 0);
}

// fallback รูป
const FALLBACKS = {
  rabbit: 'https://placehold.co/600x400?text=Rabbit',
  product: 'https://placehold.co/600x400?text=Product',
};

export default function Home() {
  const categories = useMemo(() => ([
    { title: 'Rabbit',    link: '/pets',       img: '/images/rabbit.jpg' },
    { title: 'Pet food',  link: '/pet-food',   img: '/images/food.jpg' },
    { title: 'Equipment', link: '/equipment',  img: '/images/live.jpg' },
    { title: 'Parents',   link: '/parents',    img: '/images/parents.jpg' },
  ]), []);

  const [rabbits, setRabbits]   = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [err, setErr]           = useState(null);

  useEffect(() => {
    let isAlive = true;

    async function load() {
      try {
        setLoading(true);
        setErr(null);

        // โหลดคู่ขนาน
        const [rabRes, prodRes] = await Promise.all([
          fetch(`${API_BASE}/api/admin/rabbits?limit=8&page=1`),
          fetch(`${API_BASE}/api/admin/products?limit=8&page=1`),
        ]);

        if (!rabRes.ok)  throw new Error(`โหลดกระต่ายไม่สำเร็จ (HTTP ${rabRes.status})`);
        if (!prodRes.ok) throw new Error(`โหลดสินค้าไม่สำเร็จ (HTTP ${prodRes.status})`);

        const rabData  = await rabRes.json();
        const prodData = await prodRes.json();

        if (!isAlive) return;

        setRabbits(rabData.items || []);
        setProducts(prodData.items || []);
      } catch (e) {
        console.error(e);
        if (isAlive) setErr(e.message || 'โหลดข้อมูลไม่สำเร็จ');
      } finally {
        if (isAlive) setLoading(false);
      }
    }

    load();
    return () => { isAlive = false; };
  }, []);

  return (
    <div className="p-8">
      {/* ========== Category ==========
          (ยังใช้รูป/ลิงก์เดิมของคุณ) */}
      <div className="flex flex-col items-center mb-10">
        <h1 className="text-4xl font-bold mb-8">Category</h1>
        <div className="flex flex-wrap justify-center gap-6">
          {categories.map((cat, idx) => (
            <Link to={cat.link} key={idx} className="text-center">
              <div className="w-[239.37px] h-[372.57px] overflow-hidden rounded-2xl shadow-md hover:scale-105 transition mx-auto">
                <img
                  src={cat.img}
                  alt={cat.title}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.src = FALLBACKS.product; }}
                />
              </div>
              <p className="mt-2 text-lg font-semibold">{cat.title}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* ========== แนะนำการเลี้ยง ========== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start mb-12">
        <div>
          <h2 className="text-xl font-bold mb-4">
            แนะนำวิธีเลี้ยงกระต่ายสำหรับคนที่เป็นมือใหม่
          </h2>
          <ol className="list-decimal list-inside text-gray-700 space-y-2 leading-relaxed">
            <li>เข้าใจนิสัยกระต่าย กระต่ายรอบไว ต้องการความปลอดภัย และไม่ชอบเสียงดัง</li>
            <li>อาหารและโภชนาการ: หญ้า แครอท อาหารเม็ดคุณภาพ</li>
            <li>ที่อยู่อาศัย: พื้นที่กว้างพอ อากาศถ่ายเท สะอาด</li>
            <li>เวลาและความเอาใจใส่: เล่น/ดูแลสม่ำเสมอ</li>
          </ol>
        </div>
        <div className="flex justify-center">
          <img
            src="/images/r.jpg"
            alt="Rabbit"
            className="max-w-sm rounded-xl shadow-lg"
            onError={(e) => { e.currentTarget.src = FALLBACKS.rabbit; }}
          />
        </div>
      </div>

      {/* ========== กระต่ายล่าสุด (จาก DB) ========== */}
      <div className="mb-12">
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-2xl font-bold">กระต่ายล่าสุด</h2>
          <Link to="/pets" className="text-blue-600 hover:underline">ดูทั้งหมด →</Link>
        </div>

        {loading && <p className="text-gray-500">กำลังโหลด...</p>}
        {err && <p className="text-red-500">{err}</p>}
        {!loading && !err && rabbits.length === 0 && (
          <p className="text-gray-400">ยังไม่มีกระต่ายในระบบ</p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {rabbits.map((r) => (
            <div key={r.rabbit_id} className="border rounded-lg p-4 text-center shadow hover:shadow-md transition">
              <img
                src={r.image_url || FALLBACKS.rabbit}
                alt={r.name}
                className="w-full h-36 object-cover rounded-lg"
                onError={(e) => { e.currentTarget.src = FALLBACKS.rabbit; }}
              />
              <p className="mt-2 font-semibold">{r.name}</p>
              <p className="text-sm text-gray-600 mb-2">
                ราคา {formatTHB(r.price)}
              </p>
              <Link
                to={`/pets/${r.rabbit_id}`}
                className="inline-block px-4 py-1 bg-green-600 text-white rounded-full hover:bg-green-700 text-sm"
              >
                ดูรายละเอียด
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* ========== สินค้ามาใหม่ (จาก DB) ========== */}
      <div className="mb-20">
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-2xl font-bold">สินค้ามาใหม่</h2>
          {/* จะพาไปหน้า Category รวมสินค้า ก็ชี้ไป /category หรือจะแยกตามหมวดก็ทำปุ่ม 2 อัน */}
          <div className="flex gap-3">
            <Link to="/pet-food" className="text-blue-600 hover:underline">อาหารสัตว์ →</Link>
            <Link to="/equipment" className="text-blue-600 hover:underline">อุปกรณ์ →</Link>
          </div>
        </div>

        {loading && <p className="text-gray-500">กำลังโหลด...</p>}
        {err && <p className="text-red-500">{err}</p>}
        {!loading && !err && products.length === 0 && (
          <p className="text-gray-400">ยังไม่มีสินค้าในระบบ</p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {products.map((p) => (
            <div key={p.product_id} className="border rounded-lg p-4 shadow hover:shadow-md transition">
              <img
                src={p.image_url || FALLBACKS.product}
                alt={p.name}
                className="w-full h-36 object-cover rounded-lg"
                onError={(e) => { e.currentTarget.src = FALLBACKS.product; }}
              />
              <p className="mt-2 font-semibold">{p.name}</p>
              {p.price != null && (
                <p className="text-sm text-gray-600 mb-2">ราคา {formatTHB(p.price)}</p>
              )}
              {/* ถ้าอยากแยกเส้นทาง detail คนละหมวด:
                  - ถ้า p.category === 'Pet food' → ไป /pet-food/:id
                  - ถ้า p.category === 'Equipment' → ไป /equipment/:id */}
              <Link
                to={
                  String(p.category).toLowerCase() === 'equipment'
                    ? `/equipment/${p.product_id}`
                    : `/pet-food/${p.product_id}`
                }
                className="inline-block px-4 py-1 bg-green-600 text-white rounded-full hover:bg-green-700 text-sm"
              >
                ดูรายละเอียด
              </Link>
            </div>
          ))}
        </div>
      </div>
      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6 text-center text-sm">
        <div className="grid md:grid-cols-3 gap-4 px-4">
          <div>
            <p className="font-semibold">Address</p>
            <p>50/23 หมู่ 4 ถนนบางบอน</p>
            <p>หนองแขม กรุงเทพฯ 10220</p>
          </div>
          <div>
            <p className="font-semibold">Contact</p>
            <div className="flex justify-center gap-3 mt-1">
              <span>📧</span>
              <span>📞</span>
              <span>📍</span>
            </div>
          </div>
          <div>
            <p className="font-semibold">จัดทำโดย</p>
            <p>วินัยฟาร์ม</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
