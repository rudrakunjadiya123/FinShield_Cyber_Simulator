import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import { Search } from 'lucide-react';

const UserUploadPage = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [addForm, setAddForm] = useState({ name: '', email: '', department: '', employee_id: '', role: 'employee' });
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', department: '', employee_id: '' });
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
      setAddForm({ name: '', email: '', department: '', employee_id: '', role: 'employee' });
      setShowAdd(false);
      fetchUsers();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Error adding user', 'error');
    }
  };

  const handleEditStart = (u) => {
    setEditId(u._id);
    setEditForm({ name: u.name, email: u.email, department: u.department, employee_id: u.employee_id || '' });
  };

  const handleEditCancel = () => {
    setEditId(null);
    setEditForm({ name: '', email: '', department: '', employee_id: '' });
  };

  const handleEditSave = async () => {
    try {
      await api.put(`/users/update/${editId}`, editForm);
      showMsg('User updated successfully', 'success');
      handleEditCancel();
      fetchUsers();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Error updating user', 'error');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"? This action cannot be undone.`)) return;
    try {
      await api.delete(`/users/delete/${id}`);
      showMsg(`User "${name}" deleted`, 'success');
      fetchUsers();
    } catch (err) {
      showMsg(err.response?.data?.message || 'Error deleting user', 'error');
    }
  };

  const filtered = users.filter(u => {
    const matchesFilter = filter ? u.department === filter : true;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = searchQuery 
      ? (u.name?.toLowerCase().includes(searchLower) || u.email?.toLowerCase().includes(searchLower))
      : true;
    return matchesFilter && matchesSearch;
  });

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
    <div className="page-container">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="page-title">Target Users</h1>
          <p className="text-slate-500 text-sm">{users.length} employees in your organization</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="bg-cyan-600 hover:bg-cyan-700 text-white px-5 py-2 rounded-lg font-medium text-sm shadow-sm transition-colors"
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
      <div className="bg-white border text-center border-slate-200 rounded-xl p-6 mb-6 shadow-sm">
        <div className="text-left mb-6">
           <h2 className="text-lg font-semibold text-slate-800 mb-1">Upload Users File</h2>
           <p className="text-xs text-slate-500">
             Supports CSV and Excel (.csv, .xlsx, .xls). Required columns: <span className="font-semibold text-cyan-700">name, email, department, employee_id</span>
           </p>
        </div>
        
        <div className="border-2 border-dashed border-slate-200 rounded-xl py-12 px-6 flex flex-col items-center justify-center mb-6 hover:bg-slate-50 transition-colors">
          <div className="w-14 h-14 rounded-full bg-[#e0f7fa] flex items-center justify-center text-[#006064] mb-4">
             <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
               <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm14-1V6H4v3h12V5z" clipRule="evenodd" />
               <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
             </svg>
          </div>
          <p className="text-sm text-slate-600 mb-4">Click below to select a CSV or Excel file</p>
          <label className="cursor-pointer bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-6 py-1.5 font-medium rounded-full text-sm transition-colors shadow-sm">
            Choose File
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="hidden"
            />
          </label>
           {file && (
             <p className="text-sm text-cyan-700 font-medium mt-3">Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)</p>
          )}
        </div>
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg font-semibold text-sm shadow-sm flex items-center justify-center gap-2 transition-colors"
        >
          {uploading ? (
            <>
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
              Uploading...
            </>
          ) : (
            <span>Upload File</span>
          )}
        </button>
      </div>

      {/* Add Single User */}
      {showAdd && (
        <div className="glass-card p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Add Single User</h2>
          <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <input
              type="text" placeholder="Employee ID"
              value={addForm.employee_id}
              onChange={(e) => setAddForm({ ...addForm, employee_id: e.target.value })}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <input
              type="text" placeholder="Full Name"
              value={addForm.name}
              onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            />
            <input
              type="email" placeholder="Email Address"
              value={addForm.email}
              onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            />
            <input
              type="text" placeholder="Department"
              value={addForm.department}
              onChange={(e) => setAddForm({ ...addForm, department: e.target.value })}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              required
            />
            <select
              value={addForm.role}
              onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
            >
              <option value="employee">Employee</option>
              <option value="admin">Administrator</option>
              <option value="cybersecurity">Cyber Security Team</option>
              <option value="analyst">Security Analyst</option>
            </select>
            <button type="submit" className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors">
              Add User
            </button>
          </form>
        </div>
      )}

      {/* Filter & List */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none w-48 shadow-sm text-slate-700"
          >
            <option value="">All Departments ({users.length})</option>
            {departments.map(d => (
              <option key={d} value={d}>{d} ({users.filter(u => u.department === d).length})</option>
            ))}
          </select>
          <span className="text-xs font-medium text-slate-600">{filtered.length} users shown</span>
        </div>
        <div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 w-72 text-slate-600"
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden mb-8">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <div className="text-4xl mb-2">👥</div>
            <p>No users found. Upload a CSV file to add employees.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#eff2f9]">
              <tr>
                <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-slate-500 font-semibold">Name</th>
                <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-slate-500 font-semibold">Email</th>
                <th className="text-left px-5 py-3 text-xs uppercase tracking-wider text-slate-500 font-semibold">Department</th>
                <th className="text-center px-5 py-3 text-xs uppercase tracking-wider text-slate-500 font-semibold">Points</th>
                <th className="text-center px-5 py-3 text-xs uppercase tracking-wider text-slate-500 font-semibold">Employee ID</th>
                <th className="text-right px-6 py-3 text-xs uppercase tracking-wider text-slate-500 font-semibold w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u._id} className="border-t border-slate-100 hover:bg-slate-50">
                  {editId === u._id ? (
                    <>
                      <td className="px-4 py-2">
                        <input
                          type="text" value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="email" value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          className="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text" value={editForm.department}
                          onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                          className="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                      </td>
                      <td className="text-center px-4 py-2 font-semibold text-cyan-600">{u.points}</td>
                      <td className="px-4 py-2">
                        <input
                          type="text" value={editForm.employee_id}
                          onChange={(e) => setEditForm({ ...editForm, employee_id: e.target.value })}
                          className="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                      </td>
                      <td className="text-center px-4 py-2">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={handleEditSave}
                            className="text-xs bg-green-50 hover:bg-green-100 text-green-700 px-2 py-1 rounded transition-colors font-medium"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleEditCancel}
                            className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-5 py-3.5 font-bold text-slate-800">{u.name}</td>
                      <td className="px-5 py-3.5 text-slate-500">{u.email}</td>
                      <td className="px-5 py-3.5">
                        <span className="bg-cyan-50 text-cyan-700 border border-cyan-200 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider whitespace-nowrap">{u.department}</span>
                      </td>
                      <td className="text-center px-5 py-3.5 font-bold text-cyan-600">{u.points}</td>
                      <td className="text-center px-5 py-3.5 text-slate-600">{u.employee_id || '-'}</td>
                      <td className="text-right px-6 py-3.5 cursor-default">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => handleEditStart(u)}
                            className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(u._id, u.name)}
                            className="text-xs font-bold text-red-600 hover:text-red-800 transition-colors cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        
        {filtered.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 bg-white text-xs text-slate-500 flex justify-between items-center">
             <span>Showing {filtered.length} of {users.length} total records</span>
             <div className="flex gap-2">
               <button className="px-3 py-1.5 border border-slate-200 rounded text-slate-400 hover:bg-slate-50 disabled:opacity-50" disabled>&lt;</button>
               <button className="px-3 py-1.5 border border-slate-200 rounded text-slate-400 hover:bg-slate-50 disabled:opacity-50" disabled>&gt;</button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserUploadPage;
