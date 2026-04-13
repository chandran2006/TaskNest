const testimonials = [
  {
    quote: 'TaskNest helped us streamline our workflow effortlessly. The RBAC system is exactly what we needed for our growing team.',
    name: 'Sarah Chen',
    role: 'Engineering Manager, Acme Corp',
    avatar: 'SC',
    gradient: 'from-blue-500 to-indigo-500',
  },
  {
    quote: "The multi-tenant architecture gives us peace of mind. Our client data is completely isolated and secure. Couldn't ask for more.",
    name: 'Marcus Johnson',
    role: 'CTO, BuildFast Inc',
    avatar: 'MJ',
    gradient: 'from-violet-500 to-purple-500',
  },
  {
    quote: 'Audit logs are a game changer for compliance. We can track every change and stay accountable across all our projects.',
    name: 'Priya Nair',
    role: 'Product Lead, Nexus Labs',
    avatar: 'PN',
    gradient: 'from-rose-500 to-pink-500',
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-24 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="text-blue-600 font-semibold text-sm uppercase tracking-widest">Testimonials</span>
          <h2 className="text-4xl font-extrabold text-gray-900 mt-3 mb-4">Loved by teams worldwide</h2>
          <p className="text-gray-500 max-w-xl mx-auto">Don't just take our word for it — here's what our users say.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div key={t.name} className="bg-white rounded-2xl p-7 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100">
              <div className="flex gap-1 mb-5">
                {Array(5).fill(0).map((_, i) => (
                  <span key={i} className="text-yellow-400 text-lg">★</span>
                ))}
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-6 italic">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                  {t.avatar}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{t.name}</div>
                  <div className="text-gray-400 text-xs">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
