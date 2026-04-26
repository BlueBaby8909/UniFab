import { useState } from "react";
import { Link } from "react-router-dom";

export default function Database() {
    const [search, setSearch] = useState("");

    const designs = [
        { id: 1, name: "Planetary Gear Set", cat: "Engineering", img: "⚙️", color: "bg-gdg-blue-pastel" },
        { id: 2, name: "Succulent Planter", cat: "Decor", img: "🪴", color: "bg-gdg-green-pastel" },
        { id: 3, name: "Laptop Stand Kit", cat: "Tools", img: "💻", color: "bg-gdg-yellow-pastel" },
        { id: 4, name: "Chess Piece Set", cat: "Games", img: "♟️", color: "bg-gdg-red-pastel" },
        { id: 5, name: "Cable Organizer", cat: "Tools", img: "🔌", color: "bg-gdg-blue-pastel" },
        { id: 6, name: "Phone Tripod", cat: "Tech", img: "🤳", color: "bg-gdg-green-pastel" },
    ];

    return (
        <main className="bg-white min-h-screen">
            {/* Database Header */}
            <section className="bg-gdg-yellow border-b-[4px] border-black py-16 relative overflow-hidden">
                <div className="gdg-dot-grid absolute inset-0 opacity-20"></div>
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="die-cut inline-block mb-4">
                        <div className="bg-white border-[2px] border-black px-4 py-1 font-black text-[10px] uppercase tracking-[0.2em]">
                            VERIFIED DESIGN REPOSITORY
                        </div>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black text-black uppercase italic tracking-tighter">Explore the Library</h1>
                    <p className="text-lg font-bold text-black/60 mt-4 max-w-xl leading-tight">
                        Verified, printable models approved by the USTP FabLab staff. <br/>
                        <span className="bg-white px-2 border-2 border-black inline-block mt-2">Pick a sticker. Start manufacturing.</span>
                    </p>
                </div>
            </section>

            <section className="py-12">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid lg:grid-cols-12 gap-10">
                        
                        {/* Left: Filter Sidebar */}
                        <aside className="lg:col-span-3 space-y-8">
                            <div className="sticker-card p-6 bg-slate-50">
                                <label className="input-label">Search Library</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        placeholder="Find a model..." 
                                        className="industrial-input pl-10"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl">🔍</span>
                                </div>

                                <div className="mt-8 space-y-6">
                                    <div>
                                        <label className="input-label">Categories</label>
                                        <div className="space-y-2">
                                            {['Engineering', 'Art & Decor', 'Tools', 'Educational'].map(cat => (
                                                <label key={cat} className="flex items-center gap-3 group cursor-pointer">
                                                    <div className="w-5 h-5 border-[2px] border-black rounded group-hover:bg-gdg-yellow transition-all"></div>
                                                    <span className="text-xs font-black uppercase tracking-tighter">{cat}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="input-label">Compatibility</label>
                                        <div className="flex flex-wrap gap-2">
                                            {['FDM', 'SLA', 'CNC'].map(tag => (
                                                <span key={tag} className="bg-white border-[2px] border-black px-3 py-1 rounded-lg text-[10px] font-black uppercase">{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </aside>

                        {/* Right: Design Grid */}
                        <div className="lg:col-span-9">
                            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
                                {designs.map((item, i) => (
                                    <div key={item.id} className={`sticker-card overflow-hidden group transform ${i % 2 === 0 ? 'rotate-1' : '-rotate-1'} hover:rotate-0`}>
                                        <div className={`${item.color} h-48 border-b-[3px] border-black flex items-center justify-center text-6xl group-hover:scale-110 transition-transform`}>
                                          {item.img}
                                        </div>
                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-[9px] font-black uppercase tracking-[0.2em] bg-black text-white px-2 py-0.5 rounded">
                                                    {item.cat}
                                                </span>
                                            </div>
                                            <h3 className="text-xl font-black uppercase tracking-tighter italic mb-4">{item.name}</h3>
                                            <Link to="/upload" className="sticker-button w-full bg-white text-black text-center text-xs block py-2.5">
                                                Order Print →
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination / Load More Sticker */}
                            <div className="mt-16 text-center">
                                <button className="sticker-button bg-black text-white px-12 italic">
                                    Load More Designs
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </section>
        </main>
    );
}