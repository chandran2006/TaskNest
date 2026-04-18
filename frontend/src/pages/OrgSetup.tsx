import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { orgAPI, getErrorMessage } from '../services/api';
import { Spinner, InlineError } from '../components/UI';
import toast from 'react-hot-toast';

type Tab = 'join' | 'create';

export default function SelectOrg() {
  const { refreshUser } = useAuth();
  const navigate        = useNavigate();

  const [tab, setTab]       = useState<Tab>('join');
  const [orgId, setOrgId]   = useState('');
  const [orgName, setOrgName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const id = parseInt(orgId, 10);
    if (!id || id < 1) { setError('Enter a valid organization ID.'); return; }
    setLoading(true);
    try {
      const { data } = await orgAPI.select(id);
      // Store fresh token if backend issued one (org_id is now in the JWT)
      if (data.token) localStorage.setItem('token', data.token);
      await refreshUser();
      toast.success(`Joined "${data.organization.name}" 🎉`);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const name = orgName.trim();
    if (!name) { setError('Organization name is required.'); return; }
    setLoading(true);
    try {
      const { data } = await orgAPI.create(name);
      if (data.token) localStorage.setItem('token', data.token);
      await refreshUser();
      toast.success(`"${data.organization.name}" created & joined 🚀`);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary-950 to-indigo-950 flex items-center justify-center p-4">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-2xl">
            <img src="/logo.svg" alt="TaskNest" className="w-16 h-16 rounded-2xl object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-white">TaskNest</h1>
          <p className="text-slate-400 mt-1 text-sm">One last step — set up your workspace</p>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-gray-100">
            {(['join', 'create'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); }}
                className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                  tab === t
                    ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {t === 'join' ? '🏢 Join Organization' : '✨ Create Organization'}
              </button>
            ))}
          </div>

          <div className="p-8">
            {error && <div className="mb-5"><InlineError message={error} /></div>}

            {tab === 'join' ? (
              <form onSubmit={handleJoin} className="space-y-5">
                <div>
                  <label htmlFor="orgId" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Organization ID
                  </label>
                  <input
                    id="orgId"
                    type="number"
                    min="1"
                    required
                    placeholder="e.g. 1"
                    value={orgId}
                    onChange={(e) => setOrgId(e.target.value)}
                    className="input"
                    autoFocus
                  />
                  <p className="text-xs text-gray-400 mt-1.5">
                    Ask your admin for the organization ID.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-2.5 text-base"
                >
                  {loading ? <><Spinner size="sm" /> Joining…</> : 'Join Organization'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleCreate} className="space-y-5">
                <div>
                  <label htmlFor="orgName" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Organization Name
                  </label>
                  <input
                    id="orgName"
                    type="text"
                    required
                    maxLength={100}
                    placeholder="e.g. Acme Corp"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="input"
                    autoFocus
                  />
                  <p className="text-xs text-gray-400 mt-1.5">
                    You'll be the first member of this organization.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-2.5 text-base"
                >
                  {loading ? <><Spinner size="sm" /> Creating…</> : 'Create & Join'}
                </button>
              </form>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          You can always change your organization from your profile settings.
        </p>
      </div>
    </div>
  );
}
