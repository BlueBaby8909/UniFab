import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        const result = login(email, password);
        if (result.success) {
            navigate(result.user.role === 'admin' ? "/admin" : "/dashboard");
        } else {
            setError(result.message);
        }
    };

    return(
        <main className="bg-white min-h-screen relative overflow-hidden flex items-center justify-center py-20 px-6">
            <div className="gdg-dot-grid absolute inset-0 -z-10 opacity-10"></div>
            
            <div className="sticker-card bg-white w-full max-w-md p-10 relative">
                <div className="absolute -top-6 -right-6 w-16 h-16 bg-gdg-yellow border-[3px] border-black rounded-full flex items-center justify-center font-black text-3xl rotate-12 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">!</div>

                <div className="text-center mb-10">
                    <div className="die-cut inline-block mb-4">
                        <div className="bg-gdg-blue border-[2px] border-black px-3 py-1 font-black text-[10px] text-white uppercase tracking-widest">
                            AUTHENTICATION PORTAL
                        </div>
                    </div>
                    <h1 className="text-4xl font-black uppercase italic tracking-tighter">Welcome Back</h1>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-gdg-red-pastel border-[2px] border-black p-3 rounded-lg text-center font-black text-[10px] uppercase text-gdg-red">
                            {error}
                        </div>
                    )}
                    <div>
                        <label className="input-label">Student / Researcher Email</label>
                        <input 
                            type="email" 
                            placeholder="e.g. juan@ustp.edu.ph" 
                            className="industrial-input" 
                            required 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="input-label mb-0">Password</label>
                            <Link to="/" className="text-[10px] font-black uppercase text-gdg-blue hover:underline">Forgot?</Link>
                        </div>
                        <input 
                            type="password" 
                            placeholder="••••••••" 
                            className="industrial-input" 
                            required 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                        />
                    </div>

                    <button type="submit" className="sticker-button w-full bg-black text-white italic py-4 mt-2">
                        Enter Laboratory →
                    </button>
                </form>

                <p className="text-center text-xs font-bold text-black/50 mt-10">
                    New to UniFab? <Link to="/register" className="text-gdg-blue font-black hover:underline">Sign up for a card</Link>
                </p>
            </div>
        </main>
    )
}