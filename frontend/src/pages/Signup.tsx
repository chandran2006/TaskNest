import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI, getErrorMessage, GOOGLE_AUTH_URL } from '../services/api';
import { Spinner, InlineError } from '../components/UI';
import toast from 'react-hot-toast';

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ characters', ok: password.length >= 8 },
    { label: 'Uppercase',     ok: /[A-Z]/.test(password) },
    { label: 'Number',        ok: /[0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const colors = ['bg-gray-200', 'bg-red-400', 'bg-amber-400', 'bg-emerald-500'];
  const labels = ['', 'Weak', 'Fair', 'Strong'];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i < score ? colors[score] : 'bg-gray-200'}`} />
        ))}
        <span className={`text-xs font-medium ml-1 ${score === 3 ? 'text-emerald-600' : score === 2 ? 'text-amber-600' : 'text-red-500'}`}>
          {labels[score]}
        </span>
      </div>
      <div className="flex gap-3">
        {checks.map((c) => (
          <span key={c.label} className={`text-xs flex items-center gap-1 ${c.ok ? 'text-emerald-600' : 'text-gray-400'}`}>
            <span>{c.ok ? '✓' : '○'}</span>{c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Signup() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member', adminKey: '', organization_id: '' });
  const [showPwd, setShowPwd]     = useState(false);
  const [showAdminKey, setShowAdminKey] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const set = (field: string) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 8)       { setError('Password must be at least 8 characters.'); return; }
    if (!/[A-Z]/.test(form.password))   { setError('Password must contain at least one uppercase letter.'); return; }
    if (!/[0-9]/.test(form.password))   { setError('Password must contain at least one number.'); return; }
    if (form.role === 'admin' && !form.adminKey.trim()) {
      setError('Admin key is required to register as admin.'); return;
    }

    setLoading(true);
    try {
      const payload = { ...form, email: form.email.trim() };
      if (form.role !== 'admin') delete (payload as Record<string, string>).adminKey;
      const res = await authAPI.signup(payload);
      await login(res.data.token, res.data.user);
      toast.success('Account created! Welcome to TaskNest 🎉');
      navigate('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err, 'Signup failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary-950 to-indigo-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-2xl">
            <img src="/logo.svg" alt="TaskNest" className="w-16 h-16 rounded-2xl object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-white">TaskNest</h1>
          <p className="text-slate-400 mt-1 text-sm">Create your workspace account</p>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20">
          {error && <div className="mb-4"><InlineError message={error} /></div>}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <input id="name" className="input" value={form.name} onChange={set('name')}
                placeholder="John Doe" autoComplete="name" required />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input id="email" type="email" className="input" value={form.email} onChange={set('email')}
                placeholder="you@company.com" autoComplete="email" required />
            </div>

            <div>
              <label htmlFor="pwd" className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input id="pwd" type={showPwd ? 'text' : 'password'} className="input pr-10"
                  value={form.password} onChange={set('password')}
                  placeholder="Min. 8 chars, 1 uppercase, 1 number"
                  autoComplete="new-password" required />
                <button type="button" onClick={() => setShowPwd((v) => !v)}
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d={showPwd
                        ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        : "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      } />
                  </svg>
                </button>
              </div>
              <PasswordStrength password={form.password} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                <select id="role" className="input" value={form.role} onChange={set('role')}>
                  <option value="member">👤 Member</option>
                  <option value="admin">👑 Admin</option>
                </select>
              </div>
              <div>
                <label htmlFor="org" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Org ID <span className="text-xs text-gray-400">(use 1)</span>
                </label>
                <input id="org" className="input" value={form.organization_id} onChange={set('organization_id')}
                  placeholder="1" required />
              </div>
            </div>

            {form.role === 'admin' && (
              <div>
                <label htmlFor="adminKey" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Admin Key <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="adminKey"
                    type={showAdminKey ? 'text' : 'password'}
                    className="input pr-10"
                    value={form.adminKey}
                    onChange={set('adminKey')}
                    placeholder="Enter admin secret key"
                    autoComplete="off"
                  />
                  <button type="button" onClick={() => setShowAdminKey((v) => !v)}
                    aria-label={showAdminKey ? 'Hide key' : 'Show key'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d={showAdminKey
                          ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          : "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        } />
                    </svg>
                  </button>
                </div>
                <p className="text-xs text-amber-600 mt-1">⚠️ Only share this key with trusted admins.</p>
              </div>
            )}

            <button type="submit" className="btn-primary w-full py-2.5 text-base mt-2" disabled={loading}>
              {loading && <Spinner size="sm" />}
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold hover:underline">Sign in</Link>
          </p>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400">or</span></div>
          </div>

          <button
            type="button"
            onClick={() => { window.location.href = GOOGLE_AUTH_URL; }}
            className="flex items-center justify-center gap-3 w-full py-2.5 px-4 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84z" />
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}
