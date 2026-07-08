import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Trophy, LogIn } from 'lucide-react';
import { useAuth, ROLE_HOME } from '../context/AuthContext';
import { apiErrorMessage } from '../api/client';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      const dest = location.state?.from?.pathname || ROLE_HOME[user.role] || '/';
      navigate(dest, { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, 'Invalid email or password.'));
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
          <h1 className="mt-4 font-display text-3xl tracking-wide text-chalk">Match Day Access</h1>
          <p className="mt-1 text-sm text-chalk-dim">Sign in to Dire Dawa Stadium's ticketing system.</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4 p-6">
          {error && <p className="rounded-md border border-alert/30 bg-alert/10 px-3 py-2 text-sm text-alert">{error}</p>}
          <div>
            <label className="label-eyebrow mb-1.5 block">Email</label>
            <input
              type="email"
              required
              className="input-field"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="label-eyebrow mb-1.5 block">Password</label>
            <input
              type="password"
              required
              className="input-field"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            <LogIn size={16} /> {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-chalk-dim">
          New here? <Link to="/register" className="font-semibold text-flood hover:underline">Create a fan account</Link>
        </p>

        <div className="mt-6 rounded-lg border border-pitch-line bg-pitch-ink/50 p-4 text-xs text-chalk-dim">
          <p className="label-eyebrow mb-2">Demo logins (password: Password123!)</p>
          <ul className="space-y-0.5 font-mono">
            <li>fan@example.com</li>
            <li>boxoffice@example.com</li>
            <li>gate@example.com</li>
            <li>admin@example.com</li>
            <li>commission@example.com</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
