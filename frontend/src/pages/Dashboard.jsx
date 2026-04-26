import { Link } from "react-router-dom";

export default function Dashboard() {
    const orders = [
        { id: "ORD-9921", date: "Oct 24, 2024", status: "Printing", progress: 65, color: "bg-gdg-blue", items: 3 },
        { id: "ORD-9854", date: "Oct 20, 2024", status: "Ready for Pickup", progress: 100, color: "bg-gdg-green", items: 1 },
        { id: "ORD-9712", date: "Oct 15, 2024", status: "Completed", progress: 100, color: "bg-slate-200", items: 2 },
    ];

    return (
        <main className="bg-white min-h-screen py-16 px-6 relative overflow-hidden">
            <div className="fixed inset-0 gdg-dot-grid -z-20 opacity-10"></div>
            
            <div className="max-w-6xl mx-auto">
                {/* Dashboard Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
                    <div>
                        <div className="die-cut inline-block mb-4">
                            <div className="bg-gdg-blue border-[2px] border-black px-4 py-1 font-black text-[10px] text-white uppercase tracking-[0.2em]">
                                LAB USER DASHBOARD
                            </div>
                        </div>
                        <h1 className="text-5xl font-black uppercase italic tracking-tighter">Your Projects</h1>
                    </div>
                    <Link to="/upload" className="sticker-button bg-gdg-yellow text-black italic text-sm">
                        Start New Print +
                    </Link>
                </div>

                <div className="grid lg:grid-cols-3 gap-12">
                    
                    {/* Active Orders List */}
                    <div className="lg:col-span-2 space-y-10">
                        <h2 className="font-black text-xs uppercase tracking-[0.3em] mb-8 flex items-center gap-4">
                            <span className="w-12 h-[3px] bg-black"></span> 
                            Recent Fabrication Orders
                        </h2>
                        
                        {orders.map((order) => (
                            <div key={order.id} className="sticker-card p-8 bg-white group">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 pb-6 border-b-[3px] border-black/5">
                                    <div>
                                        <p className="text-[10px] font-black text-black/30 uppercase tracking-widest">{order.date}</p>
                                        <h3 className="text-2xl font-black uppercase italic tracking-tight">{order.id}</h3>
                                    </div>
                                    <div className={`sticker-card ${order.color} ${order.color === 'bg-slate-200' ? 'text-black/40' : 'text-white'} px-4 py-2 text-[10px] font-black uppercase tracking-widest transform rotate-2`}>
                                        {order.status}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex justify-between items-end mb-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest">Fabrication Progress</p>
                                        <p className="text-xl font-black italic">{order.progress}%</p>
                                    </div>
                                    <div className="h-6 bg-slate-100 border-[3px] border-black rounded-full overflow-hidden p-1">
                                        <div 
                                            className={`h-full ${order.color} rounded-full transition-all duration-1000 border-r-[2px] border-black`}
                                            style={{ width: `${order.progress}%` }}
                                        ></div>
                                    </div>
                                    
                                    <div className="flex justify-between items-center pt-4">
                                        <p className="text-xs font-bold text-black/60 italic">{order.items} technical items in this batch</p>
                                        <button className="text-[10px] font-black uppercase text-gdg-blue border-b-2 border-gdg-blue hover:text-black hover:border-black transition-all">
                                            View Full Specs →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Sidebar Stats Sticker */}
                    <div className="lg:col-span-1">
                        <div className="space-y-8">
                            <div className="sticker-card bg-gdg-green-pastel p-8 transform rotate-1">
                                <h4 className="font-black text-xs uppercase tracking-widest mb-6 text-center">User Statistics</h4>
                                <div className="space-y-6">
                                    <div className="text-center p-4 bg-white border-[2px] border-black rounded-xl">
                                        <p className="text-3xl font-black leading-none">12</p>
                                        <p className="text-[9px] font-black uppercase tracking-tighter opacity-40 mt-1">Total Prints</p>
                                    </div>
                                    <div className="text-center p-4 bg-white border-[2px] border-black rounded-xl">
                                        <p className="text-3xl font-black leading-none text-gdg-red">0</p>
                                        <p className="text-[9px] font-black uppercase tracking-tighter opacity-40 mt-1">Failed Submissions</p>
                                    </div>
                                </div>
                            </div>

                            <div className="sticker-card bg-black p-8 text-white text-center">
                                <p className="text-xs font-black uppercase tracking-[0.2em] mb-4">Laboratory Hours</p>
                                <p className="text-lg font-black italic mb-2">08:00 AM — 05:00 PM</p>
                                <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Monday to Friday · CDO Campus</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </main>
    );
}