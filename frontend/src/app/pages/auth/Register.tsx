import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { BookOpen, Eye, EyeOff, UserPlus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../data/types';

export function Register() {
  const { register, currentUser } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
    role: 'student' as UserRole,
    department: '',
  });
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) navigate(`/${currentUser.role}`, { replace: true });
  }, [currentUser, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const result = await register({
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role,
      department: form.department,
    });
    if (!result.success) setError(result.error || 'Registration failed');
    setLoading(false);
  };

  const update = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="min-h-screen relative overflow-hidden px-4 py-8 sm:px-6 lg:px-8 lg:flex lg:items-center">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-24 right-0 w-80 h-80 rounded-full bg-teal-300/25 blur-3xl" />
        <div className="absolute bottom-0 -left-12 w-72 h-72 rounded-full bg-orange-300/35 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-5xl mx-auto rounded-[2rem] border border-gray-200 bg-white/90 backdrop-blur-xl p-6 sm:p-8 lg:p-10 shadow-[0_35px_70px_-45px_rgba(48,27,11,0.7)]">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-2xl bg-gray-900 flex items-center justify-center shadow-[0_14px_30px_-18px_rgba(51,25,10,0.8)]">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-lg font-semibold text-gray-900 tracking-tight">ExamHub</div>
            <div className="text-xs text-gray-600 uppercase tracking-[0.14em] mt-0.5">Create your account</div>
          </div>
        </div>

        <div className="mb-7">
          <h1 className="text-3xl sm:text-4xl leading-tight">Join the assessment workspace.</h1>
          <p className="text-gray-600 mt-2 text-sm max-w-2xl">
            Register once and access your role-specific dashboard from desktop, tablet, or phone.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-2xl border border-rose-200 bg-rose-50 text-rose-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-2 uppercase tracking-[0.14em]">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => update('name', e.target.value)}
                required
                placeholder="John Doe"
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-2 uppercase tracking-[0.14em]">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={e => update('email', e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-2 uppercase tracking-[0.14em]">Role</label>
              <select
                value={form.role}
                onChange={e => update('role', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none text-sm"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-2 uppercase tracking-[0.14em]">Department / Major</label>
              <input
                type="text"
                value={form.department}
                onChange={e => update('department', e.target.value)}
                placeholder="e.g. Computer Science"
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-2 uppercase tracking-[0.14em]">Password</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => update('password', e.target.value)}
                  required
                  placeholder="Minimum 6 characters"
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none text-sm pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-800"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-2 uppercase tracking-[0.14em]">Confirm Password</label>
              <input
                type="password"
                value={form.confirm}
                onChange={e => update('confirm', e.target.value)}
                required
                placeholder="Re-enter your password"
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white py-3 px-4 rounded-2xl disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-semibold transition-colors mt-3"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-gray-900 hover:text-gray-700 font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
