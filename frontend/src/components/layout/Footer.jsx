import { Link } from "react-router-dom";

export default function Footer() {
    return(
        <footer className="bg-white border-t-[4px] border-black py-24">
            <div className="footer-content max-w-7xl mx-auto px-6">
                <div className="grid md:grid-cols-3 gap-16 mb-16">
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <span className="w-8 h-8 bg-gdg-green border-[2px] border-black rounded-lg flex items-center justify-center text-white font-black text-xs">UF</span>
                            <h3 className="text-black font-black text-xl tracking-tighter uppercase italic">UniFab</h3>
                        </div>
                        <p className="text-black/60 font-bold text-sm leading-relaxed">
                            Modular fabrication for USTP CDO. <br/>
                            Built for students. Built for the future.
                        </p>
                    </div>
                    <div>
                        <h4 className="text-black font-black text-xs mb-8 uppercase tracking-[0.2em]">Sitemap</h4>
                        <ul className="space-y-4">
                            {['About', 'Services', 'Database', 'FAQ'].map(link => (
                                <li key={link}>
                                    <Link to="/" className="text-sm font-bold text-black/50 hover:text-gdg-blue transition-colors">
                                        {link}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-black font-black text-xs mb-8 uppercase tracking-[0.2em]">Contact</h4>
                        <address className="not-italic text-sm space-y-3">
                            <p className="font-bold text-black/70">USTP Cagayan de Oro City, Philippines</p>
                            <a href="mailto:fablab@ustp.edu.ph" className="sticker-button bg-gdg-blue-pastel text-black text-[10px] inline-block">
                                fablab@ustp.edu.ph
                            </a>
                        </address>
                    </div>
                </div>
                <div className="border-t-[2px] border-black/10 pt-12 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-black/30 text-[10px] font-black uppercase tracking-widest italic">&copy; 2024 USTP-CDO FABRICATION LAB</p>
                    <div className="flex gap-4">
                        <div className="w-8 h-8 bg-black rounded-full"></div>
                        <div className="w-8 h-8 bg-gdg-red border-2 border-black rounded-full"></div>
                        <div className="w-8 h-8 bg-gdg-yellow border-2 border-black rounded-full"></div>
                    </div>
                </div>
            </div>
        </footer>
    )
}