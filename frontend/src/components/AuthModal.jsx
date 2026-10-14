import React, { useState } from 'react';
import { User, Mail, Lock, Shield, Eye, EyeOff, AlertCircle, CheckCircle, X, Award } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'signup'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    studentId: '',
    password: '',
    confirmPassword: '',
    role: 'student'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        // Client-side validations
        if (!formData.name.trim()) {
          setError('Please enter your full name.');
          setLoading(false);
          return;
        }
        if (!formData.email.trim() || !formData.email.includes('@')) {
          setError('Please provide a valid college email address.');
          setLoading(false);
          return;
        }
        if (!formData.studentId.trim()) {
          setError('Please enter your Student ID or Roll Number.');
          setLoading(false);
          return;
        }
        if (formData.password.length < 6) {
          setError('Password must be at least 6 characters long.');
          setLoading(false);
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match. Please re-enter.');
          setLoading(false);
          return;
        }

        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name.trim(),
            email: formData.email.trim(),
            studentId: formData.studentId.trim(),
            password: formData.password,
            confirmPassword: formData.confirmPassword,
            role: formData.role
          })
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Failed to create account. Please try again.');
          setLoading(false);
          return;
        }

        setSuccess(`Welcome, ${data.user.name}! Account created successfully.`);
        localStorage.setItem('unitransit_token', data.token);
        setTimeout(() => {
          onAuthSuccess(data.user, data.token);
          onClose();
        }, 800);
      } else {
        // Sign In
        if (!formData.email.trim()) {
          setError('Please enter your college email or Student ID.');
          setLoading(false);
          return;
        }
        if (!formData.password) {
          setError('Please enter your password.');
          setLoading(false);
          return;
        }

        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: formData.email.trim(),
            password: formData.password
          })
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Invalid credentials. Please verify your details.');
          setLoading(false);
          return;
        }

        setSuccess(`Welcome back, ${data.user.name}!`);
        localStorage.setItem('unitransit_token', data.token);
        setTimeout(() => {
          onAuthSuccess(data.user, data.token);
          onClose();
        }, 600);
      }
    } catch (err) {
      console.error('[Auth] Network error:', err);
      setError('Unable to reach authentication server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-blue-950/40 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/80 transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-slate-800/80 text-center">
          <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-2xl shadow-lg shadow-blue-500/20 mb-3">
            🚌
          </div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            {mode === 'signup' ? 'Create College Account' : 'Welcome to UniTransit'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'signup'
              ? 'Register with your college credentials for bus tracking & digital pass'
              : 'Sign in to access your digital pass, route tracking & transport hub'}
          </p>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1 bg-slate-950/80 p-1 rounded-xl mt-4 border border-slate-800">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('signup'); setError(null); }}
              className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'signup'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
          {/* Error Banner */}
          {error && (
            <div className="flex items-start space-x-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Banner */}
          {success && (
            <div className="flex items-center space-x-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {mode === 'signup' && (
            <>
              {/* Full Name */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Sai Chandana Gokaraju"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Student ID / Roll No */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Student ID / Roll Number
                </label>
                <div className="relative">
                  <Award className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    name="studentId"
                    required
                    value={formData.studentId}
                    onChange={handleChange}
                    placeholder="e.g. 24EG105G17"
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors uppercase"
                  />
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Role
                </label>
                <div className="relative">
                  <Shield className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="student">Student (Pass & Track)</option>
                    <option value="driver">Driver (Bus Cockpit)</option>
                    <option value="admin">Admin (Fleet Coordinator)</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Email / Identifier */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {mode === 'signup' ? 'College Email Address' : 'College Email or Student ID'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type={mode === 'signup' ? 'email' : 'text'}
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder={mode === 'signup' ? 'student@college.edu' : 'student@college.edu or 24EG105G17'}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-9 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {mode === 'signup' && (
            /* Confirm Password */
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-9 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-xs transition-all shadow-lg shadow-blue-600/25 flex items-center justify-center space-x-2 mt-4 cursor-pointer"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span>{mode === 'signup' ? 'Create Account' : 'Sign In to Campus Fleet'}</span>
            )}
          </button>

          {/* Mode Switch Helper */}
          <div className="text-center pt-2">
            {mode === 'signup' ? (
              <p className="text-xs text-slate-400">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(null); }}
                  className="text-blue-400 hover:underline font-semibold"
                >
                  Sign In
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-400">
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setError(null); }}
                  className="text-blue-400 hover:underline font-semibold"
                >
                  Sign Up
                </button>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
