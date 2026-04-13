import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src="/fav.png" alt="TaskNest" className="w-9 h-9 rounded-lg object-contain" />
          <span className="text-xl font-bold text-gray-900">TaskNest</span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-blue-600 transition-colors">How It Works</a>
          <a href="#testimonials" className="hover:text-blue-600 transition-colors">Testimonials</a>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors px-4 py-2">
            Log In
          </Link>
          <Link to="/signup" className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2 rounded-lg hover:opacity-90 transition-opacity shadow-md shadow-blue-200">
            Get Started
          </Link>
        </div>

        <button
          className="md:hidden p-2 text-gray-600"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          <div className="w-5 h-0.5 bg-current mb-1" />
          <div className="w-5 h-0.5 bg-current mb-1" />
          <div className="w-5 h-0.5 bg-current" />
        </button>
      </div>

      {open && (
        <div id="mobile-menu" className="md:hidden bg-white border-t border-gray-100 px-6 py-4 flex flex-col gap-4 text-sm font-medium text-gray-700">
          <a href="#features" onClick={() => setOpen(false)}>Features</a>
          <a href="#how-it-works" onClick={() => setOpen(false)}>How It Works</a>
          <a href="#testimonials" onClick={() => setOpen(false)}>Testimonials</a>
          <Link to="/login" onClick={() => setOpen(false)}>Log In</Link>
          <Link to="/signup" onClick={() => setOpen(false)} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg text-center">
            Get Started
          </Link>
        </div>
      )}
    </nav>
  );
}
