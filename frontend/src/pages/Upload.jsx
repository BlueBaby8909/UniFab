import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../hooks/useCart";

export default function Upload() {
    const { addToCart } = useCart();
    const navigate = useNavigate();
    const [config, setConfig] = useState({
        material: "PLA",
        quality: "0.2",
        color: "white",
        quantity: 1,
        infill: "20"
    });

    const updateConfig = (key, val) => setConfig(prev => ({ ...prev, [key]: val }));

    const handleAddToCart = () => {
        const item = {
            id: Date.now(), // Mock ID
            name: "bracket_v2_final.stl",
            material: config.material,
            quality: config.quality,
            color: config.color,
            quantity: parseInt(config.quantity),
            infill: config.infill,
            price: 250, // Mock fixed price
            tech: "FDM",
            colorClass: "bg-gdg-blue-pastel"
        };
        addToCart(item);
        navigate("/cart");
    };

    return (
        <main className="bg-white min-h-screen">
            {/* Header / Progress Bar Sticker */}
            <div className="bg-gdg-blue border-b-[4px] border-black py-12 relative overflow-hidden">
                <div className="gdg-dot-grid absolute inset-0 opacity-20"></div>
                <div className="max-w-7xl mx-auto px-6 relative z-10 text-center lg:text-left">
                    <div className="die-cut inline-block mb-4">
                        <div className="bg-white border-[2px] border-black px-3 py-1 font-black text-[10px] uppercase tracking-widest">
                            STEP 02 — TECHNICAL SPECIFICATION
                        </div>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white uppercase italic tracking-tighter">Configure Your Manufacture</h1>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid lg:grid-cols-12 gap-12 items-start">
                    
                    {/* Left: Configuration Form */}
                    <div className="lg:col-span-8 space-y-10">
                        
                        {/* 1. File Review Sticker */}
                        <section className="sticker-card p-8 bg-slate-50">
                            <div className="flex items-center gap-4 mb-6">
                                <span className="w-10 h-10 bg-black text-white rounded-lg flex items-center justify-center font-black">01</span>
                                <h2 className="text-xl font-black uppercase tracking-tight italic">Design Review</h2>
                            </div>
                            <div className="flex items-center gap-6 p-4 bg-white border-[3px] border-black rounded-xl">
                                <div className="w-16 h-16 bg-gdg-blue-pastel border-[2px] border-black rounded-lg flex items-center justify-center text-3xl">📦</div>
                                <div className="flex-1">
                                    <p className="font-black text-sm uppercase text-outfit">bracket_v2_final.stl</p>
                                    <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest">12.4 MB · 45 x 30 x 12 mm</p>
                                </div>
                                <button className="text-xs font-black text-gdg-red uppercase tracking-widest border-b-2 border-gdg-red hover:text-black hover:border-black transition-all">Replace File</button>
                            </div>
                        </section>

                        {/* 2. Material & Technology */}
                        <section className="sticker-card p-8">
                            <div className="flex items-center gap-4 mb-8">
                                <span className="w-10 h-10 bg-gdg-blue text-white rounded-lg flex items-center justify-center font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">02</span>
                                <h2 className="text-xl font-black uppercase tracking-tight italic">Printing Specs</h2>
                            </div>

                            <div className="space-y-8">
                                <div>
                                    <label className="input-label">Material Category</label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[
                                            { id: 'PLA', label: 'PLA', sub: 'Standard' },
                                            { id: 'ABS', label: 'ABS', sub: 'Industrial' },
                                            { id: 'PETG', label: 'PETG', sub: 'Resistant' },
                                            { id: 'TPU', label: 'TPU', sub: 'Flexible' }
                                        ].map(opt => (
                                            <label key={opt.id} className="cursor-pointer">
                                                <input 
                                                    type="radio" name="mat" className="peer sr-only" 
                                                    checked={config.material === opt.id}
                                                    onChange={() => updateConfig('material', opt.id)}
                                                />
                                                <div className="peer-checked:bg-gdg-blue peer-checked:text-white border-[3px] border-black rounded-xl p-4 text-center transition-all hover:bg-slate-50">
                                                    <p className="font-black text-sm uppercase leading-none">{opt.label}</p>
                                                    <p className="text-[9px] font-bold opacity-60 mt-1 uppercase tracking-tighter">{opt.sub}</p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-8">
                                    <div>
                                        <label className="input-label">Layer Height</label>
                                        <select 
                                            value={config.quality} 
                                            onChange={(e) => updateConfig('quality', e.target.value)}
                                            className="industrial-input appearance-none"
                                        >
                                            <option value="0.2">0.2mm - Balanced</option>
                                            <option value="0.1">0.1mm - High Detail</option>
                                            <option value="0.3">0.3mm - Draft Speed</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="input-label">Infill Density</label>
                                        <div className="flex items-center gap-4">
                                            <input 
                                                type="range" min="10" max="100" step="10" 
                                                value={config.infill} 
                                                onChange={(e) => updateConfig('infill', e.target.value)}
                                                className="flex-1 accent-black h-2"
                                            />
                                            <span className="w-16 sticker-card py-2 bg-gdg-yellow text-center font-black text-xs">{config.infill}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 3. Post-Processing / Color */}
                        <section className="sticker-card p-8">
                            <div className="flex items-center gap-4 mb-8">
                                <span className="w-10 h-10 bg-gdg-yellow text-black rounded-lg flex items-center justify-center font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">03</span>
                                <h2 className="text-xl font-black uppercase tracking-tight italic">Finish & Color</h2>
                            </div>
                            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                                {['White', 'Black', 'Blue', 'Red', 'Green', 'Grey'].map(c => (
                                    <label key={c} className="cursor-pointer">
                                        <input 
                                            type="radio" name="color" className="peer sr-only" 
                                            checked={config.color === c.toLowerCase()}
                                            onChange={() => updateConfig('color', c.toLowerCase())}
                                        />
                                        <div className={`peer-checked:ring-[4px] peer-checked:ring-black border-[3px] border-black rounded-full w-12 h-12 mx-auto mb-2 transition-all`} style={{ backgroundColor: c === 'Blue' ? '#4285F4' : c === 'Red' ? '#EA4335' : c === 'Green' ? '#34A853' : c.toLowerCase() }}></div>
                                        <p className="text-[10px] font-black uppercase text-center">{c}</p>
                                    </label>
                                ))}
                            </div>
                        </section>

                    </div>

                    {/* Right: Sticky Price Summary Sticker */}
                    <div className="lg:col-span-4 sticky top-32">
                        <div className="sticker-card bg-white overflow-hidden transform rotate-1">
                            <div className="bg-black text-white p-4 text-center italic">
                                <p className="text-xs font-black uppercase tracking-widest">ORDER SUMMARY</p>
                            </div>
                            <div className="p-8 space-y-4">
                                <div className="flex justify-between border-b-2 border-black/5 pb-2">
                                    <span className="text-[10px] font-black uppercase text-black/40">Item</span>
                                    <span className="text-xs font-black uppercase italic truncate max-w-[150px]">bracket_v2.stl</span>
                                </div>
                                <div className="flex justify-between border-b-2 border-black/5 pb-2">
                                    <span className="text-[10px] font-black uppercase text-black/40">Material</span>
                                    <span className="text-xs font-black uppercase italic">{config.material}</span>
                                </div>
                                <div className="flex justify-between border-b-2 border-black/5 pb-2">
                                    <span className="text-[10px] font-black uppercase text-black/40">Resolution</span>
                                    <span className="text-xs font-black uppercase italic">{config.quality}mm</span>
                                </div>
                                
                                <div className="pt-6">
                                    <div className="flex justify-between items-end mb-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest">Est. Total</span>
                                        <span className="text-4xl font-black text-gdg-blue leading-none">₱{(config.quantity * 250).toFixed(2)}</span>
                                    </div>
                                    <p className="text-[9px] font-bold text-black/30 uppercase tracking-tighter text-right">Includes USTP Lab Fee & Materials</p>
                                </div>

                                <div className="space-y-3 pt-6">
                                    <button 
                                        onClick={handleAddToCart}
                                        className="sticker-button w-full bg-gdg-blue text-white text-sm italic"
                                    >
                                        Add to Cart →
                                    </button>
                                    <button className="w-full text-[10px] font-black uppercase tracking-[0.2em] text-black/40 hover:text-black transition-colors">
                                        Save Configuration
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </main>
    );
}