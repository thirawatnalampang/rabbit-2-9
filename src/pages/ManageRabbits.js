import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3000';

function formatTHB(n) {
  const num = typeof n === 'number' ? n : Number(n);
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(num || 0);
}

export default function ManageRabbits() {
  const [rabbits, setRabbits] = useState([]);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const loadData = useCallback(async (p = page) => {
    try {
      setLoading(true);
      setErr(null);
      const res = await fetch(`${API_BASE}/api/admin/rabbits?page=${p}&limit=${limit}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`โหลดข้อมูลไม่สำเร็จ (HTTP ${res.status}) ${text}`);
      }
      const data = await res.json();
      setRabbits(data.items || []);
      setTotalPages(data.totalPages || 1);
    } catch (e) {
      console.error('Fetch rabbits error:', e);
      setErr(e.message || 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    loadData(page);
  }, [page, loadData]);

  async function handleDelete(id) {
    if (!window.confirm('ลบรายการนี้?')) return;

    const prev = rabbits;
    setRabbits(prev.filter(r => r.rabbit_id !== id));

    try {
      const res = await fetch(`${API_BASE}/api/admin/rabbits/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`ลบไม่สำเร็จ (HTTP ${res.status}) ${t}`);
      }
      loadData(page);
    } catch (e) {
      alert(e.message || 'ลบไม่สำเร็จ');
      setRabbits(prev);
    }
  }

  const genderTH = (g) => {
    if (!g) return '';
    const low = String(g).toLowerCase();
    return low === 'male' || low === 'm' ? 'เพศผู้'
         : low === 'female' || low === 'f' ? 'เพศเมีย'
         : g;
  };

  return (
    <div className="p-8 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-6 px-4 py-2 bg-pink-50 rounded shadow">
        🐇 จัดการกระต่าย
      </h1>

      <div className="flex items-center gap-4 mb-8">
        <span className="bg-pink-100 px-4 py-2 rounded-full">
          🐇 จัดการกระต่าย : {rabbits.length} ตัว (หน้า {page}/{totalPages})
        </span>
        <Link
          to="/add-rabbit"
          className="bg-orange-400 hover:bg-orange-500 text-white px-4 py-2 rounded shadow"
        >
          + เพิ่มกระต่าย
        </Link>
      </div>

      {loading && <p className="text-gray-500">กำลังโหลด...</p>}
      {err && <p className="text-red-500">{err}</p>}

      {!loading && !err && rabbits.length === 0 && (
        <p className="text-gray-400 italic">ยังไม่มีกระต่ายในระบบ</p>
      )}

      <div className="space-y-6 w-full max-w-4xl">
        {rabbits.map((r) => (
          <div key={r.rabbit_id} className="flex items-center gap-4">
            <img
              src={r.image_url || 'https://placehold.co/200x200?text=Rabbit'}
              alt={r.name}
              className="W-32 h-32 object-cover rounded-lg shadow"
              onError={(e) => { e.currentTarget.src = 'https://placehold.co/200x200?text=Rabbit'; }}
            />
            <div className="flex-1 bg-gray-100 p-4 rounded-lg">
              <p className="font-semibold">
                ชื่อ {r.name} • สายพันธุ์ {r.breed || '-'} • {genderTH(r.gender)}
              </p>
              <p className="text-sm text-gray-700">
                อายุ {r.age ?? '-'} ปี • ราคา {formatTHB(r.price)} • สถานะ {r.status || '—'}
              </p>
              {r.description && <p className="text-sm mt-1">{r.description}</p>}
            </div>

            <Link
              to={`/edit-rabbit/${r.rabbit_id}`}
              className="bg-blue-500 text-white px-4 py-2 rounded shadow hover:bg-blue-600"
            >
              แก้ไข
            </Link>
            <button
              onClick={() => handleDelete(r.rabbit_id)}
              className="bg-red-500 text-white px-4 py-2 rounded shadow hover:bg-red-600"
            >
              ลบ
            </button>

            {String(r.status || '').toLowerCase() === 'reserved' && (
              <span className="bg-green-500 text-white px-4 py-2 rounded shadow">
                จองแล้ว
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-8">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
          <button
            key={n}
            onClick={() => setPage(n)}
            disabled={page === n}
            className={`px-3 py-1 rounded-full ${page === n ? 'bg-black text-white cursor-not-allowed' : 'hover:bg-gray-200'}`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
