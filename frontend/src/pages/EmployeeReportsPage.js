import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { Search, Filter, Calendar, Building2, ShieldAlert, ShieldCheck, Users, Clock, X } from 'lucide-react';

const EmployeeReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [outsiderFilter, setOutsiderFilter] = useState('all'); // 'all' | 'simulation' | 'outsider'

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get('/analytics/employee-reports');
        setReports(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch reports');
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  // Extract unique departments
  const departments = useMemo(() => {
    const depts = new Set(reports.map(r => r.user_id?.department).filter(Boolean));
    return Array.from(depts).sort();
  }, [reports]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const name = (report.user_id?.name || '').toLowerCase();
        const email = (report.user_id?.email || '').toLowerCase();
        const campaign = (report.campaign_id?.name || '').toLowerCase();
        if (!name.includes(q) && !email.includes(q) && !campaign.includes(q)) return false;
      }

      // Department filter
      if (selectedDepartment !== 'all' && report.user_id?.department !== selectedDepartment) return false;

      // Date range filter
      if (dateRange !== 'all' && report.reported_at) {
        const reportDate = new Date(report.reported_at);
        const now = new Date();
        if (dateRange === '24h') {
          if (now - reportDate > 24 * 60 * 60 * 1000) return false;
        } else if (dateRange === '7d') {
          if (now - reportDate > 7 * 24 * 60 * 60 * 1000) return false;
        } else if (dateRange === '30d') {
          if (now - reportDate > 30 * 24 * 60 * 60 * 1000) return false;
        }
      }

      // Outsider filter
      if (outsiderFilter === 'simulation' && !report.campaign_id) return false;
      if (outsiderFilter === 'outsider' && report.campaign_id) return false;

      return true;
    });
  }, [reports, searchQuery, selectedDepartment, dateRange, outsiderFilter]);

  const activeFilterCount = [
    searchQuery, 
    selectedDepartment !== 'all', 
    dateRange !== 'all', 
    outsiderFilter !== 'all'
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedDepartment('all');
    setDateRange('all');
    setOutsiderFilter('all');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-600 mx-auto mb-3"></div>
          <p className="text-slate-500">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            User Phishing Reports
          </h1>
          <p className="text-slate-500 mt-1">Monitor and review phishing emails reported by employees.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="glass-card-static px-4 py-2 flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-600" />
            <span className="text-sm font-semibold text-slate-700">{filteredReports.length}</span>
            <span className="text-xs text-slate-500">of {reports.length} reports</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
          <X className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Filters Section */}
      <div className="glass-card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="font-medium text-slate-700 text-sm">Filters</span>
            {activeFilterCount > 0 && (
              <span className="bg-cyan-100 text-cyan-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                {activeFilterCount} active
              </span>
            )}
          </div>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors">
              Clear All
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              className="glass-input pl-10 w-full"
              placeholder="Search by name, email, or campaign..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Department */}
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="glass-input pl-10 w-full appearance-none cursor-pointer"
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="glass-input pl-10 w-full appearance-none cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>

          {/* Outsider Toggle */}
          <div>
            <div className="flex rounded-xl overflow-hidden border border-slate-200 h-full">
              <button
                onClick={() => setOutsiderFilter('all')}
                className={`flex-1 px-3 py-2 text-xs font-medium transition-all duration-200 ${
                  outsiderFilter === 'all'
                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow-inner'
                    : 'bg-white/60 text-slate-600 hover:bg-slate-50'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setOutsiderFilter('simulation')}
                className={`flex-1 px-3 py-2 text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1 ${
                  outsiderFilter === 'simulation'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-inner'
                    : 'bg-white/60 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Simulation
              </button>
              <button
                onClick={() => setOutsiderFilter('outsider')}
                className={`flex-1 px-3 py-2 text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1 ${
                  outsiderFilter === 'outsider'
                    ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-inner'
                    : 'bg-white/60 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Outsider
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="glass-card overflow-hidden">
        {filteredReports.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-600 mb-1">No Reports Found</h3>
            <p className="text-slate-400 text-sm">
              {reports.length > 0
                ? 'Try adjusting your filters to see more results.'
                : 'No employees have submitted phishing reports yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-r from-slate-50 to-slate-100/50 border-b border-slate-200">
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-600 text-xs uppercase tracking-wider">Employee</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-600 text-xs uppercase tracking-wider">Department</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-600 text-xs uppercase tracking-wider">Campaign</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-600 text-xs uppercase tracking-wider">Type</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-600 text-xs uppercase tracking-wider">Reported At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReports.map((report, index) => (
                  <tr
                    key={report._id}
                    className="hover:bg-cyan-50/30 transition-colors duration-150"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                          {report.user_id?.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{report.user_id?.name || 'Unknown User'}</p>
                          <p className="text-xs text-slate-400">{report.user_id?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-medium">
                        <Building2 className="w-3 h-3" />
                        {report.user_id?.department || 'N/A'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-700">{report.campaign_id?.name || 'Unknown Campaign'}</p>
                    </td>
                    <td className="px-5 py-4">
                      {report.campaign_id ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                          <ShieldCheck className="w-3 h-3" />
                          Simulation
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium">
                          <ShieldAlert className="w-3 h-3" />
                          Outsider
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-sm">{new Date(report.reported_at).toLocaleString()}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeReportsPage;
