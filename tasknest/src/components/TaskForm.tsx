import { useState, useEffect, useLayoutEffect, useRef, type FormEvent } from 'react';
import { Modal, Spinner, InlineError } from './UI';
import type { Task, TaskStatus } from '../types';
import { getErrorMessage } from '../services/api';

interface Props {
  task?: Task | null;
  onClose: () => void;
  onSubmit: (data: { title: string; description: string; status: TaskStatus }) => Promise<void>;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string; color: string }[] = [
  { value: 'pending',     label: 'Pending',     color: 'text-amber-600' },
  { value: 'in_progress', label: 'In Progress', color: 'text-blue-600'  },
  { value: 'completed',   label: 'Completed',   color: 'text-emerald-600' },
];

export default function TaskForm({ task, onClose, onSubmit }: Props) {
  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus]         = useState<TaskStatus>('pending');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setStatus(task.status);
    }
  }, [task]);

  useLayoutEffect(() => {
    titleRef.current?.focus();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) { setError('Title is required.'); return; }
    if (title.trim().length > 255) { setError('Title must be 255 characters or fewer.'); return; }
    if (description.length > 2000) { setError('Description must be 2000 characters or fewer.'); return; }

    setLoading(true);
    try {
      await onSubmit({ title: title.trim(), description: description.trim(), status });
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to save task. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title={task ? 'Edit Task' : 'Create New Task'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && <InlineError message={error} />}

        {/* Title */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="task-title" className="block text-sm font-medium text-gray-700">
              Title <span className="text-red-500">*</span>
            </label>
            <span className={`text-xs ${title.length > 240 ? 'text-red-500' : 'text-gray-400'}`}>
              {title.length}/255
            </span>
          </div>
          <input
            id="task-title"
            ref={titleRef}
            className={`input ${title.length > 255 ? 'input-error' : ''}`}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            maxLength={260}
            required
          />
        </div>

        {/* Description */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="task-desc" className="block text-sm font-medium text-gray-700">Description</label>
            <span className={`text-xs ${description.length > 1900 ? 'text-red-500' : 'text-gray-400'}`}>
              {description.length}/2000
            </span>
          </div>
          <textarea
            id="task-desc"
            className="input resize-none"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add more details (optional)…"
            maxLength={2010}
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <div className="grid grid-cols-3 gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStatus(opt.value)}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                  status === opt.value
                    ? `border-primary-500 bg-primary-50 ${opt.color} ring-1 ring-primary-400`
                    : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-1">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading && <Spinner size="sm" />}
            {task ? 'Save Changes' : 'Create Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
