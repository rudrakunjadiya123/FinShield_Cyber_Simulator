import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const RegisterPage = () => {
  const [step, setStep] = useState(1);
  const [orgAction, setOrgAction] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    role: 'admin',
    orgName: '',
    orgIndustry: '',
    orgSize: '1-50',
    orgCode: ''
  });

  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleActionSelect = (action) => {
    setOrgAction(action);
    setForm(prev => ({
      ...prev,
      role: action === 'create' ? 'admin' : 'employee'
    }));
    setStep(2);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        department: form.department || 'General',
        role: form.role,
        orgAction
      };

      if (orgAction === 'create') {
        payload.orgName = form.orgName;
        payload.orgIndustry = form.orgIndustry;
        payload.orgSize = form.orgSize;
      } else {
        payload.orgCode = form.orgCode;
      }

      const res = await api.post('/auth/register', payload);
      setSuccessData({
        user: res.data.user,
        orgName: res.data.user.organization_name,
        orgCode: res.data.user.organization_code,
        isNewOrg: orgAction === 'create'
      });
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { level: 0, label: '', color: '', barColor: '' };
    let score = 0;
    const checks = {
      length: pwd.length >= 8,
      lowercase: /[a-z]/.test(pwd),
      uppercase: /[A-Z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[^A-Za-z0-9]/.test(pwd),
    };
    score = Object.values(checks).filter(Boolean).length;
    if (pwd.length < 6) score = Math.min(score, 1);

    const levels = [
      { level: 0, label: '', color: '', barColor: '' },
      { level: 1, label: 'Very Weak', color: 'text-red-600', barColor: 'bg-red-500' },
      { level: 2, label: 'Weak', color: 'text-orange-600', barColor: 'bg-orange-500' },
      { level: 3, label: 'Fair', color: 'text-yellow-600', barColor: 'bg-yellow-500' },
      { level: 4, label: 'Strong', color: 'text-green-600', barColor: 'bg-green-500' },
      { level: 5, label: 'Very Strong', color: 'text-emerald-600', barColor: 'bg-emerald-500' },
    ];
    return { ...levels[score], checks };
  };

  const strength = getPasswordStrength(form.password);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-cyan-500 rounded-2xl mb-4 shadow-lg shadow-cyan-500/30">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white">FinShield</h1>
          <p className="text-cyan-300 mt-1 text-sm">Cybersecurity Simulation & Risk Assessment</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">

          {/* Step Indicator */}
          {step < 3 && (
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${step >= 1 ? 'bg-cyan-600 text-white' : 'bg-slate-200 text-slate-500'}`}>1</div>
              <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-cyan-600' : 'bg-slate-200'}`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${step >= 2 ? 'bg-cyan-600 text-white' : 'bg-slate-200 text-slate-500'}`}>2</div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded mb-4 text-sm">
              {error}
            </div>
          )}

          {/* ======================== STEP 1: Choose Action ======================== */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-semibold text-slate-800 mb-1">Get Started</h2>
              <p className="text-slate-500 text-sm mb-6">Choose how you want to set up your account</p>

              <div className="space-y-3">
                <button
                  onClick={() => handleActionSelect('create')}
                  className="w-full p-4 border-2 border-slate-200 rounded-xl hover:border-cyan-500 hover:bg-cyan-50 transition-all text-left group"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-cyan-200 transition-colors">
                      <svg className="w-5 h-5 text-cyan-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 text-sm">Create New Organization</h3>
                      <p className="text-xs text-slate-500">You'll be the Admin of your organization</p>
                    </div>
                    <svg className="w-5 h-5 text-slate-400 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>

                <button
                  onClick={() => handleActionSelect('join')}
                  className="w-full p-4 border-2 border-slate-200 rounded-xl hover:border-cyan-500 hover:bg-cyan-50 transition-all text-left group"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center mr-3 group-hover:bg-cyan-100 transition-colors">
                      <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800 text-sm">Join Existing Organization</h3>
                      <p className="text-xs text-slate-500">Enter your organization code to join</p>
                    </div>
                    <svg className="w-5 h-5 text-slate-400 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-slate-500">
                  Already have an account?{' '}
                  <Link to="/login" className="text-cyan-600 hover:text-cyan-700 font-medium">Sign In</Link>
                </p>
              </div>
            </div>
          )}

          {/* ======================== STEP 2: Registration Form ======================== */}
          {step === 2 && (
            <form onSubmit={handleSubmit}>
              <button
                type="button"
                onClick={() => { setStep(1); setError(''); }}
                className="flex items-center text-sm text-slate-500 hover:text-cyan-600 mb-4"
              >
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>

              <h2 className="text-xl font-semibold text-slate-800 mb-1">
                {orgAction === 'create' ? 'Create Organization' : 'Join Organization'}
              </h2>
              <p className="text-slate-500 text-sm mb-5">
                {orgAction === 'create' ? 'Set up your organization and admin account' : 'Enter your details to join'}
              </p>

              <div className="space-y-4">
                {/* Organization Section */}
                {orgAction === 'create' ? (
                  <div className="space-y-3">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Organization</label>
                    <input
                      type="text"
                      placeholder="Organization Name"
                      value={form.orgName}
                      onChange={(e) => updateForm('orgName', e.target.value)}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none text-sm"
                      required
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={form.orgIndustry}
                        onChange={(e) => updateForm('orgIndustry', e.target.value)}
                        className="px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none text-sm text-slate-600"
                      >
                        <option value="">Industry</option>
                        <option value="Technology">Technology</option>
                        <option value="Finance">Finance</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Education">Education</option>
                        <option value="Retail">Retail</option>
                        <option value="Manufacturing">Manufacturing</option>
                        <option value="Other">Other</option>
                      </select>
                      <select
                        value={form.orgSize}
                        onChange={(e) => updateForm('orgSize', e.target.value)}
                        className="px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none text-sm text-slate-600"
                      >
                        <option value="1-50">1-50</option>
                        <option value="51-200">51-200</option>
                        <option value="201-500">201-500</option>
                        <option value="501-1000">501-1000</option>
                        <option value="1000+">1000+</option>
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Organization Code</label>
                    <input
                      type="text"
                      placeholder="e.g. ACME1234"
                      value={form.orgCode}
                      onChange={(e) => updateForm('orgCode', e.target.value.toUpperCase())}
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none text-sm font-mono tracking-widest text-center"
                      required
                    />
                    <p className="text-xs text-slate-400 text-center">Ask your admin for this code</p>
                  </div>
                )}

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                  <div className="relative flex justify-center"><span className="bg-white px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Your Account</span></div>
                </div>

                {/* User Details */}
                <input
                  type="text"
                  placeholder="Full Name"
                  value={form.name}
                  onChange={(e) => updateForm('name', e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none text-sm"
                  required
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={form.email}
                  onChange={(e) => updateForm('email', e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none text-sm"
                  required
                />
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password (min 6 characters)"
                    value={form.password}
                    onChange={(e) => updateForm('password', e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none text-sm pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {showPassword ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      ) : (
                        <>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </>
                      )}
                    </svg>
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {form.password && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div
                            key={i}
                            className={`flex-1 h-full rounded-full transition-all ${
                              i <= strength.level ? strength.barColor : 'bg-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className={`text-xs font-medium ${strength.color}`}>
                        {strength.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <div className={`flex items-center gap-1 ${strength.checks?.length ? 'text-green-600' : 'text-slate-400'}`}>
                        {strength.checks?.length ? (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        ) : (
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="2"/></svg>
                        )}
                        8+ characters
                      </div>
                      <div className={`flex items-center gap-1 ${strength.checks?.uppercase ? 'text-green-600' : 'text-slate-400'}`}>
                        {strength.checks?.uppercase ? (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        ) : (
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="2"/></svg>
                        )}
                        Uppercase
                      </div>
                      <div className={`flex items-center gap-1 ${strength.checks?.lowercase ? 'text-green-600' : 'text-slate-400'}`}>
                        {strength.checks?.lowercase ? (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        ) : (
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="2"/></svg>
                        )}
                        Lowercase
                      </div>
                      <div className={`flex items-center gap-1 ${strength.checks?.number ? 'text-green-600' : 'text-slate-400'}`}>
                        {strength.checks?.number ? (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        ) : (
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="2"/></svg>
                        )}
                        Number
                      </div>
                      <div className={`flex items-center gap-1 ${strength.checks?.special ? 'text-green-600' : 'text-slate-400'}`}>
                        {strength.checks?.special ? (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        ) : (
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="2"/></svg>
                        )}
                        Special char
                      </div>
                    </div>
                  </div>
                )}

                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={form.confirmPassword}
                  onChange={(e) => updateForm('confirmPassword', e.target.value)}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none text-sm ${
                    form.confirmPassword
                      ? form.password === form.confirmPassword
                        ? 'border-green-500 bg-green-50'
                        : 'border-red-500 bg-red-50'
                      : 'border-slate-300'
                  }`}
                  required
                />
                {form.confirmPassword && (
                  <p className={`text-xs flex items-center gap-1 ${
                    form.password === form.confirmPassword ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {form.password === form.confirmPassword ? (
                      <>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        Passwords match
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                        Passwords do not match
                      </>
                    )}
                  </p>
                )}
                <input
                  type="text"
                  placeholder="Department (e.g. IT, Finance, HR)"
                  value={form.department}
                  onChange={(e) => updateForm('department', e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none text-sm"
                />

                {orgAction === 'join' && (
                  <select
                    value={form.role}
                    onChange={(e) => updateForm('role', e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none text-sm"
                  >
                    <option value="employee">Employee</option>
                    <option value="cybersecurity">Cybersecurity Team</option>
                    <option value="analyst">Security Analyst</option>
                    <option value="admin">Administrator</option>
                  </select>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2.5 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    Creating Account...
                  </span>
                ) : orgAction === 'create' ? 'Create Organization' : 'Join Organization'}
              </button>

              <p className="mt-4 text-center text-sm text-slate-500">
                Already have an account?{' '}
                <Link to="/login" className="text-cyan-600 hover:text-cyan-700 font-medium">Sign In</Link>
              </p>
            </form>
          )}

          {/* ======================== STEP 3: Success ======================== */}
          {step === 3 && successData && (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h2 className="text-xl font-bold text-slate-800 mb-1">Account Created!</h2>
              <p className="text-slate-500 text-sm mb-6">
                {successData.isNewOrg
                  ? `Organization "${successData.orgName}" is ready.`
                  : `You've joined "${successData.orgName}".`
                }
              </p>

              {/* Org Code Card */}
              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 mb-6">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Organization Code</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl font-mono font-bold text-cyan-600 tracking-widest">
                    {successData.orgCode}
                  </span>
                  <button
                    onClick={() => copyToClipboard(successData.orgCode)}
                    className="p-1.5 bg-cyan-100 hover:bg-cyan-200 rounded-lg transition-colors"
                    title="Copy code"
                  >
                    <svg className="w-4 h-4 text-cyan-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-2">Share this code with team members to join</p>
              </div>

              {/* Account Summary */}
              <div className="bg-cyan-50 rounded-lg p-4 text-left text-sm mb-6 space-y-1">
                <p className="text-cyan-800"><span className="font-medium">Name:</span> {successData.user.name}</p>
                <p className="text-cyan-800"><span className="font-medium">Email:</span> {successData.user.email}</p>
                <p className="text-cyan-800"><span className="font-medium">Role:</span> {successData.user.role}</p>
              </div>

              <button
                onClick={() => navigate('/login')}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-2.5 rounded-lg transition-all"
              >
                Go to Login
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          Secured by FinShield - Your data is encrypted and protected
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
