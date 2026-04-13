const features = [
  {
    icon: '🏢',
    title: 'Multi-Tenant Architecture',
    desc: 'Complete data isolation between organizations. Each team gets their own secure workspace.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: '👑',
    title: 'Role-Based Access Control',
    desc: 'Fine-grained Admin vs Member permissions. Control who sees and does what.',
    gradient: 'from-indigo-500 to-purple-500',
  },
  {
    icon: '📋',
    title: 'Task Management',
    desc: 'Create, update, delete, and track tasks with priorities, statuses, and assignees.',
    gradient: 'from-violet-500 to-pink-500',
  },
  {
    icon: '🔐',
    title: 'Secure Authentication',
    desc: 'JWT-based login with token refresh, secure sessions, and password hashing.',
    gradient: 'from-rose-500 to-orange-500',
  },
  {
    icon: '🧾',
    title: 'Audit Logs',
    desc: 'Full activity trail for every task change. Stay compliant and accountable.',
    gradient: 'from-amber-500 to-yellow-500',
  },
  {
    icon: '⚡',
    title: 'Fast & Scalable',
    desc: 'Built on a modern tech stack designed to scale with your team from day one.',
    gradient: 'from-green-500 to-teal-500',
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-blue-600 font-semibold text-sm uppercase tracking-widest">Features</span>
          <h2 className="text-4xl font-extrabold text-gray-900 mt-3 mb-4">
            Everything your team needs
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            TaskNest packs enterprise-grade features into a clean, intuitive interface your team will actually enjoy using.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="group bg-gray-50 hover:bg-white border border-transparent hover:border-blue-100 rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center text-2xl mb-5 shadow-lg`}>
                {f.icon}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
