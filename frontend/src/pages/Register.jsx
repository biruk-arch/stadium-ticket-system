import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trophy, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiErrorMessage } from '../api/client';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/events', { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not create your account.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-flood text-pitch-night">
            <Trophy size={24} strokeWidth={2.5} />
          </span>
          <h1 className="mt-4 font-display text-3xl tracking-wide text-chalk">Join the Fans</h1>
          <p className="mt-1 text-sm text-chalk-dim">Create a fan account to reserve match tickets.</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4 p-6">
          {error && <p className="rounded-md border border-alert/30 bg-alert/10 px-3 py-2 text-sm text-alert">{error}</p>}
          <div>
            <label className="label-eyebrow mb-1.5 block">Full name</label>
            <input required className="input-field" value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder="Abebe Bekele" />
          </div>
          <div>
            <label className="label-eyebrow mb-1.5 block">Email</label>
            <input type="email" required className="input-field" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
          </div>
          <div>
            <label className="label-eyebrow mb-1.5 block">Phone (optional)</label>
            <input className="input-field" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="09xx xxx xxx" />
          </div>
          <div>
            <label className="label-eyebrow mb-1.5 block">Password</label>
            <input type="password" required minLength={6} className="input-field" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 6 characters" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            <UserPlus size={16} /> {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-chalk-dim">
          Already have an account? <Link to="/login" className="font-semibold text-flood hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
