import React, { useState, useEffect } from 'react';
import api from '../services/api';

const UserUploadPage = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [addForm, setAddForm] = useState({ name: '', email: '', department: '' });
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const [userRes, deptRes] = await Promise.all([
        api.get('/users', { params: { role: 'employee' } }),
        api.get('/users/departments')
      ]);
      setUsers(userRes.data);
      setDepartments(deptRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await api.post('/users/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMessage(`Upload complete: ${res.data.created} created, ${res.data.skipped} skipped, ${res.data.errors} errors`);
      setFile(null);
      fetchUsers();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Upload failed');
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users/add', addForm);
      setMessage('User added successfully');
      setAddForm({ name: '', email: '', department: '' });
      setShowAdd(false);
      fetchUsers();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error adding user');
    }
  };

  const filtered = filter ? users.filter(u => u.department === filter) : users;

  if (loading) return <div className="flex items-center justify-center h-64"><p>Loading...</p></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Target Users</h1>
        <button onClick={() => setShowAdd(!showAdd)} className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-medium">
          {showAdd ? 'Cancel' : '+ Add User'}
        </button>
      </div>

      {message && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-4">
          {message}
          <button onClick={() => setMessage('')} className="float-right font-bold">&times;</button>
        </div>
      )}

      {/* Upload CSV */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Upload CSV</h2>
        <form onSubmit={handleUpload} className="flex items-center gap-4">
          <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files[0])} className="text-sm" />
          <button type="submit" disabled={!file} className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium">
            Upload
          </button>
        </form>
        <p className="text-xs text-slate-400 mt-2">CSV format: name, email, department (with headers)</p>
      </div>

      {/* Add Single User */}
      {showAdd && (
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Add Single User</h2>
          <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input type="text" placeholder="Name" value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} className="px-4 py-2 border rounded-lg" required />
            <input type="email" placeholder="Email" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} className="px-4 py-2 border rounded-lg" required />
            <input type="text" placeholder="Department" value={addForm.department} onChange={(e) => setAddForm({ ...addForm, department: e.target.value })} className="px-4 py-2 border rounded-lg" required />
            <button type="submit" className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-medium">Add</button>
          </form>
        </div>
      )}

      {/* Filter & List */}
      <div className="flex items-center gap-4 mb-4">
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-4 py-2 border rounded-lg text-sm">
          <option value="">All Departments ({users.length})</option>
          {departments.map(d => (
            <option key={d} value={d}>{d} ({users.filter(u => u.department === d).length})</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
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
              <tr key={u._id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-slate-600">{u.email}</td>
                <td className="px-4 py-3">{u.department}</td>
                <td className="text-center px-4 py-3 font-semibold">{u.points}</td>
                <td className="text-center px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    u.security_level === 'Security Champion' ? 'bg-green-100 text-green-700' :
                    u.security_level === 'Aware' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>{u.security_level}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserUploadPage;
