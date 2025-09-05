import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNavigate, Link } from 'react-router-dom';

const FALLBACK_IMG = 'https://placehold.co/200x200?text=Item';
const formatTHB = (n) =>
  new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB' }).format(Number(n || 0));

function getImage(it) {
  return it.image || it.image_url || it.img || it.photo || FALLBACK_IMG;
}
function getId(it) {
  return it.id ?? it.product_id ?? it.rabbit_id ?? it._id ?? String(it.name || Math.random());
}
function getName(it) {
  return it.name || it.title || it.product_name || it.rabbit_name || 'ไม่มีชื่อ';
}
function getUnitPrice(it) {
  return Number(it.price ?? it.unitPrice ?? it.amount ?? 0);
}
function getQty(it) {
  return Number(it.quantity ?? it.qty ?? 1);
}
function getType(it) {
  if (it.type) return String(it.type).toLowerCase();
  const cat = String(it.category || '').toLowerCase();
  if (cat.includes('equip')) return 'equipment';
  if (cat.includes('food')) return 'pet-food';
  return 'rabbit';
}
function detailLink(it) {
  const t = getType(it);
  const id = getId(it);
  if (t === 'equipment') return `/equipment/${id}`;
  if (t === 'pet-food') return `/pet-food/${id}`;
  return `/pets/${id}`;
}

export default function CartPage() {
  const { user } = useAuth();
  const { cartItems, removeFromCart } = useCart();
  const navigate = useNavigate();

  const subtotal = cartItems.reduce((sum, it) => sum + getUnitPrice(it) * getQty(it), 0);

  const handleCheckout = () => {
    if (!user) {
      navigate('/get-started', { state: { from: '/checkout' } });
    } else {
      navigate('/checkout');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
      {/* หัวข้อ + breadcrumb เล็กๆ */}
      <div className="mb-6">
        <div className="text-sm text-neutral-500 mb-1">
          <Link to="/" className="hover:underline">หน้าแรก</Link> <span className="mx-1">/</span> ตะกร้า
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <span>🛒</span> ตะกร้าของคุณ
        </h1>
      </div>

      {/* ว่างเปล่า */}
      {cartItems.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border p-10 text-center">
          <p className="text-lg text-neutral-600">ยังไม่มีสินค้าในตะกร้า</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/pets" className="px-4 py-2 rounded-full border hover:bg-neutral-50">ดูรายการกระต่าย</Link>
            <Link to="/pet-food" className="px-4 py-2 rounded-full border hover:bg-neutral-50">อาหารสัตว์เลี้ยง</Link>
            <Link to="/equipment" className="px-4 py-2 rounded-full border hover:bg-neutral-50">อุปกรณ์</Link>
          </div>
        </div>
      ) : (
        // มีสินค้า: แบ่ง 2 คอลัมน์ (ซ้ายรายการ, ขวาสรุป)
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* รายการสินค้า */}
          <div className="md:col-span-2 space-y-4">
            {cartItems.map((item) => {
              const id = getId(item);
              const qty = getQty(item);
              const unit = getUnitPrice(item);
              const name = getName(item);
              const img = getImage(item);
              const link = detailLink(item);
              const type = getType(item);

              return (
                <div
                  key={id}
                  className="bg-white border rounded-2xl p-4 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex gap-4">
                    <Link to={link} className="shrink-0">
                      <img
                        src={img}
                        alt={name}
                        className="w-24 h-24 rounded-xl object-cover"
                        onError={(e) => { e.currentTarget.src = FALLBACK_IMG; }}
                      />
                    </Link>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <Link to={link} className="text-lg font-semibold hover:underline line-clamp-1">
                            {name}
                          </Link>
                          <div className="mt-1 flex items-center gap-2 text-sm text-neutral-500">
                            <span className="px-2 py-0.5 rounded-full border text-xs">
                              {type === 'rabbit' ? 'กระต่าย' : type === 'pet-food' ? 'อาหารสัตว์' : 'อุปกรณ์'}
                            </span>
                            <span>•</span>
                            <span>จำนวน: <span className="font-medium text-neutral-700">{qty}</span></span>
                          </div>
                        </div>

                        <button
                          onClick={() => removeFromCart(id)}
                          className="text-red-600 hover:text-red-700 text-sm px-3 py-1 rounded-full border border-red-200 hover:bg-red-50"
                          title="ลบออกจากตะกร้า"
                        >
                          ลบ
                        </button>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="text-sm text-neutral-500">
                          ราคาต่อหน่วย: <span className="font-medium text-neutral-700">{formatTHB(unit)}</span>
                        </div>
                        <div className="text-lg font-bold text-emerald-600">
                          {formatTHB(unit * qty)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* สรุปคำสั่งซื้อ */}
          <aside className="md:col-span-1">
            <div className="bg-white border rounded-2xl p-5 shadow-sm md:sticky md:top-6">
              <h2 className="text-lg font-bold mb-4">สรุปคำสั่งซื้อ</h2>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>ยอดรวมสินค้า</span>
                  <span className="font-medium">{formatTHB(subtotal)}</span>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>ค่าจัดส่ง</span>
                  <span>คำนวณตอนชำระเงิน</span>
                </div>
              </div>

              <div className="my-4 border-t" />
              <div className="flex justify-between items-center text-base font-semibold">
                <span>ราคารวม</span>
                <span className="text-emerald-600">{formatTHB(subtotal)}</span>
              </div>

              <button
                onClick={handleCheckout}
                className="mt-5 w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 rounded-xl shadow-md transition-transform hover:scale-[1.01] active:scale-[0.99]"
              >
                ✅ ไปชำระเงิน
              </button>

              <Link
                to="/"
                className="mt-3 block text-center text-sm text-neutral-600 hover:text-neutral-800"
              >
                ← ไปเลือกสินค้าต่อ
              </Link>

              <p className="mt-4 text-xs text-neutral-500">
                * โปรดตรวจสอบรายการและจำนวนให้ถูกต้องก่อนดำเนินการชำระเงิน
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
