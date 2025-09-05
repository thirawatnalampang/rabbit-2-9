// src/context/CartContext.jsx
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

/* ============ helper: แยกหมวด/สร้าง id ไม่ชนกัน ============ */
function getType(it) {
  if (it.type) return String(it.type).toLowerCase();
  const cat = String(it.category || '').toLowerCase();
  if (cat.includes('equip')) return 'equipment';
  if (cat.includes('food')) return 'pet-food';
  return 'rabbit';
}
function getBaseId(it) {
  return it.id ?? it.product_id ?? it.rabbit_id ?? it._id ?? String(it.name);
}
function getUniqueId(it) {
  return `${getType(it)}-${getBaseId(it)}`;
}

/* ============ คีย์ localStorage แยกตามผู้ใช้ ============ */
const GUEST_KEY = 'cart:guest';
const getUserId = (user) => user?.id ?? user?.user_id ?? user?._id ?? user?.uid ?? null;
const keyForUser = (user) => (getUserId(user) ? `cart:user:${getUserId(user)}` : GUEST_KEY);

/* ============ utils ============ */
function safeRead(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function safeWrite(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}
function mergeCarts(a = [], b = []) {
  const map = new Map();
  [...a, ...b].forEach((it) => {
    const id = it.id ?? getUniqueId(it);
    const prev = map.get(id);
    if (prev) {
      map.set(id, { ...prev, quantity: Number(prev.quantity || 1) + Number(it.quantity || 1) });
    } else {
      map.set(id, { ...it, id, quantity: Number(it.quantity || 1) });
    }
  });
  return Array.from(map.values());
}

/* ============ Provider ============ */
export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const prevUserIdRef = useRef(null);

  // สลับระหว่าง guest <-> user อย่างถูกต้อง
  useEffect(() => {
    const currId = getUserId(user);
    const prevId = prevUserIdRef.current;

    // migrate คีย์เก่า 'cart' -> guest (ครั้งเดียว)
    const legacy = localStorage.getItem('cart');
    if (legacy && !localStorage.getItem(GUEST_KEY)) {
      safeWrite(GUEST_KEY, JSON.parse(legacy));
      localStorage.removeItem('cart');
    }

    // เคส: เพิ่ง "ล็อกอิน" (จาก guest -> user)
    if (!prevId && currId) {
      const userKey = keyForUser(user);
      const guestCart = safeRead(GUEST_KEY);
      const userCart = safeRead(userKey);
      const merged = mergeCarts(userCart, guestCart);
      safeWrite(userKey, merged);
      // ไม่ลบ guest เพื่อให้ตะกร้า guest ยังอยู่กรณีออกจากระบบ
      setCartItems(merged);
      prevUserIdRef.current = currId;
      return;
    }

    // เคส: เพิ่ง "ล็อกเอาต์" (จาก user -> guest)
    if (prevId && !currId) {
      const prevUserKey = `cart:user:${prevId}`;
      const prevUserCart = safeRead(prevUserKey);
      const guestCart = safeRead(GUEST_KEY);
      const mergedToGuest = mergeCarts(guestCart, prevUserCart);
      safeWrite(GUEST_KEY, mergedToGuest);
      setCartItems(mergedToGuest);
      prevUserIdRef.current = null;
      return;
    }

    // เคส: เปลี่ยนบัญชีผู้ใช้ (user A -> user B) หรือโหลดครั้งแรก
    const currentKey = keyForUser(user);
    const current = safeRead(currentKey);
    setCartItems(current);
    prevUserIdRef.current = currId ?? null;
  }, [user]);

  // sync ลงคีย์ปัจจุบันทุกครั้งที่ cartItems เปลี่ยน
  useEffect(() => {
    const currentKey = keyForUser(user);
    safeWrite(currentKey, cartItems);
  }, [cartItems, user]);

  /* ============ actions ============ */
  const addToCart = (item) => {
    const id = getUniqueId(item);
    const qty = Number(item.quantity || 1);
    setCartItems((prev) => {
      const exists = prev.find((i) => i.id === id);
      if (exists) {
        return prev.map((i) =>
          i.id === id ? { ...i, quantity: Number(i.quantity || 1) + qty } : i
        );
        }
      return [...prev, { ...item, id, quantity: qty }];
    });
  };

  const removeFromCart = (id) => {
    setCartItems((prev) => prev.filter((i) => i.id !== id));
  };

  const clearCart = () => setCartItems([]);

  const value = useMemo(() => ({ cartItems, addToCart, removeFromCart, clearCart }), [cartItems]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
