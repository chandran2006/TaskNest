import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { tasksAPI, getErrorMessage } from '../services/api';
import api from '../services/api';
import { RoleBadge, StatusBadge, Avatar } from '../components/UI';
import type { Task, TaskStatus } from '../types';
import toast from 'react-hot-toast';

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label, value, total, color, bg, icon,
}: { label: string; value: number; total: number; color: string; bg: string; icon: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center text-xl`}>{icon}</div>
        <span className="text-xs font-medium text-gray-400">{pct}%</span>
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── Skeleton Stats ───────────────────────────────────────────────────────────
function SkeletonStats() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="card space-y-3">
          <div className="skeleton h-10 w-10 rounded-xl" />
          <div className="skeleton h-7 w-16 rounded" />
          <div className="skeleton h-4 w-24 rounded" />
          <div className="skeleton h-1.5 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}

const STATUS_ORDER: TaskStatus[] = ['pending', 'in_progress', 'completed'];

const STATUS_COLORS: Record<TaskStatus, string> = {
  pending:     'bg-amber-400',
  in_progress: 'bg-blue-500',
  completed:   'bg-emerald-500',
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: 'Pending', in_progress: 'In Progress', completed: 'Completed',
};

export default function Dashboard() {
  const { user, isAdmin }     = useAuth();
  const [tasks, setTasks]     = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [memberCount, setMemberCount] = useState<number | null>(null);

  useEffect(() => {
    if (!user?.organization_id) { setLoading(false); return; }
    tasksAPI.getAll()
      .then((res) => setTasks(res.data.tasks))
      .catch((err) => toast.error(getErrorMessage(err, 'Failed to load task stats.')))
      .finally(() => setLoading(false));
  }, [user?.organization_id]);

  useEffect(() => {
    if (!isAdmin) return;
    api.get<{ count: number }>('/auth/members/count')
      .then((res) => setMemberCount(res.data.count))
      .catch(() => setMemberCount(null));
  }, [isAdmin]);

  const total = tasks.length;
  const { myCount, completed, inProgress, pending } = tasks.reduce(
    (acc, t) => {
      if (t.created_by === user?.id) acc.myCount++;
      if (t.status === 'completed')  acc.completed++;
      if (t.status === 'in_progress') acc.inProgress++;
      if (t.status === 'pending')    acc.pending++;
      return acc;
    },
    { myCount: 0, completed: 0, inProgress: 0, pending: 0 }
  );
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* No-org banner for Google OAuth users */}
      {!user?.organization_id && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-semibold text-amber-800">You're not assigned to an organization yet.</p>
            <p className="text-sm text-amber-700 mt-1">
              You signed in with Google. Ask an admin to assign you to an organization before you can create or view tasks.
            </p>
          </div>
        </div>
      )}
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary-600 via-primary-700 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-4 -right-4 w-40 h-40 bg-white rounded-full" />
          <div className="absolute -bottom-8 -left-8 w-56 h-56 bg-white rounded-full" />
        </div>
        <div className="relative flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-primary-200 text-sm font-medium mb-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <h1 className="text-2xl font-bold">Welcome back, {user?.name?.split(' ')[0]}! {isAdmin ? '👑' : '👋'}</h1>
            <p className="text-primary-100 mt-1 text-sm">
              {isAdmin
                ? `Managing ${total} task${total !== 1 ? 's' : ''} across your organization.`
                : total === 0
                  ? "You're all caught up. Create your first task!"
                  : `You have ${pending} pending task${pending !== 1 ? 's' : ''} to work on.`
              }
            </p>
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <RoleBadge role={user?.role ?? 'member'} />
              <span className="text-primary-200 text-xs">
                {user?.organization_id
                  ? <>Organization <span className="font-semibold text-white">#{user.organization_id}</span></>
                  : <span className="italic">No organization</span>
                }
              </span>
            </div>
          </div>
          {/* Completion ring */}
          <div className="flex flex-col items-center gap-1">
            <div className="relative w-16 h-16">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="6" />
                <circle cx="32" cy="32" r="26" fill="none" stroke="white" strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 26}`}
                  strokeDashoffset={`${2 * Math.PI * 26 * (1 - completionRate / 100)}`}
                  strokeLinecap="round" className="transition-all duration-1000" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">{completionRate}%</span>
            </div>
            <span className="text-xs text-primary-200">Done</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      {loading ? <SkeletonStats /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Tasks"  value={total}      total={total} color="bg-primary-500" bg="bg-primary-50" icon="📋" />
          <StatCard label="Completed"    value={completed}  total={total} color="bg-emerald-500" bg="bg-emerald-50" icon="✅" />
          <StatCard label="In Progress"  value={inProgress} total={total} color="bg-blue-500"    bg="bg-blue-50"    icon="⏳" />
          {isAdmin
            ? <StatCard label="Org Members" value={memberCount ?? 0} total={memberCount ?? 1} color="bg-violet-500" bg="bg-violet-50" icon="👥" />
            : <StatCard label="Pending"     value={pending}          total={total}            color="bg-amber-500"  bg="bg-amber-50"  icon="🔴" />
          }
        </div>
      )}

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Account Info */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-5 h-5 bg-primary-100 rounded flex items-center justify-center text-xs">👤</span>
            Account
          </h3>
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
            <Avatar name={user?.name ?? '?'} size="md" />
            <div>
              <p className="font-semibold text-gray-900 text-sm">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between items-center">
              <dt className="text-gray-500">Role</dt>
              <dd><RoleBadge role={user?.role ?? 'member'} /></dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">Organization</dt>
              <dd className="font-medium text-gray-900">
                {user?.organization_id ? `#${user.organization_id}` : <span className="text-gray-400 italic text-xs">Not assigned</span>}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">My Tasks</dt>
              <dd className="font-medium text-gray-900">{myCount}</dd>
            </div>
          </dl>
        </div>

        {/* Permissions */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-5 h-5 bg-primary-100 rounded flex items-center justify-center text-xs">🔐</span>
            Permissions
          </h3>
          <ul className="space-y-2.5 text-sm">
            {[
              { label: 'View all org tasks',    allowed: true },
              { label: 'Create tasks',           allowed: true },
              { label: 'Edit own tasks',         allowed: true },
              { label: 'Delete own tasks',       allowed: true },
              { label: 'Edit any member task',   allowed: isAdmin },
              { label: 'Delete any member task', allowed: isAdmin },
              { label: 'View audit logs',        allowed: isAdmin },
            ].map((p) => (
              <li key={p.label} className="flex items-center gap-2.5">
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                  p.allowed ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {p.allowed ? '✓' : '✗'}
                </span>
                <span className={p.allowed ? 'text-gray-700' : 'text-gray-400'}>{p.label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Status Breakdown */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="w-5 h-5 bg-primary-100 rounded flex items-center justify-center text-xs">📊</span>
            Status Breakdown
          </h3>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-8 rounded-lg" />)}
            </div>
          ) : total === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No tasks yet.</p>
          ) : (
            <div className="space-y-3">
              {STATUS_ORDER.map((s) => {
                const count = tasks.filter((t) => t.status === s).length;
                const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={s}>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>{STATUS_LABELS[s]}</span>
                      <span className="font-medium">{count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${STATUS_COLORS[s]} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Recent Tasks</h3>
          <Link to="/tasks" className="text-sm text-primary-600 hover:text-primary-700 font-medium hover:underline">
            View all →
          </Link>
        </div>
        {loading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
                <div className="skeleton w-7 h-7 rounded-full" />
                <div className="skeleton h-4 flex-1 rounded" />
                <div className="skeleton h-5 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No tasks yet in your organization.</p>
        ) : (
          <div className="space-y-1.5">
            {tasks.slice(0, 6).map((task) => (
              <div key={task.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                task.created_by === user?.id ? 'bg-primary-50/60' : 'hover:bg-gray-50'
              }`}>
                <Avatar name={task.creator_name ?? 'U'} size="sm" />
                <span className="flex-1 font-medium text-gray-800 truncate">{task.title}</span>
                {task.created_by === user?.id && (
                  <span className="text-xs text-primary-500 font-medium hidden sm:block">you</span>
                )}
                <StatusBadge status={task.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
