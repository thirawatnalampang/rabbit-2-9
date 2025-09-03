import React from 'react';
import { Link } from 'react-router-dom';

export default function SellerDashboard() {
  return (
    <div className="p-8 flex flex-col items-center">
      {/* หัวข้อ */}
      <h1 className="text-3xl font-bold mb-8 px-6 py-2 bg-pink-50 rounded shadow">
        🐰 Seller Dashboard
      </h1>

      {/* ปุ่มเมนูจัดการ */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* จัดการกระต่าย */}
        <Link
          to="/manage-rabbits"
          className="bg-white px-6 py-4 rounded-lg shadow hover:shadow-md hover:-translate-y-1 transition flex flex-col items-center"
        >
          <span className="text-3xl mb-2">🐇</span>
          <span className="font-bold">จัดการกระต่าย</span>
        </Link>

        {/* จัดการสินค้า */}
        <Link
          to="/manage-products"
          className="bg-yellow-50 px-6 py-4 rounded-lg shadow hover:shadow-md hover:-translate-y-1 transition flex flex-col items-center"
        >
          <span className="text-3xl mb-2">🛒</span>
          <span className="font-bold">จัดการสินค้า</span>
        </Link>

        {/* คำสั่งซื้อ */}
        <Link
          to="/manage-orders"
          className="bg-orange-50 px-6 py-4 rounded-lg shadow hover:shadow-md hover:-translate-y-1 transition flex flex-col items-center"
        >
          <span className="text-3xl mb-2">📦</span>
          <span className="font-bold">คำสั่งซื้อ</span>
        </Link>

        {/* การจัดส่ง */}
        <Link
          to="/shipping"
          className="bg-blue-50 px-6 py-4 rounded-lg shadow hover:shadow-md hover:-translate-y-1 transition flex flex-col items-center"
        >
          <span className="text-3xl mb-2">🚚</span>
          <span className="font-bold">การจัดส่ง</span>
        </Link>

        {/* สถิติ */}
        <Link
          to="/statistics"
          className="bg-green-50 px-6 py-4 rounded-lg shadow hover:shadow-md hover:-translate-y-1 transition flex flex-col items-center"
        >
          <span className="text-3xl mb-2">📊</span>
          <span className="font-bold">สถิติ</span>
        </Link>
      </div>
    </div>
  );
}
