import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgCode, setOrgCode] = useState('');
  const [showOrgCodeField, setShowOrgCodeField] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password, orgCode);
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.data?.requireOrgCode) {
        setShowOrgCodeField(true);
        setError(err.response.data.message);
      } else {
        setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #0c1a2e 30%, #0e2a3f 60%, #1a1040 100%)' }}>
      
      {/* Animated Background Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-20 animate-float"
        style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)', filter: 'blur(80px)' }} />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-15"
        style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)', filter: 'blur(80px)', animation: 'float 5s ease-in-out infinite reverse' }} />
      <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)', filter: 'blur(60px)', animation: 'float 6s ease-in-out infinite 1s' }} />

      <div className="w-full max-w-md relative z-10">
        {/* Logo & Title */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 shadow-2xl"
            style={{ background: 'linear-gradient(135deg, #0891b2 0%, #6366f1 100%)', boxShadow: '0 8px 32px rgba(8, 145, 178, 0.35)' }}>
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Fin<span className="text-cyan-400">Shield</span>
          </h1>
          <p className="text-cyan-300/70 mt-1.5 text-sm font-medium">Cybersecurity Simulation & Risk Assessment</p>
        </div>

        {/* Login Card */}
        <div className="animate-fade-in-up rounded-2xl p-8 border border-white/10"
          style={{ background: 'rgba(255, 255, 255, 0.06)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
          
          <h2 className="text-xl font-semibold text-white mb-1">Welcome back</h2>
          <p className="text-slate-400 text-sm mb-6">Sign in to your account</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-xl mb-5 text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 transition-all outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  onFocus={(e) => { e.target.style.borderColor = 'rgba(8,145,178,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(8,145,178,0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                  placeholder="you@company.com"
                  required
                />
              </div>
            </div>

            {showOrgCodeField && (
              <div className="animate-fade-in-up">
                <label className="block text-sm font-medium text-slate-300 mb-1.5 flex justify-between">
                  <span>Organization Code</span>
                  <span className="text-xs text-cyan-400 font-normal">Required for shared emails</span>
                </label>
                <div className="relative">
                  <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                  <input
                    type="text"
                    value={orgCode}
                    onChange={(e) => setOrgCode(e.target.value.toUpperCase())}
                    className="w-full pl-11 pr-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 transition-all outline-none"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                    onFocus={(e) => { e.target.style.borderColor = 'rgba(8,145,178,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(8,145,178,0.1)'; }}
                    onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                    placeholder="Enter your Org Code"
                    required={showOrgCodeField}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-11 py-3 rounded-xl text-sm text-white placeholder-slate-500 transition-all outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  onFocus={(e) => { e.target.style.borderColor = 'rgba(8,145,178,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(8,145,178,0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all mt-2 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
              style={{
                background: 'linear-gradient(135deg, #0891b2 0%, #6366f1 100%)',
                color: 'white',
                boxShadow: '0 4px 16px rgba(8, 145, 178, 0.3)',
              }}
              onMouseEnter={(e) => { if (!loading) { e.target.style.boxShadow = '0 6px 24px rgba(8, 145, 178, 0.45)'; e.target.style.transform = 'translateY(-1px)'; }}}
              onMouseLeave={(e) => { e.target.style.boxShadow = '0 4px 16px rgba(8, 145, 178, 0.3)'; e.target.style.transform = 'translateY(0)'; }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                Get Started
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 mt-6 flex items-center justify-center gap-1.5">
          <Lock className="w-3 h-3" />
          Secured by FinShield — Your data is encrypted and protected
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
