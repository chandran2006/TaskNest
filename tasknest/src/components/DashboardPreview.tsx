const columns = [
  {
    label: 'Todo',
    color: 'bg-gray-100 text-gray-600',
    dot: 'bg-gray-400',
    tasks: [
      { title: 'Redesign settings page', priority: 'Medium', user: 'AK', avatarIdx: 0 },
      { title: 'Add export to CSV', priority: 'Low', user: 'SR', avatarIdx: 1 },
    ],
  },
  {
    label: 'In Progress',
    color: 'bg-blue-100 text-blue-700',
    dot: 'bg-blue-500',
    tasks: [
      { title: 'Build RBAC middleware', priority: 'High', user: 'MJ', avatarIdx: 2 },
      { title: 'Integrate email notifications', priority: 'High', user: 'PL', avatarIdx: 3 },
      { title: 'Write unit tests', priority: 'Medium', user: 'AK', avatarIdx: 0 },
    ],
  },
  {
    label: 'Done',
    color: 'bg-green-100 text-green-700',
    dot: 'bg-green-500',
    tasks: [
      { title: 'Setup multi-tenant DB schema', priority: 'Critical', user: 'SR', avatarIdx: 1 },
      { title: 'JWT auth implementation', priority: 'High', user: 'MJ', avatarIdx: 2 },
    ],
  },
];

const priorityStyle: Record<string, string> = {
  Critical: 'bg-red-100 text-red-600',
  High: 'bg-orange-100 text-orange-600',
  Medium: 'bg-blue-100 text-blue-600',
  Low: 'bg-gray-100 text-gray-500',
};

const avatarColors = ['from-blue-500 to-indigo-500', 'from-violet-500 to-purple-500', 'from-green-500 to-teal-500', 'from-rose-500 to-pink-500'];

export default function DashboardPreview() {
  return (
    <section id="dashboard-preview" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-blue-600 font-semibold text-sm uppercase tracking-widest">Dashboard Preview</span>
          <h2 className="text-4xl font-extrabold text-gray-900 mt-3 mb-4">See TaskNest in action</h2>
          <p className="text-gray-500 max-w-xl mx-auto">A clean, intuitive board view that keeps your team aligned and focused.</p>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 shadow-2xl">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">T</div>
              <span className="text-white font-semibold text-sm">TaskNest</span>
              <span className="text-slate-400 text-sm">/ Engineering Sprint Q3</span>
            </div>
            <div className="flex items-center gap-2">
              {['AK', 'SR', 'MJ', 'PL'].map((u, i) => (
                <div key={u} className={`w-7 h-7 rounded-full bg-gradient-to-br ${avatarColors[i]} flex items-center justify-center text-white text-xs font-bold border-2 border-slate-800 -ml-1`}>
                  {u[0]}
                </div>
              ))}
              <button className="ml-2 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-blue-500 transition-colors">
                + Add Task
              </button>
            </div>
          </div>

          {/* Kanban columns */}
          <div className="grid md:grid-cols-3 gap-4">
            {columns.map((col) => (
              <div key={col.label} className="bg-slate-800/60 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.color}`}>{col.label}</span>
                  <span className="ml-auto text-slate-400 text-xs">{col.tasks.length}</span>
                </div>
                <div className="space-y-3">
                  {col.tasks.map((task) => (
                    <div key={task.title} className="bg-slate-700/80 hover:bg-slate-700 rounded-xl p-3.5 cursor-pointer transition-colors group">
                      <p className="text-white text-sm font-medium mb-3 group-hover:text-blue-300 transition-colors">{task.title}</p>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${priorityStyle[task.priority]}`}>
                          {task.priority}
                        </span>
                        <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${avatarColors[task.avatarIdx]} flex items-center justify-center text-white text-xs font-bold`}>
                          {task.user[0]}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
