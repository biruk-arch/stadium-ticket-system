import { useEffect, useState } from 'react';
import { UserPlus, X } from 'lucide-react';
import client, { apiErrorMessage } from '../../api/client';
import { ROLE_LABELS } from '../../context/AuthContext';

const STAFF_ROLES = ['box_office_staff', 'gate_scanner_officer', 'stadium_admin', 'sport_commission_officer'];

function NewStaffForm({ onCreated, onClose }) {
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', role: STAFF_ROLES[0] });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await client.post('/auth/staff', form);
      onCreated();
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not create this account.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 p-6">
      <div className="flex items-center justify-between">
        <p className="label-eyebrow">New staff account</p>
        <button type="button" onClick={onClose} className="text-chalk-dim hover:text-chalk"><X size={16} /></button>
      </div>
      {error && <p className="rounded-md border border-alert/30 bg-alert/10 px-3 py-2 text-sm text-alert">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label-eyebrow mb-1.5 block">Full name</label>
          <input required className="input-field" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        </div>
        <div>
          <label className="label-eyebrow mb-1.5 block">Role</label>
          <select className="input-field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            {STAFF_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
        </div>
        <div>
          <label className="label-eyebrow mb-1.5 block">Email</label>
          <input required type="email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <label className="label-eyebrow mb-1.5 block">Phone</label>
          <input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div className="sm:col-span-2">
          <label className="label-eyebrow mb-1.5 block">Temporary password</label>
          <input required type="text" minLength={6} className="input-field font-mono" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 6 characters" />
        </div>
      </div>
      <button type="submit" disabled={busy} className="btn-primary">{busy ? 'Creating…' : 'Create Account'}</button>
    </form>
  );
}

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await client.get('/users', { params: roleFilter ? { role: roleFilter } : {} });
    setUsers(data.users);
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [roleFilter]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="label-eyebrow">Access Control</p>
          <h1 className="mt-1 font-display text-4xl tracking-wide text-chalk">Staff Accounts</h1>
        </div>
        {!showNew && <button onClick={() => setShowNew(true)} className="btn-primary shrink-0"><UserPlus size={16} /> New Staff</button>}
      </div>

      {showNew && <div className="mt-6"><NewStaffForm onCreated={() => { setShowNew(false); load(); }} onClose={() => setShowNew(false)} /></div>}

      <div className="mt-6 max-w-xs">
        <label className="label-eyebrow mb-1.5 block">Filter by role</label>
        <select className="input-field" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All roles</option>
          {Object.entries(ROLE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>

      {loading && <p className="mt-8 text-chalk-dim">Loading accounts…</p>}

      <div className="mt-6 card divide-y divide-pitch-line">
        {!loading && users.length === 0 && <p className="p-5 text-sm text-chalk-dim">No accounts found.</p>}
        {users.map((u) => (
          <div key={u.user_id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 text-sm">
            <div>
              <p className="font-semibold text-chalk">{u.full_name}</p>
              <p className="text-chalk-dim">{u.email}{u.phone ? ` · ${u.phone}` : ''}</p>
            </div>
            <span className="pill pill-pending">{ROLE_LABELS[u.role]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
