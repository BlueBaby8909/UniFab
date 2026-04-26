import { useState } from "react";
import { Link } from "react-router-dom";

export default function Home() {
  const [activeTab, setActiveTab] = useState("3d-printing");

  return (
    <main className="bg-white text-black font-sans selection:bg-gdg-yellow selection:text-black min-h-screen overflow-x-hidden">
      {/* Background Dot Grid Layer */}
      <div className="fixed inset-0 gdg-dot-grid -z-20"></div>

      {/* Hero Section */}
      <section className="relative pt-8 pb-16 md:pt-16 md:pb-24">
        
        {/* Decorative Floating Stickers (Background) - Scaled down */}
        <div className="hidden xl:block absolute top-[15%] left-[2%] transform -rotate-12 opacity-30 -z-10">
          <div className="sticker-card bg-gdg-red px-4 py-1.5 font-black text-white uppercase italic text-xs">FASTER</div>
        </div>
        <div className="hidden xl:block absolute bottom-[25%] left-[10%] transform rotate-6 opacity-30 -z-10">
          <div className="sticker-card bg-gdg-green px-4 py-1.5 font-black text-white uppercase italic text-xs">PRECISE</div>
        </div>

        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-12 gap-8 xl:gap-12 items-center">
            
            {/* Left Side: Scaled down typography to prevent overlap */}
            <div className="lg:col-span-7 space-y-6 md:space-y-8">
              <div className="die-cut inline-block">
                <div className="bg-black text-white px-3 py-1 rounded-md font-black text-[9px] uppercase tracking-[0.2em] flex items-center gap-2">
                  <span className="w-2 h-2 bg-gdg-green rounded-full border-2 border-white animate-pulse"></span>
                  USTP CDO FABRICATION LABORATORY
                </div>
              </div>

              <div className="relative">
                <h1 className="text-4xl md:text-5xl xl:text-6xl font-black leading-[0.95] uppercase tracking-tighter italic">
                  Your Ideas, <br />
                  <span className="relative inline-block mt-3 lg:mt-4">
                    <span className="absolute -inset-1.5 bg-white border-[2px] border-black -z-10 transform rotate-1"></span>
                    <span className="text-gdg-blue bg-gdg-blue-pastel border-[3px] border-black px-4 py-1.5 inline-block transform -rotate-2">
                      Manufactured.
                    </span>
                  </span>
                </h1>
              </div>

              <div className="max-w-md">
                <p className="text-lg font-bold text-black/80 leading-snug">
                  High-precision 3D printing & design help. <br/>
                  <span className="bg-gdg-yellow px-2.5 py-0.5 border-[2px] border-black inline-block mt-2 transform rotate-1">
                    Made on campus. Made for you.
                  </span>
                </p>
              </div>

              {/* Grid-based Stats Block - Scaled down */}
              <div className="grid grid-cols-3 gap-3 pt-8 border-t-[2px] border-black/10 max-w-sm">
                {[
                  { val: "24H", label: "Lead Time", color: "bg-gdg-blue-pastel" },
                  { val: "500+", label: "Projects", color: "bg-gdg-red-pastel" },
                  { val: "99%", label: "Success", color: "bg-gdg-green-pastel" },
                ].map((stat, i) => (
                  <div key={i} className={`sticker-card ${stat.color} p-3 text-center transform ${i % 2 === 0 ? '-rotate-1' : 'rotate-1'}`}>
                    <p className="text-2xl font-black text-black leading-none">{stat.val}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest mt-1.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side: The Order Sticker - More compact size */}
            <div className="lg:col-span-5 relative mt-12 lg:mt-0">
              <div className="sticker-card overflow-hidden max-w-[420px] mx-auto lg:ml-auto">
                <div className="flex bg-black p-1 gap-1">
                  {["3d-printing", "design-help"].map((tab) => (
                    <button 
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-2.5 text-[9px] font-black uppercase tracking-[0.2em] rounded-lg transition-all ${
                        activeTab === tab 
                        ? "bg-white text-black" 
                        : "text-white hover:bg-white/10"
                      }`}
                    >
                      {tab.replace("-", " ")}
                    </button>
                  ))}
                </div>

                <div className="p-6 space-y-5">
                  {activeTab === "3d-printing" ? (
                    <form className="space-y-5">
                      <div>
                        <label className="input-label">1. Upload Design File</label>
                        <div className="relative group cursor-pointer">
                          <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                          <div className="border-[2px] border-dashed border-black bg-slate-50 group-hover:bg-gdg-blue-pastel/20 transition-all rounded-xl p-6 text-center">
                            <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">📁</div>
                            <p className="text-xs font-black uppercase tracking-tighter italic">Click to browse designs</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="input-label">Technology</label>
                          <select className="industrial-input text-xs py-2 px-3 appearance-none">
                            <option>FDM (Plastic)</option>
                            <option>SLA (Resin)</option>
                          </select>
                        </div>
                        <div>
                          <label className="input-label">Material</label>
                          <select className="industrial-input text-xs py-2 px-3 appearance-none">
                            <option>PLA (Standard)</option>
                            <option>ABS (Industrial)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="input-label">Quantity</label>
                          <input type="number" min="1" defaultValue="1" className="industrial-input text-xs py-2 px-3" />
                        </div>
                        <div>
                          <label className="input-label">Infill</label>
                          <select className="industrial-input text-xs py-2 px-3 appearance-none">
                            <option>20% (Draft)</option>
                            <option>50% (Strong)</option>
                          </select>
                        </div>
                      </div>

                      <button className="sticker-button w-full bg-gdg-blue text-white mt-2 py-3.5 text-xs italic">
                        Process Order Now →
                      </button>
                    </form>
                  ) : (
                    <form className="space-y-5">
                      <div>
                        <label className="input-label">Project Description</label>
                        <textarea 
                          placeholder="What would you like us to help you design?" 
                          className="industrial-input min-h-[140px] text-xs py-3 resize-none"
                        ></textarea>
                      </div>
                      <button className="sticker-button w-full bg-gdg-red text-white py-3.5 text-xs italic">
                        Submit Inquiry →
                      </button>
                    </form>
                  )}
                  
                  <div className="pt-4 border-t-[2px] border-black/5 flex items-center justify-center gap-2">
                    <span className="w-1 h-1 bg-gdg-green rounded-full"></span>
                    <p className="text-[9px] font-black uppercase tracking-widest text-black/30 italic">
                      SECURE CAMPUS BILLING
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Services Section - More compact padding */}
      <section className="py-20 bg-gdg-green-pastel border-y-[3px] border-black relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-8">
            <div className="max-w-xl">
              <p className="text-[11px] font-black text-gdg-blue uppercase tracking-[0.3em] mb-3">OUR CAPABILITIES</p>
              <h2 className="text-3xl md:text-4xl font-black text-black leading-[0.95] uppercase italic tracking-tighter">Manufacturing Power. <br/>At Your Fingertips.</h2>
            </div>
            <Link to="/database" className="sticker-button bg-white text-black whitespace-nowrap italic shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-xs py-2.5 px-5">
              Explore Database →
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "FDM Printing", desc: "Reliable PLA/ABS printing for functional parts and structural prototypes.", icon: "⚙️" },
              { title: "SLA Resin", desc: "Ultra-high detail resin prints for intricate jewelry and dental models.", icon: "🧪" },
              { title: "CAD Design", desc: "Expert engineering support to turn your sketches into printable models.", icon: "✏️" }
            ].map((service, i) => (
              <div key={i} className={`sticker-card p-8 bg-white transform ${i === 1 ? 'rotate-1' : '-rotate-1'} hover:rotate-0 transition-transform`}>
                <div className="w-12 h-12 bg-gdg-blue-pastel border-[2px] border-black rounded-xl flex items-center justify-center text-2xl mb-6 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                  {service.icon}
                </div>
                <h3 className="text-xl font-black text-black mb-3 uppercase tracking-tighter">{service.title}</h3>
                <p className="text-xs font-bold text-black/60 leading-relaxed">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
