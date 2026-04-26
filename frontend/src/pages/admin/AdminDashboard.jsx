import { Link } from "react-router-dom";

export default function AdminDashboard() {
    const orders = [
        { id: "ORD-9921", user: "Juan D.", file: "bracket_v2.stl", status: "In Review", color: "bg-gdg-yellow" },
        { id: "ORD-9922", user: "Maria S.", file: "chassis.obj", status: "Printing", color: "bg-gdg-blue" },
        { id: "ORD-9923", user: "Ken O.", file: "sensor_mount.step", status: "QC Check", color: "bg-gdg-green-pastel" },
    ];

    return (
        <main className="bg-white min-h-screen py-12 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-end mb-16">
                    <div>
                        <div className="die-cut inline-block mb-4">
                            <div className="bg-black text-white px-4 py-1 font-black text-[10px] uppercase tracking-[0.2em]">
                                LAB STAFF COMMAND CENTER
                            </div>
                        </div>
                        <h1 className="text-5xl font-black uppercase italic tracking-tighter text-black">Master Queue</h1>
                    </div>
                    
                    <div className="flex gap-4">
                        <div className="sticker-card bg-gdg-blue-pastel px-6 py-3 text-center">
                            <p className="text-[9px] font-black uppercase opacity-40">Active Prints</p>
                            <p className="text-2xl font-black">04</p>
                        </div>
                        <div className="sticker-card bg-gdg-red-pastel px-6 py-3 text-center">
                            <p className="text-[9px] font-black uppercase opacity-40">Pending Review</p>
                            <p className="text-2xl font-black">12</p>
                        </div>
                    </div>
                </div>

                <div className="sticker-card overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-black text-white">
                            <tr>
                                <th className="p-6 text-[10px] font-black uppercase tracking-widest italic">Order ID</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-widest italic">Student</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-widest italic">Design File</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-widest italic">Status</th>
                                <th className="p-6 text-[10px] font-black uppercase tracking-widest italic text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-[2px] divide-black/5">
                            {orders.map((order) => (
                                <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-6 font-black italic text-sm">{order.id}</td>
                                    <td className="p-6">
                                        <p className="font-bold text-sm">{order.user}</p>
                                        <p className="text-[9px] font-black uppercase text-black/30">Engineering Dept</p>
                                    </td>
                                    <td className="p-6">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl">📦</span>
                                            <span className="font-black text-xs uppercase tracking-tight">{order.file}</span>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        <span className={`inline-block px-3 py-1 border-[2px] border-black rounded-lg text-[9px] font-black uppercase tracking-tighter ${order.color}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="p-6 text-right space-x-2">
                                        <button className="sticker-button bg-white text-black py-1.5 px-3 text-[9px]">View STL</button>
                                        <button className="sticker-button bg-black text-white py-1.5 px-3 text-[9px]">Update</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="mt-12 grid md:grid-cols-3 gap-8">
                    <div className="sticker-card p-6 bg-gdg-yellow transform -rotate-1">
                        <h3 className="font-black uppercase text-xs mb-4">Filament Inventory</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold uppercase">PLA (White)</span>
                                <span className="font-black text-sm">2.4 kg</span>
                            </div>
                            <div className="h-2 bg-white/30 rounded-full">
                                <div className="h-full bg-white w-3/4 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                    <div className="sticker-card p-6 bg-gdg-blue transform rotate-1 text-white">
                        <h3 className="font-black uppercase text-xs mb-4 text-white">Machine Status</h3>
                        <div className="flex items-center gap-3">
                            <div className="w-3 h-3 bg-gdg-green rounded-full border-2 border-white animate-pulse"></div>
                            <p className="text-sm font-black italic">6/8 PRINTERS ACTIVE</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}