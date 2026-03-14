import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const LeaderboardPage = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [deptRanking, setDeptRanking] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [lbRes, deptRes] = await Promise.all([
          api.get('/gamification/leaderboard'),
          api.get('/gamification/department-ranking')
        ]);
        setLeaderboard(lbRes.data);
        setDeptRanking(deptRes.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><p>Loading...</p></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Security Awareness Leaderboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Employees */}
        <div className="bg-white rounded-xl shadow">
          <div className="px-5 py-4 border-b">
            <h2 className="text-lg font-semibold text-slate-800">Top Security-Aware Employees</h2>
          </div>
          <div className="divide-y">
            {leaderboard.length === 0 ? (
              <p className="px-5 py-8 text-center text-slate-400">No employee data yet</p>
            ) : (
              leaderboard.slice(0, 10).map((user, i) => (
                <div key={user._id} className="flex items-center px-5 py-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-4 ${
                    i === 0 ? 'bg-yellow-400 text-yellow-900' :
                    i === 1 ? 'bg-slate-300 text-slate-700' :
                    i === 2 ? 'bg-orange-300 text-orange-800' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-800">{user.name}</p>
                    <p className="text-xs text-slate-400">{user.department} &middot; {user.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-cyan-600">{user.points}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      user.security_level === 'Security Champion' ? 'bg-green-100 text-green-700' :
                      user.security_level === 'Aware' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>{user.security_level}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Department Ranking */}
        <div className="bg-white rounded-xl shadow">
          <div className="px-5 py-4 border-b">
            <h2 className="text-lg font-semibold text-slate-800">Department Security Ranking</h2>
          </div>
          {deptRanking.length > 0 ? (
            <>
              <div className="p-5">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={deptRanking.map(d => ({ name: d.department, 'Avg Points': d.avg_points }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="Avg Points" fill="#0ea5e9" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="divide-y">
                {deptRanking.map((dept, i) => (
                  <div key={dept.department} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center">
                      <span className="w-6 text-center text-sm font-bold text-slate-400 mr-3">#{i+1}</span>
                      <span className="font-medium text-slate-800">{dept.department}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-cyan-600">{dept.avg_points} avg pts</p>
                      <p className="text-xs text-slate-400">{dept.total_users} employees</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="px-5 py-8 text-center text-slate-400">No department data</p>
          )}
        </div>
      </div>

      {/* Score Rules */}
      <div className="bg-white rounded-xl shadow p-5">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Scoring Rules</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ScoreRule action="Report suspicious email" points="+10" color="text-green-600" />
          <ScoreRule action="Ignore phishing link" points="+5" color="text-green-600" />
          <ScoreRule action="Click phishing link" points="-5" color="text-red-600" />
          <ScoreRule action="Submit credentials" points="-10" color="text-red-600" />
        </div>
        <div className="mt-4 border-t pt-4">
          <p className="text-sm font-medium text-slate-700 mb-2">Security Levels:</p>
          <div className="flex flex-wrap gap-3">
            <span className="bg-red-100 text-red-700 text-sm px-3 py-1 rounded-full">0-20 pts: Beginner</span>
            <span className="bg-yellow-100 text-yellow-700 text-sm px-3 py-1 rounded-full">21-50 pts: Aware</span>
            <span className="bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full">51-100 pts: Security Champion</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ScoreRule = ({ action, points, color }) => (
  <div className="bg-slate-50 rounded-lg p-3 text-center">
    <p className={`text-xl font-bold ${color}`}>{points}</p>
    <p className="text-xs text-slate-600 mt-1">{action}</p>
  </div>
);

export default LeaderboardPage;
