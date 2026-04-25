import Link from "next/link";

const Instagram = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

const Twitter = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
  </svg>
);

const Youtube = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 7.1C2 8.7 2 12 2 12s0 3.3.5 4.9c.3 1.1 1.2 2 2.3 2.3C6.4 19.7 12 19.7 12 19.7s5.6 0 7.2-.5c1.1-.3 2-1.2 2.3-2.3.5-1.6.5-4.9.5-4.9s0-3.3-.5-4.9c-.3-1.1-1.2-2-2.3-2.3C17.6 2.3 12 2.3 12 2.3s-5.6 0-7.2.5C3.7 3.1 2.8 4 2.5 5.1z"/>
    <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/>
  </svg>
);

export default function Footer() {
  return (
    <footer className="bg-voite-black pt-24 pb-12 border-t border-white/5">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          
          <div className="md:col-span-2">
            <Link href="/" className="text-2xl font-light tracking-[0.2em] uppercase text-white mb-6 inline-block heading-style">
              VOITÉ.
            </Link>
            <p className="text-white/40 max-w-sm leading-relaxed font-light text-sm">
              Not made to be seen. Made to be felt. Minimal luxury streetwear.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-bold mb-6 tracking-widest uppercase text-sm heading-style">Alışveriş</h4>
            <ul className="space-y-4 text-white/50">
              <li><Link href="/drop" className="hover:text-white transition-colors">Son Drop</Link></li>
              <li><Link href="/essentials" className="hover:text-white transition-colors">Temel Parçalar</Link></li>
              <li><Link href="/archive" className="hover:text-white transition-colors">Arşiv</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white/60 font-light mb-6 tracking-[0.2em] uppercase text-xs">Destek</h4>
            <ul className="space-y-4 text-white/40 text-sm font-light">
              <li><Link href="/contact" className="hover:text-white transition-colors">İletişim</Link></li>
              <li><Link href="/returns" className="hover:text-white transition-colors">İadeler</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Gizlilik Politikası</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Kullanım Koşulları</Link></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/5 text-white/30 text-xs font-light">
          <p>&copy; {new Date().getFullYear()} VOITÉ. Tüm hakları saklıdır.</p>
          <div className="flex space-x-6 mt-4 md:mt-0 opacity-50">
            <a href="#" className="hover:text-white transition-colors"><Instagram size={20} /></a>
            <a href="#" className="hover:text-white transition-colors"><Twitter size={20} /></a>
            <a href="#" className="hover:text-white transition-colors"><Youtube size={20} /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}
