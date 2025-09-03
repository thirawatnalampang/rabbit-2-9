// src/pages/ManageProducts.jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3000';

function formatTHB(n) {
  const num = typeof n === 'number' ? n : Number(n);
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(num || 0);
}
const FALLBACK_IMG = 'https://placehold.co/200x200?text=Product';

export default function ManageProducts() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const limit = 12;
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const [q, setQ] = useState('');
  const [category, setCategory] = useState(''); // '', 'Pet food', 'Equipment'

  const [searchParams, setSearchParams] = useSearchParams();

  // keep URL in sync (รันครั้งเดียว)
  useEffect(() => {
    const p = Number(searchParams.get('page') || '1');
    const c = searchParams.get('category') || '';
    const s = searchParams.get('q') || '';
    setPage(Math.max(1, p));
    setCategory(c);
    setQ(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const next = {};
    if (page > 1) next.page = String(page);
    if (category) next.category = category;
    if (q) next.q = q;
    setSearchParams(next, { replace: true });
  }, [page, category, q, setSearchParams]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setErr(null);
      const qs = new URLSearchParams();
      qs.set('page', String(page));
      qs.set('limit', String(limit));
      if (category) qs.set('category', category);

      const res = await fetch(`${API_BASE}/api/admin/products?${qs.toString()}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`โหลดข้อมูลไม่สำเร็จ (HTTP ${res.status}) ${text}`);
      }
      const data = await res.json();
      setItems(data.items || []);
      setTotalPages(data.totalPages || 1);
    } catch (e) {
      console.error('Fetch products error:', e);
      setErr(e.message || 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  }, [page, limit, category]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // client-side search by name/desc
  const filteredItems = useMemo(() => {
    const keyword = q.trim().toLowerCase();
    if (!keyword) return items;
    return items.filter((it) => {
      const name = String(it.name || '').toLowerCase();
      const desc = String(it.description || '').toLowerCase();
      return name.includes(keyword) || desc.includes(keyword);
    });
  }, [q, items]);

  async function handleDelete(id) {
    if (!window.confirm('ลบสินค้านี้หรือไม่?')) return;

    const prev = items;
    setItems(prev.filter((x) => x.product_id !== id));

    try {
      const res = await fetch(`${API_BASE}/api/admin/products/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`ลบไม่สำเร็จ (HTTP ${res.status}) ${t}`);
      }
      // reload (เผื่อมีผลกับจำนวนหน้า)
      loadData();
    } catch (e) {
      alert(e.message || 'ลบไม่สำเร็จ');
      setItems(prev); // rollback
    }
  }

  return (
    <div className="p-8 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-6 px-4 py-2 bg-pink-50 rounded shadow">
        🛍️ จัดการสินค้า
      </h1>

      <div className="w-full max-w-6xl mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          placeholder="ค้นหาชื่อ/รายละเอียด..."
          className="border rounded px-3 py-2 w-full"
        />
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="border rounded px-3 py-2 w-full"
        >
          <option value="">ทั้งหมด (ทุกหมวด)</option>
          <option value="Pet food">Pet food</option>
          <option value="Equipment">Equipment</option>
        </select>
        <div className="flex gap-3">
          <Link
            to="/add-product"
            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow text-center"
          >
            + เพิ่มสินค้า
          </Link>
          <button
            onClick={loadData}
            className="flex-1 bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded shadow"
          >
            รีเฟรช
          </button>
        </div>
      </div>

      <div className="w-full max-w-6xl">
        <div className="mb-3 text-sm text-gray-600">
          แสดง {filteredItems.length} รายการ (หน้า {page}/{totalPages})
        </div>

        {loading && <p className="text-gray-500">กำลังโหลด...</p>}
        {err && <p className="text-red-500">{err}</p>}
        {!loading && !err && filteredItems.length === 0 && (
          <p className="text-gray-400 italic">ยังไม่มีสินค้าในระบบ</p>
        )}

        {/* Table / cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredItems.map((p) => (
            <div key={p.product_id} className="border rounded-lg p-4 shadow flex gap-4">
              <img
                src={p.image_url || FALLBACK_IMG}
                alt={p.name}
                className="w-28 h-28 object-cover rounded"
                onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
              />
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold">{p.name}</div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    String(p.status || '').toLowerCase() === 'available'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-gray-200 text-gray-700'
                  }`}>
                    {p.status || '—'}
                  </span>
                </div>

                <div className="text-sm text-gray-600">
                  หมวด: {p.category || '-'} • ราคา: {formatTHB(p.price)} • สต๊อก: {p.stock ?? 0}
                </div>
                {p.description && (
                  <div className="text-sm text-gray-700 mt-1 line-clamp-2">
                    {p.description}
                  </div>
                )}

                <div className="mt-3 flex gap-2">
                  <Link
                    to={`/edit-product/${p.product_id}`}
                    className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm"
                  >
                    แก้ไข
                  </Link>
                  <button
                    onClick={() => handleDelete(p.product_id)}
                    className="px-3 py-1 rounded bg-red-500 hover:bg-red-600 text-white text-sm"
                  >
                    ลบ
                  </button>

                  {/* ลิงก์ดูในหน้า public ตามหมวด */}
                  {String(p.category || '').toLowerCase() === 'equipment' ? (
                    <Link
                      to={`/equipment/${p.product_id}`}
                      className="ml-auto px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-sm"
                    >
                      ดูหน้าอุปกรณ์
                    </Link>
                  ) : (
                    <Link
                      to={`/pet-food/${p.product_id}`}
                      className="ml-auto px-3 py-1 rounded bg-gray-100 hover:bg-gray-200 text-sm"
                    >
                      ดูหน้าอาหาร
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* pagination */}
        <div className="flex gap-2 mt-8 justify-center">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => setPage(n)}
              disabled={page === n}
              className={`px-3 py-1 rounded-full ${
                page === n ? 'bg-black text-white cursor-not-allowed' : 'hover:bg-gray-200'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
