import { Link } from 'react-router-dom';

export default function CTA() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl px-10 py-16 shadow-2xl shadow-blue-200 relative overflow-hidden">
          {/* Decorative blobs */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />

          <span className="inline-block bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-6 backdrop-blur-sm">
            🚀 Get started today — it's free
          </span>
          <h2 className="text-4xl font-extrabold text-white mb-5 leading-tight">
            Start managing your tasks<br />smarter today
          </h2>
          <p className="text-blue-100 mb-10 max-w-lg mx-auto">
            Join hundreds of teams already using TaskNest to ship faster, collaborate better, and stay secure.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/signup"
              className="px-8 py-4 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 hover:-translate-y-0.5 transition-all shadow-lg"
            >
              Sign Up Now — Free
            </Link>
            <a
              href="#features"
              className="px-8 py-4 bg-white/10 text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 hover:-translate-y-0.5 transition-all backdrop-blur-sm"
            >
              Explore Features
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
