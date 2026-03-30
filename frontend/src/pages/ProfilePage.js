import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const ProfilePage = () => {
  const { updateAuthUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  const [form, setForm] = useState({
    name: '',
    password: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/auth/me');
        setProfile(res.data.user);
        setForm({ name: res.data.user.name, password: '' });
      } catch (err) {
        setMessage('Error fetching profile data');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const payload = { name: form.name };
      if (form.password) payload.password = form.password;
      
      const res = await api.put('/auth/profile', payload);
      setMessage('Profile updated successfully!');
      
      // Update form state directly to clear password and show new name
      setForm({ name: res.data.user.name, password: '' });
      
      // Also update context user so Navbar changes immediately
      updateAuthUser(res.data.user);
      
      // Refresh local profile state with populated org
      const meRes = await api.get('/auth/me');
      setProfile(meRes.data.user);
      
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error updating profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-12"><p className="text-slate-500">Loading your profile...</p></div>;
  }

  if (!profile) {
    return <div className="p-8 text-center text-red-500">Failed to load profile.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="page-title mb-6">User Profile</h1>

      {message && (
        <div className={`px-4 py-3 rounded-lg mb-6 ${message.includes('Error') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
          {message}
          <button onClick={() => setMessage('')} className="float-right font-bold">&times;</button>
        </div>
      )}

      <div className="glass-card p-6 mb-8">
        <h2 className="text-xl font-semibold text-slate-700 mb-4 border-b pb-2">Profile Details</h2>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">Email <span className="text-xs font-normal">(Cannot be changed)</span></label>
            <input type="email" value={profile.email} disabled className="w-full px-4 py-2 border rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed" />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">Department</label>
            <input type="text" value={profile.department} disabled className="w-full px-4 py-2 border rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">Role</label>
            <input type="text" value={profile.role} disabled className="w-full px-4 py-2 border rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed" />
          </div>

          <div className="pt-4 border-t mt-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Editable Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={form.name} 
                  onChange={(e) => setForm({ ...form, name: e.target.value })} 
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none" 
                  required 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                <input 
                  type="password" 
                  value={form.password} 
                  onChange={(e) => setForm({ ...form, password: e.target.value })} 
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none" 
                  placeholder="Leave blank to keep current password"
                />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={saving}
              className={`bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg font-medium transition-colors ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {saving ? 'Saving...' : 'Update Update'}
            </button>
          </div>
        </form>
      </div>

      {profile.role === 'admin' && profile.organization_id && (
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl shadow p-6 text-white border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-cyan-400 mb-1">Organization Admin Access</h2>
              <p className="text-sm text-slate-300">Share this code with employees so they can join your organization during registration.</p>
            </div>
          </div>
          <div className="mt-6 bg-slate-800 rounded-lg p-4 border border-slate-600 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Organization Code</p>
              <p className="text-2xl font-mono font-bold text-white tracking-widest">{profile.organization_id.code}</p>
            </div>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(profile.organization_id.code);
                setMessage('Organization code copied to clipboard!');
              }}
              className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
            >
              Copy Code
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
