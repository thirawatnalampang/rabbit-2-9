import { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  const addToCart = (item) => {
    // ✅ normalize id ให้ทุกตัวมีค่า id
    const id = item.id ?? item.product_id ?? item.rabbit_id;
    const normalized = {
      ...item,
      id,
      quantity: item.quantity || 1,
    };

    setCartItems((prev) => {
      const exists = prev.find((i) => i.id === id);
      if (exists) {
        return prev.map((i) =>
          i.id === id ? { ...i, quantity: i.quantity + normalized.quantity } : i
        );
      }
      return [...prev, normalized];
    });
  };

  const removeFromCart = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => setCartItems([]); // ✅ เผื่ออยากเคลียร์ทั้งหมด

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
