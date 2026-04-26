import { Link } from "react-router-dom";

export default function RequestDesigner() {
    return (
        <main className="bg-white min-h-screen">
            {/* Header Sticker */}
            <section className="bg-gdg-red border-b-[4px] border-black py-16 relative overflow-hidden text-white">
                <div className="gdg-dot-grid absolute inset-0 opacity-20"></div>
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="die-cut inline-block mb-4">
                        <div className="bg-white border-[2px] border-black px-4 py-1 font-black text-[10px] text-black uppercase tracking-[0.2em]">
                            CUSTOM CAD ASSISTANCE
                        </div>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black uppercase italic tracking-tighter">Hire a Designer</h1>
                    <p className="text-lg font-bold text-white/80 mt-4 max-w-xl leading-tight italic">
                        No 3D model? No problem. Our engineering students and staff can turn your sketches into production-ready CAD files.
                    </p>
                </div>
            </section>

            <section className="py-20">
                <div className="max-w-4xl mx-auto px-6">
                    <form onSubmit={(e) => e.preventDefault()} className="space-y-12">
                        
                        {/* 01 Information */}
                        <div className="sticker-card p-10 bg-slate-50 transform -rotate-1">
                            <div className="flex items-center gap-4 mb-8">
                                <span className="w-10 h-10 bg-black text-white rounded-lg flex items-center justify-center font-black">01</span>
                                <h2 className="text-xl font-black uppercase tracking-tight italic">Your Details</h2>
                            </div>
                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="input-label">Full Name</label>
                                    <input type="text" placeholder="e.g. Juan Dela Cruz" className="industrial-input" />
                                </div>
                                <div>
                                    <label className="input-label">Email Address</label>
                                    <input type="email" placeholder="e.g. juan@ustp.edu.ph" className="industrial-input" />
                                </div>
                            </div>
                        </div>

                        {/* 02 Project Description */}
                        <div className="sticker-card p-10 transform rotate-1">
                            <div className="flex items-center gap-4 mb-8">
                                <span className="w-10 h-10 bg-gdg-red text-white rounded-lg flex items-center justify-center font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">02</span>
                                <h2 className="text-xl font-black uppercase tracking-tight italic">Object Vision</h2>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <label className="input-label">Object Name</label>
                                    <input type="text" placeholder="e.g. Heavy Duty Gear Bracket" className="industrial-input" />
                                </div>
                                <div>
                                    <label className="input-label">Detailed Description</label>
                                    <textarea 
                                        placeholder="Explain the dimensions, use case, and any critical tolerances..." 
                                        className="industrial-input min-h-[160px] resize-none py-4"
                                    ></textarea>
                                </div>
                                <div>
                                    <label className="input-label">Upload Sketches / References</label>
                                    <div className="border-[3px] border-dashed border-black rounded-xl p-8 bg-white text-center hover:bg-gdg-red-pastel/30 transition-all cursor-pointer">
                                        <p className="text-xs font-black uppercase tracking-widest italic">Attach Images or PDFs</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 03 Urgency Sticker */}
                        <div className="sticker-card p-10 bg-gdg-yellow-pastel transform -rotate-1">
                            <div className="flex items-center gap-4 mb-8">
                                <span className="w-10 h-10 bg-gdg-yellow text-black rounded-lg flex items-center justify-center font-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">03</span>
                                <h2 className="text-xl font-black uppercase tracking-tight italic">Timeline</h2>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                {['Flexible', 'Urgent'].map(time => (
                                    <label key={time} className="cursor-pointer">
                                        <input type="radio" name="timeline" className="peer sr-only" defaultChecked={time === 'Flexible'} />
                                        <div className="peer-checked:bg-white peer-checked:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] border-[3px] border-black bg-white/50 rounded-2xl p-6 text-center font-black uppercase transition-all">
                                            {time}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="text-center pt-8">
                            <button className="sticker-button bg-black text-white px-16 text-lg py-5 italic">
                                Submit Design Brief →
                            </button>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-black/40 mt-8 italic">
                                Designers usually respond within 48 hours
                            </p>
                        </div>

                    </form>
                </div>
            </section>
        </main>
    );
}