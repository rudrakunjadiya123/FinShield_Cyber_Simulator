import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Shield, Building2, Users, ArrowLeft, ArrowRight, Loader2, Lock, Check, X, Copy, CheckCircle, Eye, EyeOff } from 'lucide-react';

const RegisterPage = () => {
  const [step, setStep] = useState(1);
  const [orgAction, setOrgAction] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    department: '', role: 'admin', orgName: '', orgIndustry: '', orgSize: '1-50', orgCode: ''
  });

  const updateForm = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleActionSelect = (action) => {
    setOrgAction(action);
    setForm(prev => ({ ...prev, role: action === 'create' ? 'admin' : 'employee' }));
    setStep(2);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const payload = { name: form.name, email: form.email, password: form.password, department: form.department || 'General', role: form.role, orgAction };
      if (orgAction === 'create') { payload.orgName = form.orgName; payload.orgIndustry = form.orgIndustry; payload.orgSize = form.orgSize; }
      else { payload.orgCode = form.orgCode; }
      const res = await api.post('/auth/register', payload);
      setSuccessData({ user: res.data.user, orgName: res.data.user.organization_name, orgCode: res.data.user.organization_code, isNewOrg: orgAction === 'create' });
      setStep(3);
    } catch (err) { setError(err.response?.data?.message || 'Registration failed'); }
    finally { setLoading(false); }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { level: 0, label: '', color: '', barColor: '' };
    let score = 0;
    const checks = { length: pwd.length >= 8, lowercase: /[a-z]/.test(pwd), uppercase: /[A-Z]/.test(pwd), number: /[0-9]/.test(pwd), special: /[^A-Za-z0-9]/.test(pwd) };
    score = Object.values(checks).filter(Boolean).length;
    if (pwd.length < 6) score = Math.min(score, 1);
    const levels = [
      { level: 0, label: '', color: '', barColor: '' },
      { level: 1, label: 'Very Weak', color: 'text-red-400', barColor: 'bg-red-500' },
      { level: 2, label: 'Weak', color: 'text-orange-400', barColor: 'bg-orange-500' },
      { level: 3, label: 'Fair', color: 'text-yellow-400', barColor: 'bg-yellow-500' },
      { level: 4, label: 'Strong', color: 'text-green-400', barColor: 'bg-green-500' },
      { level: 5, label: 'Very Strong', color: 'text-emerald-400', barColor: 'bg-emerald-500' },
    ];
    return { ...levels[score], checks };
  };

  const strength = getPasswordStrength(form.password);

  const inputClass = "w-full px-4 py-3 rounded-xl text-sm text-white placeholder-slate-500 transition-all outline-none";
  const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' };
  const focusHandlers = {
    onFocus: (e) => { e.target.style.borderColor = 'rgba(8,145,178,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(8,145,178,0.1)'; },
    onBlur: (e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #0c1a2e 30%, #0e2a3f 60%, #1a1040 100%)' }}>
      
      {/* Background Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-20 animate-float"
        style={{ background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)', filter: 'blur(80px)' }} />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-15"
        style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)', filter: 'blur(80px)', animation: 'float 5s ease-in-out infinite reverse' }} />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-in-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5 shadow-2xl"
            style={{ background: 'linear-gradient(135deg, #0891b2 0%, #6366f1 100%)', boxShadow: '0 8px 32px rgba(8, 145, 178, 0.35)' }}>
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Fin<span className="text-cyan-400">Shield</span></h1>
          <p className="text-cyan-300/70 mt-1.5 text-sm font-medium">Cybersecurity Simulation & Risk Assessment</p>
        </div>

        <div className="animate-fade-in-up rounded-2xl p-8 border border-white/10"
          style={{ background: 'rgba(255, 255, 255, 0.06)', backdropFilter: 'blur(24px)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.05)' }}>

          {/* Step Indicator */}
          {step < 3 && (
            <div className="flex items-center justify-center gap-3 mb-6">
              {[1, 2].map(s => (
                <React.Fragment key={s}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
                    step >= s ? 'text-white shadow-lg' : 'bg-white/5 text-slate-500 border border-white/10'
                  }`} style={step >= s ? { background: 'linear-gradient(135deg, #0891b2, #6366f1)' } : {}}>
                    {s}
                  </div>
                  {s < 2 && <div className={`w-12 h-0.5 rounded-full transition-all ${step >= 2 ? 'bg-cyan-500' : 'bg-white/10'}`} />}
                </React.Fragment>
              ))}
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-xl mb-5 text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* ========== STEP 1 ========== */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">Get Started</h2>
              <p className="text-slate-400 text-sm mb-6">Choose how you want to set up your account</p>

              <div className="space-y-3">
                <button onClick={() => handleActionSelect('create')}
                  className="w-full p-4 border border-white/10 rounded-xl hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all text-left group"
                  style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="flex items-center">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center mr-3.5 transition-colors"
                      style={{ background: 'rgba(8, 145, 178, 0.15)' }}>
                      <Building2 className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white text-sm">Create New Organization</h3>
                      <p className="text-xs text-slate-400">You'll be the Admin of your organization</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </button>

                <button onClick={() => handleActionSelect('join')}
                  className="w-full p-4 border border-white/10 rounded-xl hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all text-left group"
                  style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="flex items-center">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center mr-3.5 transition-colors"
                      style={{ background: 'rgba(99, 102, 241, 0.15)' }}>
                      <Users className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white text-sm">Join Existing Organization</h3>
                      <p className="text-xs text-slate-400">Enter your organization code to join</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </button>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-slate-400">
                  Already have an account?{' '}
                  <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">Sign In</Link>
                </p>
              </div>
            </div>
          )}

          {/* ========== STEP 2 ========== */}
          {step === 2 && (
            <form onSubmit={handleSubmit}>
              <button type="button" onClick={() => { setStep(1); setError(''); }}
                className="flex items-center text-sm text-slate-400 hover:text-cyan-400 mb-4 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </button>

              <h2 className="text-xl font-semibold text-white mb-1">
                {orgAction === 'create' ? 'Create Organization' : 'Join Organization'}
              </h2>
              <p className="text-slate-400 text-sm mb-5">
                {orgAction === 'create' ? 'Set up your organization and admin account' : 'Enter your details to join'}
              </p>

              <div className="space-y-4">
                {/* Organization Section */}
                {orgAction === 'create' ? (
                  <div className="space-y-3">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Organization</label>
                    <input type="text" placeholder="Organization Name" value={form.orgName} onChange={(e) => updateForm('orgName', e.target.value)}
                      className={inputClass} style={inputStyle} {...focusHandlers} required />
                    <div className="grid grid-cols-2 gap-2">
                      <select value={form.orgIndustry} onChange={(e) => updateForm('orgIndustry', e.target.value)}
                        className={inputClass} style={inputStyle} {...focusHandlers}>
                        <option value="">Industry</option>
                        <option value="Technology">Technology</option><option value="Finance">Finance</option>
                        <option value="Healthcare">Healthcare</option><option value="Education">Education</option>
                        <option value="Retail">Retail</option><option value="Manufacturing">Manufacturing</option>
                        <option value="Other">Other</option>
                      </select>
                      <select value={form.orgSize} onChange={(e) => updateForm('orgSize', e.target.value)}
                        className={inputClass} style={inputStyle} {...focusHandlers}>
                        <option value="1-50">1-50</option><option value="51-200">51-200</option>
                        <option value="201-500">201-500</option><option value="501-1000">501-1000</option>
                        <option value="1000+">1000+</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Organization Code</label>
                    <input type="text" placeholder="e.g. ACME1234" value={form.orgCode}
                      onChange={(e) => updateForm('orgCode', e.target.value.toUpperCase())}
                      className={`${inputClass} font-mono tracking-widest text-center`} style={inputStyle} {...focusHandlers} required />
                    <p className="text-xs text-slate-500 text-center">Ask your admin for this code</p>
                  </div>
                )}

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
                  <div className="relative flex justify-center">
                    <span className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider" style={{ background: 'rgba(255,255,255,0.06)' }}>Your Account</span>
                  </div>
                </div>

                <input type="text" placeholder="Full Name" value={form.name} onChange={(e) => updateForm('name', e.target.value)}
                  className={inputClass} style={inputStyle} {...focusHandlers} required />
                <input type="email" placeholder="Email Address" value={form.email} onChange={(e) => updateForm('email', e.target.value)}
                  className={inputClass} style={inputStyle} {...focusHandlers} required />
                
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} placeholder="Password (min 6 characters)" value={form.password}
                    onChange={(e) => updateForm('password', e.target.value)}
                    className={`${inputClass} pr-10`} style={inputStyle} {...focusHandlers} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength */}
                {form.password && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden flex gap-0.5" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        {[1, 2, 3, 4, 5].map(i => (
                          <div key={i} className={`flex-1 h-full rounded-full transition-all ${i <= strength.level ? strength.barColor : ''}`}
                            style={i > strength.level ? { background: 'rgba(255,255,255,0.05)' } : {}} />
                        ))}
                      </div>
                      <span className={`text-xs font-medium ${strength.color}`}>{strength.label}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      {[
                        { key: 'length', label: '8+ characters' },
                        { key: 'uppercase', label: 'Uppercase' },
                        { key: 'lowercase', label: 'Lowercase' },
                        { key: 'number', label: 'Number' },
                        { key: 'special', label: 'Special char' }
                      ].map(({ key, label }) => (
                        <div key={key} className={`flex items-center gap-1 ${strength.checks?.[key] ? 'text-green-400' : 'text-slate-500'}`}>
                          {strength.checks?.[key] ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          {label}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <input type="password" placeholder="Confirm Password" value={form.confirmPassword}
                  onChange={(e) => updateForm('confirmPassword', e.target.value)}
                  className={`${inputClass} ${form.confirmPassword ? (form.password === form.confirmPassword ? 'ring-1 ring-green-500/50' : 'ring-1 ring-red-500/50') : ''}`}
                  style={inputStyle} {...focusHandlers} required />
                {form.confirmPassword && (
                  <p className={`text-xs flex items-center gap-1 ${form.password === form.confirmPassword ? 'text-green-400' : 'text-red-400'}`}>
                    {form.password === form.confirmPassword ? <><Check className="w-3 h-3" /> Passwords match</> : <><X className="w-3 h-3" /> Passwords do not match</>}
                  </p>
                )}

                <input type="text" placeholder="Department (e.g. IT, Finance, HR)" value={form.department}
                  onChange={(e) => updateForm('department', e.target.value)}
                  className={inputClass} style={inputStyle} {...focusHandlers} />

                {orgAction === 'join' && (
                  <select value={form.role} onChange={(e) => updateForm('role', e.target.value)}
                    className={inputClass} style={inputStyle} {...focusHandlers}>
                    <option value="employee">Employee</option><option value="cybersecurity">Cybersecurity Team</option>
                    <option value="analyst">Security Analyst</option><option value="admin">Administrator</option>
                  </select>
                )}
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-sm text-white mt-6 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                style={{ background: 'linear-gradient(135deg, #0891b2 0%, #6366f1 100%)', boxShadow: '0 4px 16px rgba(8, 145, 178, 0.3)' }}>
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating Account...</>
                  : orgAction === 'create' ? 'Create Organization' : 'Join Organization'}
              </button>

              <p className="mt-4 text-center text-sm text-slate-400">
                Already have an account?{' '}
                <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">Sign In</Link>
              </p>
            </form>
          )}

          {/* ========== STEP 3: Success ========== */}
          {step === 3 && successData && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(34, 197, 94, 0.15)' }}>
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>

              <h2 className="text-xl font-bold text-white mb-1">Account Created!</h2>
              <p className="text-slate-400 text-sm mb-6">
                {successData.isNewOrg ? `Organization "${successData.orgName}" is ready.` : `You've joined "${successData.orgName}".`}
              </p>

              <div className="rounded-xl p-5 border border-white/10 mb-6" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Organization Code</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl font-mono font-bold text-cyan-400 tracking-widest">{successData.orgCode}</span>
                  <button onClick={() => copyToClipboard(successData.orgCode)}
                    className="p-2 rounded-lg transition-colors hover:bg-white/5" title="Copy code">
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2">Share this code with team members to join</p>
              </div>

              <div className="rounded-xl p-4 text-left text-sm space-y-1 border border-cyan-500/10 mb-6" style={{ background: 'rgba(8,145,178,0.05)' }}>
                <p className="text-cyan-300"><span className="font-medium text-cyan-400">Name:</span> {successData.user.name}</p>
                <p className="text-cyan-300"><span className="font-medium text-cyan-400">Email:</span> {successData.user.email}</p>
                <p className="text-cyan-300"><span className="font-medium text-cyan-400">Role:</span> {successData.user.role}</p>
              </div>

              <button onClick={() => navigate('/login')}
                className="w-full py-3 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all"
                style={{ background: 'linear-gradient(135deg, #0891b2 0%, #6366f1 100%)', boxShadow: '0 4px 16px rgba(8, 145, 178, 0.3)' }}>
                Go to Login <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-500 mt-6 flex items-center justify-center gap-1.5">
          <Lock className="w-3 h-3" />
          Secured by FinShield — Your data is encrypted and protected
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
