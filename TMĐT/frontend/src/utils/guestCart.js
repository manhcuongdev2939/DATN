const STORAGE_KEY = "guest_cart";

const readCart = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch (_) {
    return [];
  }
};

const writeCart = (items) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  try {
    window.dispatchEvent(new CustomEvent("cart-updated"));
  } catch (_) {
    /* noop */
  }
};

export const getCart = () => {
  const items = readCart();
  const total = items.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );
  return { items, total };
};

export const addToCart = ({ id, name, price, thumbnail, quantity = 1 }) => {
  const items = readCart();
  const idx = items.findIndex((i) => i.id === id);
  if (idx >= 0) {
    items[idx].quantity += quantity;
  } else {
    items.push({ id, name, price, thumbnail, quantity });
  }
  writeCart(items);
};

export const updateQuantity = (id, quantity) => {
  const items = readCart().map((i) =>
    i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i
  );
  writeCart(items);
};

export const removeItem = (id) => {
  const items = readCart().filter((i) => i.id !== id);
  writeCart(items);
};

export const clearCart = () => {
  writeCart([]);
};

