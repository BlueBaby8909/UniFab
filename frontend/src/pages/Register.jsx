import { Link } from "react-router-dom";

export default function Register() {
    return(
        <main className="bg-white min-h-screen relative overflow-hidden flex items-center justify-center py-20 px-6">
            <div className="gdg-dot-grid absolute inset-0 -z-10 opacity-10"></div>
            
            <div className="sticker-card bg-white w-full max-w-2xl p-10 relative transform rotate-1">
                <div className="absolute -top-8 -left-8 w-24 h-24 bg-gdg-green border-[3px] border-black rounded-xl flex items-center justify-center font-black text-white text-4xl -rotate-12 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">UF</div>

                <div className="text-center mb-10">
                    <div className="die-cut inline-block mb-4">
                        <div className="bg-gdg-yellow border-[2px] border-black px-4 py-1 font-black text-[10px] text-black uppercase tracking-widest">
                            MEMBERSHIP APPLICATION
                        </div>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter">Join the Lab</h1>
                </div>

                <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="input-label">First Name</label>
                            <input type="text" placeholder="Juan" className="industrial-input" required />
                        </div>
                        <div>
                            <label className="input-label">Last Name</label>
                            <input type="text" placeholder="Dela Cruz" className="industrial-input" required />
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="input-label">Campus Email</label>
                            <input type="email" placeholder="juan.dc@ustp.edu.ph" className="industrial-input" required />
                        </div>
                        <div>
                            <label className="input-label">Department / Role</label>
                            <select className="industrial-input appearance-none" required>
                                <option value="">Select Role</option>
                                <option value="student">Student</option>
                                <option value="researcher">Researcher</option>
                                <option value="faculty">Faculty</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="input-label">Password</label>
                            <input type="password" placeholder="••••••••" className="industrial-input" required />
                        </div>
                        <div>
                            <label className="input-label">Confirm Password</label>
                            <input type="password" placeholder="••••••••" className="industrial-input" required />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-slate-50 border-[3px] border-black rounded-xl">
                        <input type="checkbox" className="w-6 h-6 border-[3px] border-black rounded accent-black" required id="terms" />
                        <label htmlFor="terms" className="text-[10px] font-black uppercase tracking-wider leading-none cursor-pointer">
                            I AGREE TO THE LABORATORY SAFETY & PRIVACY TERMS
                        </label>
                    </div>

                    <button type="submit" className="sticker-button w-full bg-gdg-blue text-white italic py-5 text-lg">
                        Create My Account →
                    </button>
                </form>

                <p className="text-center text-xs font-bold text-black/50 mt-10">
                    Already a member? <Link to="/login" className="text-gdg-red font-black hover:underline uppercase italic">Back to Login</Link>
                </p>
            </div>
        </main>
    )
}