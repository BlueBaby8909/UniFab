import {Link, NavLink, useNavigate} from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useCart } from "../../hooks/useCart";

export default function Header(){
    const { user, logout } = useAuth();
    const { cartCount } = useCart();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return(
        <header className="bg-white border-b-[4px] border-black sticky top-0 z-50">
            <div className="header-main max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                <div className="logo shrink-0">
                    <Link to="/" className="logo-link flex items-center gap-3 group">
                        <span className="logo-icon w-10 h-10 bg-gdg-blue border-[3px] border-black rounded-xl flex items-center justify-center text-white font-black text-lg shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] group-hover:translate-x-0.5 group-hover:translate-y-0.5 group-hover:shadow-none transition-all">UF</span>
                        <span className="text-2xl font-black text-black tracking-tighter uppercase italic text-outfit">UniFab</span>
                    </Link>
                </div>
            
            <nav className="hidden md:flex items-center flex-1 ml-16">
                <ul className="flex gap-10">
                    <li><NavLink to="/" className="text-xs font-black uppercase tracking-widest text-black/60 hover:text-gdg-blue transition-colors">Services</NavLink></li>
                    <li><NavLink to="/database" className="text-xs font-black uppercase tracking-widest text-black/60 hover:text-gdg-blue transition-colors">Database</NavLink></li>
                    <li><NavLink to="/request-designer" className="text-xs font-black uppercase tracking-widest text-black/60 hover:text-gdg-blue transition-colors">Designers</NavLink></li>
                    <li><NavLink to="/dashboard" className="text-xs font-black uppercase tracking-widest text-black/60 hover:text-gdg-blue transition-colors">Tracking</NavLink></li>
                    {user?.role === 'admin' && (
                        <li><NavLink to="/admin" className="text-xs font-black uppercase tracking-widest text-gdg-red border-b-2 border-gdg-red">Admin Panel</NavLink></li>
                    )}
                </ul>
            </nav>

            <div className="user-actions flex gap-6 ml-auto items-center">
                <Link to="/cart" className="relative group">
                    <span className="text-2xl group-hover:scale-110 transition-transform block">🛒</span>
                    {cartCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-gdg-red text-white text-[8px] font-black w-4 h-4 rounded-full border border-black flex items-center justify-center shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]">
                            {cartCount}
                        </span>
                    )}
                </Link>

                {user ? (
                    <div className="flex items-center gap-4">
                        <div className="sticker-card bg-gdg-blue-pastel px-3 py-1.5 flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase italic">Hi, {user.name}</span>
                        </div>
                        <button 
                            onClick={handleLogout}
                            className="text-xs font-black uppercase tracking-widest text-black/40 hover:text-gdg-red transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                ) : (
                    <>
                        <Link to="/login" className="text-xs font-black uppercase tracking-widest text-black hover:text-gdg-blue transition-all">Log In</Link>
                        <Link to="/register" className="sticker-button bg-gdg-yellow text-black text-[10px] py-2 px-6">Sign Up</Link>
                    </>
                )}
            </div>
        </div>
        </header>
    )
}