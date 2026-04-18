import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { tasksAPI, getErrorMessage } from '../services/api';
import { StatusBadge, ConfirmDialog, EmptyState, SkeletonRow, Avatar, PageHeader } from '../components/UI';
import TaskForm from '../components/TaskForm';
import type { Task, TaskStatus } from '../types';
import toast from 'react-hot-toast';

const PAGE_SIZE = 10;

type SortKey   = 'title' | 'status' | 'createdAt';
type SortOrder = 'asc' | 'desc';

function SortIcon({ col, sortKey, sortOrder }: { col: SortKey; sortKey: SortKey; sortOrder: SortOrder }) {
  if (sortKey !== col) return <span className="text-gray-300 ml-1">↕</span>;
  return <span className="text-primary-500 ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>;
}

export default function Tasks() {
  const { user, isAdmin }   = useAuth();
  const [tasks, setTasks]   = useState<Task[]>([]);
  const [loading, setLoading]             = useState(true);
  const [search, setSearch]               = useState('');
  const [statusFilter, setStatusFilter]   = useState<TaskStatus | 'all'>('all');
  const [page, setPage]                   = useState(1);
  const [sortKey, setSortKey]             = useState<SortKey>('createdAt');
  const [sortOrder, setSortOrder]         = useState<SortOrder>('desc');
  const [showForm, setShowForm]           = useState(false);
  const [editTask, setEditTask]           = useState<Task | null>(null);
  const [deleteTask, setDeleteTask]       = useState<Task | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchTasks = useCallback(async () => {
    if (!user?.organization_id) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await tasksAPI.getAll();
      setTasks(res.data.tasks);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load tasks.'));
    } finally {
      setLoading(false);
    }
  }, [user?.organization_id]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // Keyboard shortcut: N = new task
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'n' && !e.ctrlKey && !e.metaKey && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        setShowForm(true);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const canModify = (task: Task) => isAdmin || task.created_by === user?.id;

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortOrder((o) => o === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortOrder('asc'); }
    setPage(1);
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return tasks
      .filter((t) => {
        const matchSearch = t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
        const matchStatus = statusFilter === 'all' || t.status === statusFilter;
        return matchSearch && matchStatus;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortKey === 'title')     cmp = a.title.localeCompare(b.title);
        if (sortKey === 'status')    cmp = a.status.localeCompare(b.status);
        if (sortKey === 'createdAt') cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        return sortOrder === 'asc' ? cmp : -cmp;
      });
  }, [tasks, search, statusFilter, sortKey, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleCreate = async (data: { title: string; description: string; status: TaskStatus }) => {
    await tasksAPI.create(data);
    toast.success('Task created!');
    setPage(1);
    await fetchTasks();
  };

  const handleEdit = async (data: { title: string; description: string; status: TaskStatus }) => {
    if (!editTask) return;
    await tasksAPI.update(editTask.id, data);
    toast.success('Task updated!');
    await fetchTasks();
  };

  const handleDelete = async () => {
    if (!deleteTask) return;
    setDeleteLoading(true);
    // Optimistic removal
    setTasks((prev) => prev.filter((t) => t.id !== deleteTask.id));
    try {
      await tasksAPI.delete(deleteTask.id);
      toast.success('Task deleted.');
      setDeleteTask(null);
    } catch (err) {
      // Rollback
      fetchTasks();
      toast.error(getErrorMessage(err, 'Failed to delete task.'));
    } finally {
      setDeleteLoading(false);
    }
  };

  const statusCounts = useMemo(() => tasks.reduce(
    (acc, t) => { acc[t.status]++; acc.all++; return acc; },
    { all: 0, pending: 0, in_progress: 0, completed: 0 } as Record<TaskStatus | 'all', number>
  ), [tasks]);

  return (
    <div className="space-y-4 max-w-7xl">
      {!user?.organization_id && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
          <span className="text-2xl">⚠️</span>
          <div className="flex-1">
            <p className="font-semibold text-amber-800">No organization assigned.</p>
            <p className="text-sm text-amber-700 mt-1">Join or create an organization to start managing tasks.</p>
          </div>
          <a href="/select-org" className="shrink-0 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors">
            Set up →
          </a>
        </div>
      )}
      <PageHeader
        title="Tasks"
        subtitle={`${filtered.length} of ${tasks.length} task${tasks.length !== 1 ? 's' : ''}`}
        action={
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Task
            <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-primary-700 text-primary-200 ml-1">N</kbd>
          </button>
        }
      />

      {/* Status Filter Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit flex-wrap">
        {(['all', 'pending', 'in_progress', 'completed'] as const).map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === s
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {s === 'all' ? 'All' : s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
              statusFilter === s ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-500'
            }`}>
              {statusCounts[s]}
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
          placeholder="Search tasks…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        {search && (
          <button
            onClick={() => { setSearch(''); setPage(1); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="Tasks table">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="table-header-cell cursor-pointer hover:text-gray-700 select-none" onClick={() => handleSort('title')}>
                  Title <SortIcon col="title" sortKey={sortKey} sortOrder={sortOrder} />
                </th>
                <th className="table-header-cell hidden md:table-cell">Description</th>
                <th className="table-header-cell cursor-pointer hover:text-gray-700 select-none" onClick={() => handleSort('status')}>
                  Status <SortIcon col="status" sortKey={sortKey} sortOrder={sortOrder} />
                </th>
                <th className="table-header-cell hidden lg:table-cell">Created By</th>
                <th className="table-header-cell cursor-pointer hover:text-gray-700 select-none hidden xl:table-cell" onClick={() => handleSort('createdAt')}>
                  Date <SortIcon col="createdAt" sortKey={sortKey} sortOrder={sortOrder} />
                </th>
                <th className="table-header-cell text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [...Array(5)].map((_, i) => <SkeletonRow key={i} cols={6} />)
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      message={search || statusFilter !== 'all' ? 'No tasks match your filters.' : 'No tasks yet.'}
                      action={
                        !search && statusFilter === 'all'
                          ? <button className="btn-primary text-sm" onClick={() => setShowForm(true)}>Create your first task</button>
                          : undefined
                      }
                    />
                  </td>
                </tr>
              ) : (
                paginated.map((task) => (
                  <tr
                    key={task.id}
                    className={`group transition-colors ${
                      task.created_by === user?.id ? 'bg-primary-50/30 hover:bg-primary-50/60' : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="table-cell font-medium text-gray-900 max-w-[200px]">
                      <span className="truncate block">{task.title}</span>
                    </td>
                    <td className="table-cell text-gray-500 hidden md:table-cell max-w-[260px]">
                      <span className="truncate block">
                        {task.description || <span className="italic text-gray-300">—</span>}
                      </span>
                    </td>
                    <td className="table-cell"><StatusBadge status={task.status} /></td>
                    <td className="table-cell hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <Avatar name={task.creator_name ?? 'U'} size="sm" />
                        <span className="text-gray-600 text-xs">
                          {task.creator_name ?? task.created_by}
                          {task.created_by === user?.id && (
                            <span className="ml-1 text-primary-500 font-medium">(you)</span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="table-cell text-gray-400 text-xs hidden xl:table-cell whitespace-nowrap">
                      {new Date(task.createdAt).toLocaleDateString()}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center justify-end gap-1.5">
                        {canModify(task) ? (
                          <>
                            <button
                              onClick={() => setEditTask(task)}
                              aria-label={`Edit ${task.title}`}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => setDeleteTask(task)}
                              aria-label={`Delete ${task.title}`}
                              className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-gray-300 italic pr-2">View only</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
            <span className="text-xs text-gray-500">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                className="btn-secondary text-xs py-1 px-2.5 disabled:opacity-40"
                onClick={() => setPage(1)}
                disabled={page === 1}
              >«</button>
              <button
                className="btn-secondary text-xs py-1 px-2.5 disabled:opacity-40"
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
              >‹ Prev</button>
              <span className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg">
                {page} / {totalPages}
              </span>
              <button
                className="btn-secondary text-xs py-1 px-2.5 disabled:opacity-40"
                onClick={() => setPage((p) => p + 1)}
                disabled={page === totalPages}
              >Next ›</button>
              <button
                className="btn-secondary text-xs py-1 px-2.5 disabled:opacity-40"
                onClick={() => setPage(totalPages)}
                disabled={page === totalPages}
              >»</button>
            </div>
          </div>
        )}
      </div>

      {showForm   && <TaskForm onClose={() => setShowForm(false)} onSubmit={handleCreate} />}
      {editTask   && <TaskForm task={editTask} onClose={() => setEditTask(null)} onSubmit={handleEdit} />}
      {deleteTask && (
        <ConfirmDialog
          message={`Delete "${deleteTask.title}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTask(null)}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}
