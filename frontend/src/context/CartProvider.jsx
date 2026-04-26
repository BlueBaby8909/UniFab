import { useState } from "react";
import { CartContext } from "./CartContext";

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);

    const addToCart = (item) => {
        setCartItems(prev => {
            const existingItem = prev.find(i => i.id === item.id && i.material === item.material && i.quality === item.quality);
            if (existingItem) {
                return prev.map(i => 
                    (i.id === item.id && i.material === item.material && i.quality === item.quality)
                    ? { ...i, quantity: i.quantity + item.quantity }
                    : i
                );
            }
            return [...prev, item];
        });
    };

    const removeFromCart = (index) => {
        setCartItems(prev => prev.filter((_, i) => i !== index));
    };

    const updateQuantity = (index, delta) => {
        setCartItems(prev => prev.map((item, i) => 
            i === index ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
        ));
    };

    const clearCart = () => setCartItems([]);

    const cartTotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount }}>
            {children}
        </CartContext.Provider>
    );
};
