import { useState, useEffect, useMemo } from 'react';
import { auditAPI, getErrorMessage } from '../services/api';
import { EmptyState, SkeletonRow, Avatar, PageHeader } from '../components/UI';
import type { AuditLog, AuditAction } from '../types';
import toast from 'react-hot-toast';

const ACTION_CONFIG: Record<AuditAction, { cls: string; icon: string }> = {
  CREATE: { cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', icon: '✚' },
  UPDATE: { cls: 'bg-blue-50   text-blue-700   ring-1 ring-blue-200',    icon: '✎' },
  DELETE: { cls: 'bg-red-50    text-red-700    ring-1 ring-red-200',     icon: '✕' },
};

const PAGE_SIZE = 15;

export default function AuditLogs() {
  const [logs, setLogs]           = useState<AuditLog[]>([]);
  const [loading, setLoading]     = useState(true);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [search, setSearch]       = useState('');
  const [page, setPage]           = useState(1);

  useEffect(() => {
    auditAPI.getAll()
      .then((res) => setLogs(res.data.logs))
      .catch((err) => toast.error(getErrorMessage(err, 'Failed to load audit logs.')))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return logs.filter((l) => {
      const matchAction = actionFilter === 'all' || l.action === actionFilter;
      const matchSearch = !q
        || l.task_title?.toLowerCase().includes(q)
        || l.user_name?.toLowerCase().includes(q)
        || l.user_email?.toLowerCase().includes(q);
      return matchAction && matchSearch;
    });
  }, [logs, actionFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = useMemo(() => logs.reduce(
    (acc, l) => { acc[l.action]++; acc.all++; return acc; },
    { all: 0, CREATE: 0, UPDATE: 0, DELETE: 0 } as Record<AuditAction | 'all', number>
  ), [logs]);

  return (
    <div className="space-y-4 max-w-7xl">
      <PageHeader
        title="Audit Logs"
        subtitle="Complete history of all task actions in your organization"
      />

      {/* Action Filter Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit flex-wrap">
        {(['all', 'CREATE', 'UPDATE', 'DELETE'] as const).map((a) => (
          <button
            key={a}
            onClick={() => { setActionFilter(a); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              actionFilter === a ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {a === 'all' ? 'All Actions' : a}
            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
              actionFilter === a ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-500'
            }`}>
              {counts[a]}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
        </svg>
        <input
          className="input pl-9 max-w-sm"
          placeholder="Search by task or user…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="Audit logs table">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="table-header-cell">Action</th>
                <th className="table-header-cell">Task</th>
                <th className="table-header-cell hidden md:table-cell">Performed By</th>
                <th className="table-header-cell">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(6)].map((_, i) => <SkeletonRow key={i} cols={4} />)
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <EmptyState message={search || actionFilter !== 'all' ? 'No logs match your filters.' : 'No audit logs yet.'} />
                  </td>
                </tr>
              ) : (
                paginated.map((log) => {
                  const cfg = ACTION_CONFIG[log.action] ?? { cls: 'bg-gray-100 text-gray-700', icon: '?' };
                  return (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="table-cell">
                        <span className={`badge ${cfg.cls} font-mono`}>
                          <span className="text-xs">{cfg.icon}</span>
                          {log.action}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className="font-medium text-gray-800">{log.task_title ?? '(deleted)'}</span>
                        <span className="text-gray-400 text-xs ml-2 font-mono">#{log.task_id}</span>
                      </td>
                      <td className="table-cell hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <Avatar name={log.user_name ?? 'U'} size="sm" />
                          <div>
                            <p className="text-gray-700 font-medium text-xs">{log.user_name}</p>
                            <p className="text-gray-400 text-xs">{log.user_email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell text-gray-500 text-xs whitespace-nowrap">
                        <div>{new Date(log.timestamp).toLocaleDateString()}</div>
                        <div className="text-gray-400">{new Date(log.timestamp).toLocaleTimeString()}</div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
            <span className="text-xs text-gray-500">
              {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} logs
            </span>
            <div className="flex items-center gap-1">
              <button className="btn-secondary text-xs py-1 px-2.5 disabled:opacity-40" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>‹ Prev</button>
              <span className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg">{page} / {totalPages}</span>
              <button className="btn-secondary text-xs py-1 px-2.5 disabled:opacity-40" onClick={() => setPage((p) => p + 1)} disabled={page === totalPages}>Next ›</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
