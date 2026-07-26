import React, { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { Search, Filter, Calendar, Monitor, ShieldAlert, ShieldCheck, Users, Clock, X, Building2 } from 'lucide-react';

const EmployeeReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [updating, setUpdating] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [outsiderFilter, setOutsiderFilter] = useState('all'); // 'all' | 'simulation' | 'outsider'
  const [visitedFilter, setVisitedFilter] = useState('all'); // 'all' | 'visited' | 'pending'

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

  const handleToggleVisited = async (reportId, currentStatus, e) => {
    if (e) e.stopPropagation();
    try {
      setUpdating(true);
      await api.put(`/analytics/employee-reports/${reportId}/visited`);
      setReports(reports.map(r => r._id === reportId ? { ...r, report_visited: !currentStatus } : r));
      if (selectedReport && selectedReport._id === reportId) {
        setSelectedReport({ ...selectedReport, report_visited: !currentStatus });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

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

      // Visited filter
      if (visitedFilter === 'visited' && !report.report_visited) return false;
      if (visitedFilter === 'pending' && report.report_visited) return false;

      return true;
    });
  }, [reports, searchQuery, selectedDepartment, dateRange, outsiderFilter, visitedFilter]);

  const activeFilterCount = [
    searchQuery, 
    selectedDepartment !== 'all', 
    dateRange !== 'all', 
    outsiderFilter !== 'all',
    visitedFilter !== 'all'
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedDepartment('all');
    setDateRange('all');
    setOutsiderFilter('all');
    setVisitedFilter('all');
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
          <h1 className="page-title">User Phishing Reports</h1>
          <p className="text-sm text-slate-500">Monitor and review phishing emails reported by employees.</p>
        </div>
        <div className="flex items-center">
          <div className="px-4 py-1.5 bg-cyan-50 rounded-full flex items-center gap-2 border border-cyan-100">
            <Users className="w-3.5 h-3.5 text-cyan-700" />
            <span className="text-xs font-bold text-cyan-800">{filteredReports.length} of {reports.length} reports</span>
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
      <div className="bg-white border text-center border-slate-200 rounded-xl p-5 mb-6 shadow-sm text-left">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="font-bold text-slate-400 text-xs tracking-widest uppercase">Filters</span>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-4 mb-2 items-center">
          
          <div className="flex gap-4 flex-grow w-full">
            {/* Search */}
            <div className="relative flex-grow">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                className="w-full pl-11 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-600"
                placeholder="Search by name, email, or..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Department */}
            <div className="relative w-48">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full pl-11 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-700 font-medium"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>

            {/* Date Range */}
            <div className="relative w-48">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full pl-11 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-700 font-medium"
              >
                <option value="all">All Time</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>

          {/* Outsider Toggle */}
          <div className="shrink-0 w-[400px]">
            <div className="flex bg-[#f1f5f9] rounded-lg overflow-hidden border border-slate-200 p-1 gap-1">
              <button
                onClick={() => setOutsiderFilter('all')}
                className={`flex-1 px-3 py-1.5 text-xs font-bold transition-all duration-200 rounded-md ${
                  outsiderFilter === 'all'
                    ? 'bg-[#4dd0e1] text-[#006064] shadow-sm'
                    : 'text-slate-500 hover:bg-white/50'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setOutsiderFilter('simulation')}
                className={`flex-1 px-3 py-1.5 text-xs font-bold transition-all duration-200 rounded-md flex items-center justify-center gap-1.5 ${
                  outsiderFilter === 'simulation'
                    ? 'bg-[#4dd0e1] text-[#006064] shadow-sm'
                    : 'text-slate-500 hover:bg-white/50'
                }`}
              >
                <ShieldCheck className="w-3 h-3" />
                Simulation
              </button>
              <button
                onClick={() => setOutsiderFilter('outsider')}
                className={`flex-1 px-3 py-1.5 text-xs font-bold transition-all duration-200 rounded-md flex items-center justify-center gap-1.5 ${
                  outsiderFilter === 'outsider'
                    ? 'bg-[#4dd0e1] text-[#006064] shadow-sm'
                    : 'text-slate-500 hover:bg-white/50'
                }`}
              >
                <ShieldAlert className="w-3 h-3" />
                Outsider
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Report Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-semibold text-slate-800">Report Details</h2>
              <button onClick={() => setSelectedReport(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Employee</p>
                <p className="font-semibold text-slate-700">{selectedReport.user_id?.name || 'Unknown'}</p>
                <p className="text-sm text-slate-500">{selectedReport.user_id?.email}</p>
              </div>
              {selectedReport.report_subject && (
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Email Title</p>
                  <p className="font-semibold text-slate-700">{selectedReport.report_subject}</p>
                </div>
              )}
              {selectedReport.report_link && (
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Reported Link</p>
                  <div className="bg-slate-50 p-3 rounded border border-slate-100 text-sm text-slate-700 break-all">
                    {selectedReport.report_link}
                  </div>
                </div>
              )}
              {selectedReport.report_time && (
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Reported Time of Incident</p>
                  <p className="font-semibold text-slate-700">
                    {new Date(selectedReport.report_time).toLocaleDateString()} at {new Date(selectedReport.report_time).toLocaleTimeString()}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Description</p>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm text-slate-700 whitespace-pre-wrap">
                  {selectedReport.report_description || 'No description provided.'}
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button 
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reports Table */}
      <div className="bg-white border text-left border-slate-200 rounded-xl mb-8 shadow-sm overflow-hidden">
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
              <thead className="bg-[#eff2f9]">
                <tr>
                  <th className="px-5 py-3.5 text-left font-bold text-slate-500 text-xs uppercase tracking-wider">Employee</th>
                  <th className="px-5 py-3.5 text-left font-bold text-slate-500 text-xs uppercase tracking-wider">Department</th>
                  <th className="px-5 py-3.5 text-left font-bold text-slate-500 text-xs uppercase tracking-wider">Campaign</th>
                  <th className="px-5 py-3.5 text-left font-bold text-slate-500 text-xs uppercase tracking-wider">Type</th>
                  <th className="px-5 py-3.5 text-left font-bold text-slate-500 text-xs uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-left font-bold text-slate-500 text-xs uppercase tracking-wider">Reported At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReports.map((report, index) => (
                  <tr
                    key={report._id}
                    onClick={() => setSelectedReport(report)}
                    className="hover:bg-slate-50 transition-colors duration-150 cursor-pointer"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#00796b] flex items-center justify-center text-white text-base font-medium shadow-sm">
                          {report.user_id?.name?.charAt(0)?.toLowerCase() || '?'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-700 text-[13px]">{report.user_id?.name || 'Unknown User'}</p>
                          <p className="text-xs text-slate-500">{report.user_id?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="flex w-fit items-center gap-1.5 px-2.5 py-1 bg-[#e0f7fa] text-teal-800 rounded-md text-[10px] font-bold uppercase tracking-wider">
                        <Monitor className="w-3 h-3" />
                        {report.user_id?.department || 'N/A'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className={`text-[13px] text-slate-600 font-medium ${!report.campaign_id ? 'italic text-slate-400' : ''}`}>
                         {report.campaign_id?.name || 'Unknown Campaign'}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      {report.campaign_id ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#e0e7ff] text-indigo-700 rounded-full text-[11px] font-bold">
                          <ShieldCheck className="w-3 h-3" />
                          Simulation
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-600 rounded-full text-[11px] font-bold">
                          <ShieldAlert className="w-3 h-3" />
                          Outsider
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                      <label className="flex items-center gap-2 cursor-pointer w-fit">
                        <input 
                          type="checkbox" 
                          checked={report.report_visited || false}
                          onChange={(e) => handleToggleVisited(report._id, report.report_visited, e)}
                          disabled={updating}
                          className="w-4 h-4 text-orange-500 rounded border-slate-300 focus:ring-transparent cursor-pointer"
                        />
                        <span className={`text-[13px] font-bold ${report.report_visited ? 'text-emerald-500' : 'text-orange-500'}`}>
                          {report.report_visited ? 'Reviewed' : 'Pending'}
                        </span>
                      </label>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-slate-600 text-[13px] font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(report.reported_at).toLocaleString()}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {filteredReports.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 bg-white text-xs font-bold text-slate-500 flex justify-between items-center">
             <span>Showing {filteredReports.length} of {reports.length} results</span>
             <div className="flex gap-2">
               <button className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded text-slate-400 hover:bg-slate-50 disabled:opacity-50" disabled>&lt;</button>
               <button className="w-8 h-8 flex items-center justify-center bg-[#00796b] text-white rounded">1</button>
               <button className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded text-slate-400 hover:bg-slate-50 disabled:opacity-50" disabled>&gt;</button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeReportsPage;
