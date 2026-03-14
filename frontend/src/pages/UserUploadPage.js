import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';

const UserUploadPage = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState('');
  const [addForm, setAddForm] = useState({ name: '', email: '', department: '' });
  const [showAdd, setShowAdd] = useState(false);
  const fileInputRef = useRef(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const [userRes, deptRes] = await Promise.all([
        api.get('/users', { params: { role: 'employee' } }),
        api.get('/users/departments')
      ]);
      setUsers(userRes.data);
      setDepartments(deptRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const showMsg = (text, type = 'info') => setMessage({ text, type });

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      showMsg(`Selected: ${selected.name}`, 'info');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) { showMsg('Please select a file first', 'error'); return; }
    setUploading(true);
    showMsg('Uploading...', 'info');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/users/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showMsg(`Upload complete: ${res.data.created} created, ${res.data.updated || 0} updated, ${res.data.skipped} skipped, ${res.data.errors} errors`, 'success');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchUsers();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Upload failed. Check file format.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users/add', addForm);
      showMsg('User added successfully', 'success');
      setAddForm({ name: '', email: '', department: '' });
      setShowAdd(false);
      fetchUsers();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Error adding user', 'error');
    }
  };

  const filtered = filter ? users.filter(u => u.department === filter) : users;

  const msgColors = {
    info: 'bg-blue-50 border-blue-200 text-blue-700',
    success: 'bg-green-50 border-green-200 text-green-700',
    error: 'bg-red-50 border-red-200 text-red-700',
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-600 mx-auto mb-3"></div>
        <p className="text-slate-500">Loading users...</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Target Users</h1>
          <p className="text-slate-500 text-sm">{users.length} employees in your organization</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-medium"
        >
          {showAdd ? 'Cancel' : '+ Add User'}
        </button>
      </div>

      {message.text && (
        <div className={`border px-4 py-3 rounded-lg mb-4 flex justify-between items-center ${msgColors[message.type]}`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage({ text: '', type: '' })} className="font-bold ml-4">&times;</button>
        </div>
      )}

      {/* Upload CSV / Excel */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-1">Upload Users File</h2>
        <p className="text-xs text-slate-400 mb-4">
          Supports CSV and Excel (.csv, .xlsx, .xls). Required columns: <strong>name, email, department</strong>
        </p>
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center mb-4 hover:border-cyan-300 transition-colors">
          <div className="text-4xl mb-2">📂</div>
          <p className="text-sm text-slate-600 mb-3">
            {file ? (
              <span className="text-cyan-600 font-medium">{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
            ) : (
              'Click below to select a CSV or Excel file'
            )}
          </p>
          <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2 rounded-lg text-sm font-medium transition-colors inline-block">
            Choose File
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="hidden"
            />
          </label>
        </div>
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
        >
          {uploading ? (
            <>
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
              Uploading...
            </>
          ) : (
            <>
              <span>Upload File</span>
            </>
          )}
        </button>
      </div>

      {/* Add Single User */}
      {showAdd && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Add Single User</h2>
          <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text" placeholder="Full Name"
              value={addForm.name}
              onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            />
            <input
              type="email" placeholder="Email Address"
              value={addForm.email}
              onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            />
            <input
              type="text" placeholder="Department"
              value={addForm.department}
              onChange={(e) => setAddForm({ ...addForm, department: e.target.value })}
              className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            />
            <button type="submit" className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-medium">
              Add User
            </button>
          </form>
        </div>
      )}

      {/* Filter & List */}
      <div className="flex items-center gap-4 mb-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <option value="">All Departments ({users.length})</option>
          {departments.map(d => (
            <option key={d} value={d}>{d} ({users.filter(u => u.department === d).length})</option>
          ))}
        </select>
        <span className="text-sm text-slate-500">{filtered.length} users shown</span>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <div className="text-4xl mb-2">👥</div>
            <p>No users found. Upload a CSV file to add employees.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Department</th>
                <th className="text-center px-4 py-3 font-medium text-slate-600">Points</th>
                <th className="text-center px-4 py-3 font-medium text-slate-600">Security Level</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u._id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{u.name}</td>
                  <td className="px-4 py-3 text-slate-600">{u.email}</td>
                  <td className="px-4 py-3">{u.department}</td>
                  <td className="text-center px-4 py-3 font-semibold text-cyan-600">{u.points}</td>
                  <td className="text-center px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.security_level === 'Security Champion' ? 'bg-green-100 text-green-700' :
                      u.security_level === 'Aware' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>{u.security_level || 'Beginner'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default UserUploadPage;
