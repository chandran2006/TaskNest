import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section className="min-h-screen pt-24 pb-16 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
        {/* Left */}
        <div>
          <span className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
            Multi-Tenant · RBAC · Secure
          </span>
          <h1 className="text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            Organize Tasks the{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Smart Way
            </span>{' '}
            with TaskNest
          </h1>
          <p className="text-lg text-gray-500 mb-10 leading-relaxed max-w-lg">
            A secure, multi-tenant task management platform with role-based access control for modern teams.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to="/signup"
              className="px-7 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-200 hover:opacity-90 hover:-translate-y-0.5 transition-all"
            >
              Get Started — Free
            </Link>
            <a
              href="#dashboard-preview"
              className="px-7 py-3.5 bg-white text-gray-700 font-semibold rounded-xl border border-gray-200 shadow-sm hover:border-blue-300 hover:-translate-y-0.5 transition-all"
            >
              View Demo →
            </a>
          </div>
          <div className="mt-10 flex items-center gap-6 text-sm text-gray-400">
            <span>✓ No credit card required</span>
            <span>✓ Free forever plan</span>
            <span>✓ GDPR compliant</span>
          </div>
        </div>

        {/* Right — Dashboard Mockup */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-3xl blur-3xl opacity-20 scale-95" />
          <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            {/* Window bar */}
            <div className="bg-gray-50 border-b border-gray-100 px-4 py-3 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-400" />
              <span className="w-3 h-3 rounded-full bg-yellow-400" />
              <span className="w-3 h-3 rounded-full bg-green-400" />
              <span className="ml-4 text-xs text-gray-400 font-mono">tasknest.app/dashboard</span>
            </div>
            <div className="p-5">
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: 'Total Tasks', value: '128', color: 'bg-blue-50 text-blue-700' },
                  { label: 'In Progress', value: '34', color: 'bg-yellow-50 text-yellow-700' },
                  { label: 'Completed', value: '89', color: 'bg-green-50 text-green-700' },
                ].map((s) => (
                  <div key={s.label} className={`${s.color} rounded-xl p-3 text-center`}>
                    <div className="text-2xl font-bold">{s.value}</div>
                    <div className="text-xs font-medium mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
              {/* Task list */}
              <div className="space-y-2.5">
                {[
                  { title: 'Design new onboarding flow', status: 'In Progress', priority: 'High', assignee: 'AK' },
                  { title: 'Fix authentication bug', status: 'Todo', priority: 'Critical', assignee: 'SR' },
                  { title: 'Write API documentation', status: 'Done', priority: 'Medium', assignee: 'MJ' },
                  { title: 'Set up CI/CD pipeline', status: 'In Progress', priority: 'High', assignee: 'PL' },
                ].map((task) => (
                  <div key={task.title} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 hover:bg-blue-50 transition-colors">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      task.status === 'Done' ? 'bg-green-500' :
                      task.status === 'In Progress' ? 'bg-blue-500' : 'bg-gray-400'
                    }`} />
                    <span className="text-sm text-gray-700 flex-1 font-medium truncate">{task.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      task.priority === 'Critical' ? 'bg-red-100 text-red-600' :
                      task.priority === 'High' ? 'bg-orange-100 text-orange-600' :
                      'bg-gray-100 text-gray-500'
                    }`}>{task.priority}</span>
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {task.assignee[0]}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
