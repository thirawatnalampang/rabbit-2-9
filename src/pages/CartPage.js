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

  const totalPrice = cartItems.reduce((sum, it) => {
    return sum + getUnitPrice(it) * getQty(it);
  }, 0);

  const handleCheckout = () => {
    if (!user) {
      navigate('/get-started', { state: { from: '/checkout' } });
    } else {
      navigate('/checkout');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 mt-6">
      <h1 className="text-3xl font-bold mb-6">🛒 ตะกร้าของคุณ</h1>

      {cartItems.length === 0 ? (
        <p className="text-center text-gray-500">ไม่มีสินค้าในตะกร้า</p>
      ) : (
        <>
          <div className="space-y-4">
            {cartItems.map((item) => {
              const id = getId(item);
              const qty = getQty(item);
              const unit = getUnitPrice(item);
              const name = getName(item);
              const img = getImage(item);
              const link = detailLink(item);

              return (
                <div
                  key={id}
                  className="flex items-center border rounded-lg p-4 shadow-md bg-white"
                >
                  <Link to={link} className="shrink-0">
                    <img
                      src={img}
                      alt={name}
                      className="w-24 h-24 rounded-md object-cover"
                      onError={(e) => {
                        e.currentTarget.src = FALLBACK_IMG;
                      }}
                    />
                  </Link>

                  <div className="ml-4 flex-1">
                    <Link to={link} className="text-xl font-semibold hover:underline">
                      {name}
                    </Link>
                    <p className="text-sm text-gray-500">จำนวน: {qty}</p>
                    <p className="text-pink-600 font-semibold mt-1">
                      {formatTHB(unit * qty)}
                    </p>
                  </div>

                  <button
                    onClick={() => removeFromCart(getId(item))}
                    className="ml-4 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    ลบ
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-6 border-t pt-4 flex justify-between items-center text-xl font-semibold">
            <span>ราคารวม</span>
            <span className="text-green-600">{formatTHB(totalPrice)}</span>
          </div>

          <button
            onClick={handleCheckout}
            className="mt-6 block w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-full shadow-lg transition-transform transform hover:scale-105"
          >
            ✅ ไปชำระเงิน
          </button>
        </>
      )}
    </div>
  );
}
