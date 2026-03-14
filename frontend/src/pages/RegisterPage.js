import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

const RegisterPage = () => {
  const [step, setStep] = useState(1); // 1 = choose action, 2 = form, 3 = success
  const [orgAction, setOrgAction] = useState(''); // 'create' or 'join'
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState(null); // Store registration result
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

  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const res = await api.get('/auth/organizations');
        setOrganizations(res.data);
      } catch (err) {
        console.error('Failed to fetch organizations');
      }
    };
    fetchOrgs();
  }, []);

  const handleActionSelect = (action) => {
    setOrgAction(action);
    setForm(prev => ({
      ...prev,
      role: action === 'create' ? 'admin' : 'employee'
    }));
    setStep(2);
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

      // Don't auto-login - show success screen instead
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
    alert('Organization code copied to clipboard!');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-slate-800">FinShield</h1>
          <p className="text-slate-500 mt-1">Cybersecurity Simulation Platform</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Step 1: Choose Action */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-700 text-center mb-4">How do you want to get started?</h2>

            <button
              onClick={() => handleActionSelect('create')}
              className="w-full p-4 border-2 border-cyan-200 rounded-xl hover:border-cyan-500 hover:bg-cyan-50 transition-all text-left"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-2xl">🏢</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">Create New Organization</h3>
                  <p className="text-sm text-slate-500">Register as an Admin and set up your organization</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => handleActionSelect('join')}
              className="w-full p-4 border-2 border-slate-200 rounded-xl hover:border-cyan-500 hover:bg-cyan-50 transition-all text-left"
            >
              <div className="flex items-center">
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-2xl">👥</span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">Join Existing Organization</h3>
                  <p className="text-sm text-slate-500">Use an organization code to join your team</p>
                </div>
              </div>
            </button>

            <div className="text-center mt-6">
              <p className="text-sm text-slate-500">
                Already have an account?{' '}
                <Link to="/login" className="text-cyan-600 hover:text-cyan-700 font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Registration Form */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-sm text-cyan-600 hover:text-cyan-700 mb-2"
            >
              ← Back
            </button>

            <h2 className="text-lg font-semibold text-slate-700">
              {orgAction === 'create' ? 'Create Organization & Admin Account' : 'Join Organization'}
            </h2>

            {/* Organization Fields */}
            {orgAction === 'create' ? (
              <div className="bg-cyan-50 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-medium text-cyan-800">Organization Details</h3>
                <input
                  type="text"
                  placeholder="Organization Name *"
                  value={form.orgName}
                  onChange={(e) => setForm({ ...form, orgName: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={form.orgIndustry}
                    onChange={(e) => setForm({ ...form, orgIndustry: e.target.value })}
                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
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
                    onChange={(e) => setForm({ ...form, orgSize: e.target.value })}
                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  >
                    <option value="1-50">1-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201-500">201-500 employees</option>
                    <option value="501-1000">501-1000 employees</option>
                    <option value="1000+">1000+ employees</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-medium text-slate-700">Organization Code</h3>
                <input
                  type="text"
                  placeholder="Enter organization code (e.g., ACME1234)"
                  value={form.orgCode}
                  onChange={(e) => setForm({ ...form, orgCode: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none font-mono"
                  required
                />
                <p className="text-xs text-slate-500">Ask your organization admin for the code</p>
              </div>
            )}

            {/* User Fields */}
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-medium text-slate-700">Your Account</h3>
              <input
                type="text"
                placeholder="Full Name *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                required
              />
              <input
                type="email"
                placeholder="Email Address *"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="password"
                  placeholder="Password *"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  required
                />
                <input
                  type="password"
                  placeholder="Confirm Password *"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                  required
                />
              </div>
              <input
                type="text"
                placeholder="Department (e.g., IT, Finance)"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              />

              {orgAction === 'join' && (
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                >
                  <option value="employee">Employee (Target User)</option>
                  <option value="cybersecurity">Cybersecurity Team</option>
                  <option value="analyst">Security Analyst</option>
                  <option value="admin">Administrator</option>
                </select>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : orgAction === 'create' ? 'Create Organization' : 'Join Organization'}
            </button>

            <p className="text-center text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="text-cyan-600 hover:text-cyan-700 font-medium">
                Sign in
              </Link>
            </p>
          </form>
        )}

        {/* Step 3: Success Screen */}
        {step === 3 && successData && (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-4xl">✓</span>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-green-700">Registration Successful!</h2>
              <p className="text-slate-600 mt-2">
                {successData.isNewOrg
                  ? `Your organization "${successData.orgName}" has been created.`
                  : `You have joined "${successData.orgName}".`
                }
              </p>
            </div>

            {/* Organization Code Display */}
            <div className="bg-slate-50 rounded-xl p-6 border-2 border-dashed border-slate-300">
              <p className="text-sm font-medium text-slate-600 mb-2">Organization Code</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl font-mono font-bold text-cyan-600 tracking-wider">
                  {successData.orgCode}
                </span>
                <button
                  onClick={() => copyToClipboard(successData.orgCode)}
                  className="p-2 bg-cyan-100 hover:bg-cyan-200 rounded-lg transition-colors"
                  title="Copy to clipboard"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-3">
                Share this code with your team members so they can join your organization.
              </p>
            </div>

            {/* Account Details */}
            <div className="bg-cyan-50 rounded-lg p-4 text-left">
              <h3 className="text-sm font-semibold text-cyan-800 mb-2">Your Account Details</h3>
              <div className="text-sm text-cyan-700 space-y-1">
                <p><strong>Name:</strong> {successData.user.name}</p>
                <p><strong>Email:</strong> {successData.user.email}</p>
                <p><strong>Role:</strong> {successData.user.role}</p>
                <p><strong>Department:</strong> {successData.user.department}</p>
              </div>
            </div>

            {/* Go to Login Button */}
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Go to Login Page
            </button>

            <p className="text-xs text-slate-400">
              Use your email and password to sign in to the dashboard.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegisterPage;
