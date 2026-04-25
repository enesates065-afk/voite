import { Download, CreditCard } from "lucide-react";

const mockPayments = [
  { id: "pi_3MtwBwL...", amount: "$120.00", net: "$116.22", fee: "$3.78", status: "Succeeded", date: "25 Eki 14:32", method: "Visa •••• 4242" },
  { id: "pi_3MtwA1L...", amount: "$230.00", net: "$222.83", fee: "$7.17", status: "Succeeded", date: "25 Eki 11:15", method: "Mastercard •••• 5555" },
  { id: "pi_3MtvZzL...", amount: "$65.00", net: "$62.81", fee: "$2.19", status: "Succeeded", date: "24 Eki 18:40", method: "Apple Pay" },
  { id: "re_1MtvXyL...", amount: "-$120.00", net: "-$120.00", fee: "$0.00", status: "Refunded", date: "24 Eki 15:20", method: "Visa •••• 4242" },
];

export default function AdminPayments() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black heading-style uppercase tracking-tight">Ödemeler</h1>
          <p className="text-white/50 text-sm mt-1">Stripe / iyzico işlem geçmişi.</p>
        </div>
        
        <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-sm font-bold uppercase tracking-widest rounded hover:bg-white hover:text-black transition-colors">
          <Download size={16} /> Rapor İndir
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded">
          <h3 className="text-white/50 text-xs uppercase tracking-widest font-bold mb-1">Bekleyen Bakiye</h3>
          <p className="text-3xl font-mono font-bold">$1,240.00</p>
        </div>
        <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded border-l-4 border-l-fener-gold">
          <h3 className="text-white/50 text-xs uppercase tracking-widest font-bold mb-1">Kullanılabilir Bakiye</h3>
          <p className="text-3xl font-mono font-bold text-fener-gold">$8,450.50</p>
        </div>
        <div className="bg-[#0a0a0a] border border-white/10 p-6 rounded flex items-center justify-center">
          <button className="w-full py-3 bg-white text-black font-bold uppercase tracking-widest text-sm hover:bg-fener-gold transition-colors rounded">
            Bankaya Aktar
          </button>
        </div>
      </div>

      <div className="bg-[#0a0a0a] border border-white/10 rounded overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h3 className="font-bold uppercase tracking-widest text-sm">Son İşlemler</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white/5 text-white/50 uppercase tracking-widest text-xs border-b border-white/10">
              <tr>
                <th className="px-6 py-4 font-bold">İşlem ID</th>
                <th className="px-6 py-4 font-bold">Miktar</th>
                <th className="px-6 py-4 font-bold">Net</th>
                <th className="px-6 py-4 font-bold">Kesinti</th>
                <th className="px-6 py-4 font-bold">Yöntem</th>
                <th className="px-6 py-4 font-bold">Durum</th>
                <th className="px-6 py-4 font-bold text-right">Tarih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {mockPayments.map((payment, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-mono text-white/50">{payment.id}</td>
                  <td className={`px-6 py-4 font-mono font-bold ${payment.amount.startsWith('-') ? 'text-red-500' : 'text-white'}`}>
                    {payment.amount}
                  </td>
                  <td className="px-6 py-4 font-mono text-fener-gold">{payment.net}</td>
                  <td className="px-6 py-4 font-mono text-white/50">{payment.fee}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-white/70">
                      <CreditCard size={14} /> {payment.method}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-[10px] uppercase tracking-widest font-bold rounded-sm ${
                      payment.status === 'Succeeded' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                    }`}>
                      {payment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-white/50">{payment.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
