import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'react-i18next';
import type { User, Tenant, UserRole } from '@smeta/shared';
import { api, ApiError } from '../lib/api';
import { fmtDate } from '../lib/format';
import { Spinner } from './Stats';

type Row = User & { tenantName: string };
const ROLES: UserRole[] = ['OWNER', 'MANAGER', 'ENGINEER'];
const ROLE_LABEL: Record<UserRole, string> = { OWNER: 'Rahbar', MANAGER: 'Menejer', ENGINEER: 'Muhandis' };

export function Users() {
  const { t: tr } = useTranslation();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  async function load() {
    const [u, t] = await Promise.all([api.get<Row[]>('/users'), api.get<Tenant[]>('/tenants')]);
    setRows(u);
    setTenants(t);
  }
  useEffect(() => { load(); }, []);

  async function changeRole(id: string, role: UserRole) {
    setRows((r) => r!.map((x) => (x.id === id ? { ...x, role } : x)));
    await api.patch(`/users/${id}`, { role });
  }

  async function remove(id: string, name: string) {
    if (!confirm(`${name} — ${tr('common.delete')}?`)) return;
    await api.delete(`/users/${id}`);
    setRows((r) => r!.filter((x) => x.id !== id));
  }

  if (!rows) return <Spinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white font-display tracking-tight">{tr('users.title')}</h1>
          <p className="text-[#BCC0C7] mt-1">{tr('users.subtitle')}</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-5 py-2.5 bg-[#5555E7] hover:bg-[#4444d6] text-white rounded-xl font-bold text-sm">
          <Icon icon="lucide:user-plus" className="w-5 h-5" /> {tr('common.add')}
        </button>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#16181D]/30 border-b border-[#343841]/40">
                {[tr('users.name'), tr('users.email'), tr('users.tenant'), tr('users.role'), tr('users.created'), ''].map((h) => (
                  <th key={h} className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-[#BCC0C7]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#343841]/30">
              {rows.map((u) => (
                <tr key={u.id} className="hover:bg-white/5">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#5555E7]/15 flex items-center justify-center text-[#5555E7] font-bold">{u.fullName.charAt(0)}</div>
                      <span className="text-sm font-medium text-white">{u.fullName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-[#BCC0C7]">{u.email}</td>
                  <td className="px-5 py-4 text-sm text-white">{u.tenantName}</td>
                  <td className="px-5 py-4">
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u.id, e.target.value as UserRole)}
                      className="bg-[#16181D] border border-[#343841]/60 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-[#5555E7]/60"
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-4 text-sm text-[#BCC0C7]">{fmtDate(u.createdAt)}</td>
                  <td className="px-5 py-4 text-right">
                    <button onClick={() => remove(u.id, u.fullName)} aria-label="O'chirish" className="w-10 h-10 inline-flex items-center justify-center rounded-lg text-[#E11919] hover:bg-[#E11919]/10" title="O'chirish">
                      <Icon icon="lucide:trash-2" className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && <AddUserModal tenants={tenants} onClose={() => setShowAdd(false)} onDone={() => { setShowAdd(false); load(); }} />}
    </div>
  );
}

function AddUserModal({ tenants, onClose, onDone }: { tenants: Tenant[]; onClose: () => void; onDone: () => void }) {
  const [tenantId, setTenantId] = useState(tenants[0]?.id ?? '');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('ENGINEER');
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setSaving(true);
    try {
      await api.post('/users', { tenantId, fullName, email, password, role });
      onDone();
    } catch (e2) {
      setErr(e2 instanceof ApiError ? e2.message : 'Xatolik');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#16181D]/70 backdrop-blur-sm" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-full max-w-md bg-[#191B1F] border border-[#343841]/60 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white font-display">Yangi foydalanuvchi</h3>
          <button type="button" onClick={onClose} aria-label="Yopish" className="w-11 h-11 -mr-2 inline-flex items-center justify-center rounded-lg text-[#BCC0C7] hover:text-white hover:bg-white/5"><Icon icon="lucide:x" className="w-5 h-5" /></button>
        </div>
        {err && <div className="px-4 py-2.5 bg-[#E11919]/10 border border-[#E11919]/30 rounded-lg text-[#ff6b6b] text-sm">{err}</div>}

        <Field label="Kompaniya (mijoz)">
          <select value={tenantId} onChange={(e) => setTenantId(e.target.value)} required className="w-full bg-[#16181D] border border-[#343841]/50 rounded-xl px-4 py-2.5 text-sm text-white outline-none">
            {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </Field>
        <Field label="To'liq ism"><input value={fullName} onChange={(e) => setFullName(e.target.value)} required className="inp" /></Field>
        <Field label="Email"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="inp" /></Field>
        <Field label="Parol (min 6)"><input type="text" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="inp" /></Field>
        <Field label="Rol">
          <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className="w-full bg-[#16181D] border border-[#343841]/50 rounded-xl px-4 py-2.5 text-sm text-white outline-none">
            {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </select>
        </Field>

        <button disabled={saving} className="w-full py-3 bg-[#5555E7] hover:bg-[#4444d6] text-white font-bold rounded-xl disabled:opacity-60">
          {saving ? 'Saqlanmoqda...' : "Qo'shish"}
        </button>
      </form>
      <style>{`.inp{width:100%;background:#16181D;border:1px solid rgba(52,56,65,.5);border-radius:.75rem;padding:.625rem 1rem;font-size:.875rem;color:#fff;outline:none}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[12px] font-medium text-[#BCC0C7]">{label}</label>
      {children}
    </div>
  );
}
