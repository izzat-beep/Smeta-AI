import { useState, useEffect } from "react";
import { getPayments, addPayment, Payment } from "@/lib/payments";

const LOCATIONS = ["Ofis", "Qurilish maydoni", "Bank o'tkazma", "Boshqa"];
const METHODS = ["Naqd", "Karta", "O'tkazma"];

interface Props {
  saleId: string;
  unitName: string;
  currency: string;
  onClose: () => void;
  onUpdated: () => void; // ro'yxatni yangilash uchun
}

export default function PaymentModal({ saleId, unitName, currency, onClose, onUpdated }: Props) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState("");
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [method, setMethod] = useState(METHODS[0]);
  const [note, setNote] = useState("");
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await getPayments(saleId);
    setPayments(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [saleId]);

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) return;
    setSaving(true);
    try {
      await addPayment(saleId, {
        amount: Number(amount),
        currency,
        location,
        method,
        note,
        paidAt,
      });
      setAmount("");
      setNote("");
      await load();
      onUpdated();
    } finally {
      setSaving(false);
    }
  };

  const total = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl p-6 w-full max-w-lg text-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">{unitName} — To'lovlar tarixi</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>

        {/* Yangi to'lov qo'shish */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <input
            type="number"
            placeholder="Summa"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-gray-800 rounded px-3 py-2 col-span-2"
          />
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="bg-gray-800 rounded px-3 py-2"
          >
            {LOCATIONS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="bg-gray-800 rounded px-3 py-2"
          >
            {METHODS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <input
            type="date"
            value={paidAt}
            onChange={(e) => setPaidAt(e.target.value)}
            className="bg-gray-800 rounded px-3 py-2"
          />
          <input
            placeholder="Izoh (ixtiyoriy)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="bg-gray-800 rounded px-3 py-2"
          />
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="col-span-2 bg-orange-500 hover:bg-orange-600 rounded py-2 font-semibold disabled:opacity-50"
          >
            {saving ? "Saqlanmoqda..." : "+ To'lov qo'shish"}
          </button>
        </div>

        {/* Tarix jadvali */}
        <div className="max-h-64 overflow-y-auto border-t border-gray-700 pt-3">
          {loading ? (
            <p className="text-gray-400 text-sm">Yuklanmoqda...</p>
          ) : payments.length === 0 ? (
            <p className="text-gray-400 text-sm">Hali to'lov kiritilmagan</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-gray-400">
                <tr>
               <th className="text-left py-1">Sana</th>
                  <th className="text-left">Summa</th>
                  <th className="text-left">Qayerda</th>
                  <th className="text-left">Usul</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-t border-gray-800">
                    <td className="py-1">{new Date(p.paidAt).toLocaleDateString("uz-UZ")}</td>
                    <td className="text-green-400">{Number(p.amount).toLocaleString()} {p.currency}</td>
                    <td>{p.location || "—"}</td>
                    <td>{p.method || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-3 text-right font-semibold">
          Jami to'langan: <span className="text-green-400">{total.toLocaleString()} {currency}</span>
        </div>
      </div>
    </div>
  );
}