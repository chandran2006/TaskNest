import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import type { User } from '../types';
import toast from 'react-hot-toast';

export default function OAuthSuccess() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const ran        = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const params = new URLSearchParams(window.location.search);
    const token  = params.get('token');

    if (!token) {
      toast.error('Google sign-in failed. No token received.');
      navigate('/login', { replace: true });
      return;
    }

    // Attach token before the /auth/me call so the interceptor picks it up
    localStorage.setItem('token', token);

    api.get<{ user: User }>('/auth/me')
      .then(async ({ data }) => {
        // Pass user directly — login() will also re-fetch but that's fine for freshness
        await login(token, data.user);
        toast.success(`Welcome, ${data.user.name}! 🎉`);
        navigate('/dashboard', { replace: true });
      })
      .catch(() => {
        localStorage.removeItem('token');
        toast.error('Google sign-in failed. Please try again.');
        navigate('/login', { replace: true });
      });
  }, [login, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary-950 to-indigo-950 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
        <p className="text-white font-medium">Signing you in with Google…</p>
        <p className="text-slate-400 text-sm">Please wait a moment.</p>
      </div>
    </div>
  );
}
