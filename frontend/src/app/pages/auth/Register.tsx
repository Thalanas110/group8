import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { BookOpen, Eye, EyeOff, UserPlus, X, ScrollText } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../data/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

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
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

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
    if (!agreedToTerms) {
      setError('You must agree to the Terms & Conditions to register.');
      setLoading(false);
      return;
    }
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
      {/* ── Terms & Conditions Modal ─────────────────────────────────────── */}
      {showTerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ScrollText className="w-5 h-5 text-gray-700" />
                <h2 className="text-base font-bold text-gray-900">Terms &amp; Conditions</h2>
              </div>
              <button onClick={() => setShowTerms(false)} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div className="overflow-y-auto px-6 py-4 text-sm text-gray-700 space-y-4 leading-relaxed">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Effective date: April 19, 2026</p>

              <section>
                <h3 className="font-semibold text-gray-900 mb-1">1. Acceptance of Terms</h3>
                <p>By creating an account on ExamHub, you agree to be bound by these Terms &amp; Conditions and our Academic Integrity Policy. If you do not agree, do not register.</p>
              </section>

              <section>
                <h3 className="font-semibold text-gray-900 mb-1">2. Account Responsibilities</h3>
                <p>You are responsible for maintaining the confidentiality of your login credentials. You must not share your account with any other person. You agree to provide accurate and truthful registration information.</p>
              </section>

              <section>
                <h3 className="font-semibold text-gray-900 mb-1">3. Academic Integrity</h3>
                <p>ExamHub is used for academic assessment. Any attempt to cheat, circumvent proctoring measures, or misrepresent your identity during an exam is strictly prohibited and may result in account suspension and referral to your institution's disciplinary committee.</p>
              </section>

              <section>
                <h3 className="font-semibold text-gray-900 mb-1">4. Exam Monitoring</h3>
                <p>During assessments, the platform monitors browser activity including tab switches, window focus changes, and full-screen status. This data is visible to your teachers and administrators for the purpose of academic integrity review.</p>
              </section>

              <section>
                <h3 className="font-semibold text-gray-900 mb-1">5. Data Privacy</h3>
                <p>We collect and store your name, email, role, exam submissions, and activity logs. This data is used solely for academic purposes and is not shared with third parties outside your institution.</p>
              </section>

              <section>
                <h3 className="font-semibold text-gray-900 mb-1">6. Termination</h3>
                <p>Administrators may suspend or terminate accounts that violate these terms. Students and teachers may request account deletion by contacting their institution's administrator.</p>
              </section>
            </div>
            <div className="px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => { setAgreedToTerms(true); setShowTerms(false); }}
                className="w-full bg-gray-900 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors"
              >
                I Have Read and Agree
              </button>
            </div>
          </div>
        </div>
      )}
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
              <Select value={form.role} onValueChange={value => update('role', value)}>
                <SelectTrigger className="w-full h-[46px] px-4 border border-gray-200 rounded-2xl bg-white text-sm text-gray-800 focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:border-transparent shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 rounded-xl shadow-lg">
                  <SelectItem value="student" className="rounded-lg focus:bg-gray-100 focus:text-gray-900">Student</SelectItem>
                  <SelectItem value="teacher" className="rounded-lg focus:bg-gray-100 focus:text-gray-900">Teacher</SelectItem>
                </SelectContent>
              </Select>
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

          {/* Terms & Conditions checkbox */}
          <label className="flex items-start gap-3 cursor-pointer select-none group mt-1">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={e => setAgreedToTerms(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-gray-300 accent-gray-900 flex-shrink-0 cursor-pointer"
            />
            <span className="text-sm text-gray-600 leading-relaxed group-hover:text-gray-800 transition-colors">
              I have read and agree to the{' '}
              <button
                type="button"
                onClick={() => setShowTerms(true)}
                className="text-gray-900 font-semibold underline underline-offset-2 hover:text-gray-600 transition-colors"
              >
                Terms &amp; Conditions
              </button>
            </span>
          </label>

          <button
            type="submit"
            disabled={loading || !agreedToTerms}
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
