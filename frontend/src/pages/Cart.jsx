import { Link } from "react-router-dom";
import { useCart } from "../hooks/useCart";

export default function Cart() {
    const { cartItems, updateQuantity, removeFromCart, cartTotal } = useCart();

    return (
        <main className="bg-white min-h-screen py-20 px-6 relative overflow-hidden">
            <div className="gdg-dot-grid absolute inset-0 -z-10 opacity-10"></div>
            
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <div className="die-cut inline-block mb-4">
                            <div className="bg-black text-white px-4 py-1 font-black text-[10px] uppercase tracking-[0.2em]">
                                FABRICATION QUEUE
                            </div>
                        </div>
                        <h1 className="text-5xl font-black uppercase italic tracking-tighter">Your Cart</h1>
                    </div>
                    <Link to="/database" className="text-xs font-black uppercase tracking-widest border-b-[3px] border-black hover:text-gdg-blue hover:border-gdg-blue transition-all pb-1 mb-2">
                        Add More Designs +
                    </Link>
                </div>

                {cartItems.length > 0 ? (
                    <div className="grid lg:grid-cols-12 gap-10 items-start">
                        
                        {/* Items List */}
                        <div className="lg:col-span-8 space-y-8">
                            {cartItems.map((item, index) => (
                                <div key={item.id} className="sticker-card p-6 flex flex-col md:flex-row items-center gap-6 group">
                                    <div className={`w-20 h-20 ${item.colorClass || 'bg-gdg-blue-pastel'} border-[3px] border-black rounded-xl flex items-center justify-center text-4xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:rotate-6 transition-transform`}>
                                        📦
                                    </div>
                                    <div className="flex-1 text-center md:text-left">
                                        <h3 className="font-black uppercase italic tracking-tight text-lg text-outfit">{item.name}</h3>
                                        <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest mt-1">
                                            {item.tech} · {item.material} · {item.quality}mm
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4 border-[3px] border-black rounded-xl p-2 bg-slate-50">
                                        <button 
                                            onClick={() => updateQuantity(index, -1)}
                                            className="w-8 h-8 font-black hover:bg-gdg-red-pastel rounded-lg transition-colors"
                                        >－</button>
                                        <span className="font-black text-sm">{item.quantity}</span>
                                        <button 
                                            onClick={() => updateQuantity(index, 1)}
                                            className="w-8 h-8 font-black hover:bg-gdg-green-pastel rounded-lg transition-colors"
                                        >＋</button>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-xl italic text-outfit">₱{(item.price * item.quantity).toFixed(2)}</p>
                                        <button 
                                            onClick={() => removeFromCart(index)}
                                            className="text-[9px] font-black uppercase text-gdg-red hover:underline mt-1"
                                        >Remove</button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Order Summary Sticker */}
                        <div className="lg:col-span-4 sticky top-32">
                            <div className="sticker-card bg-gdg-yellow-pastel p-8 transform rotate-1">
                                <h2 className="font-black text-xs uppercase tracking-[0.2em] mb-6 border-b-2 border-black/10 pb-4 text-center">Batch Total</h2>
                                
                                <div className="space-y-4 mb-8">
                                    <div className="flex justify-between text-[10px] font-black uppercase text-black/50">
                                        <span>Subtotal</span>
                                        <span>₱{cartTotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-black uppercase text-black/50">
                                        <span>Lab Surcharge</span>
                                        <span>₱50.00</span>
                                    </div>
                                    <div className="flex justify-between pt-4 border-t-2 border-black">
                                        <span className="font-black text-sm uppercase italic text-outfit">Total</span>
                                        <span className="font-black text-2xl italic text-outfit">₱{(cartTotal + 50).toFixed(2)}</span>
                                    </div>
                                </div>

                                <button className="sticker-button w-full bg-black text-white italic py-4 text-sm mb-4">
                                    Proceed to Billing →
                                </button>
                                
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-2 h-2 bg-gdg-green rounded-full"></div>
                                    <p className="text-[8px] font-black uppercase tracking-widest text-black/40">Campus ID Billing Supported</p>
                                </div>
                            </div>
                        </div>

                    </div>
                ) : (
                    <div className="sticker-card p-20 text-center bg-slate-50 border-dashed">
                        <p className="text-4xl mb-6">🏜️</p>
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-4">Your queue is empty</h2>
                        <p className="text-sm font-bold text-black/40 mb-8 uppercase tracking-widest">Add some designs to start manufacturing</p>
                        <Link to="/database" className="sticker-button bg-gdg-blue text-white italic">Browse Database →</Link>
                    </div>
                )}
            </div>
        </main>
    );
}