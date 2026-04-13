const steps = [
  {
    step: '01',
    title: 'Create Your Organization',
    desc: 'Sign up and instantly provision your own isolated workspace. Your data stays yours.',
    icon: '🏗️',
  },
  {
    step: '02',
    title: 'Add Users & Assign Roles',
    desc: 'Invite teammates and assign Admin or Member roles with a single click.',
    icon: '👥',
  },
  {
    step: '03',
    title: 'Manage Tasks Efficiently',
    desc: 'Create tasks, set priorities, track progress, and review audit logs in real time.',
    icon: '🚀',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-blue-600 font-semibold text-sm uppercase tracking-widest">How It Works</span>
          <h2 className="text-4xl font-extrabold text-gray-900 mt-3 mb-4">Up and running in minutes</h2>
          <p className="text-gray-500 max-w-xl mx-auto">No complex setup. No lengthy onboarding. Just three simple steps.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-16 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-blue-200 via-indigo-300 to-blue-200" />

          {steps.map((s) => (
            <div key={s.step} className="relative flex flex-col items-center text-center">
              <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-3xl shadow-xl shadow-blue-200 mb-6">
                {s.icon}
              </div>
              <span className="text-xs font-bold text-blue-400 tracking-widest mb-2">STEP {s.step}</span>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{s.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
