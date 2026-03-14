import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const navLinks = {
    admin: [
      { to: '/dashboard', label: 'Dashboard' },
      { to: '/campaigns', label: 'Campaigns' },
      { to: '/templates', label: 'Templates' },
      { to: '/users', label: 'Users' },
      { to: '/analytics', label: 'Analytics' },
      { to: '/leaderboard', label: 'Leaderboard' },
    ],
    cybersecurity: [
      { to: '/dashboard', label: 'Dashboard' },
      { to: '/templates', label: 'Templates' },
      { to: '/analytics', label: 'Analytics' },
      { to: '/leaderboard', label: 'Leaderboard' },
    ],
    analyst: [
      { to: '/dashboard', label: 'Dashboard' },
      { to: '/analytics', label: 'Analytics' },
      { to: '/leaderboard', label: 'Leaderboard' },
    ],
    employee: [
      { to: '/dashboard', label: 'Dashboard' },
    ],
  };

  const links = navLinks[user.role] || [];

  return (
    <nav className="bg-slate-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <Link to="/dashboard" className="text-xl font-bold text-cyan-400">
              FinShield
            </Link>
            <div className="hidden md:flex space-x-1">
              {links.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-700 hover:text-cyan-300 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-slate-300">{user.name}</p>
              <p className="text-xs text-slate-400">
                {user.organization_name && <span className="mr-2">{user.organization_name}</span>}
                <span className="bg-cyan-600 px-2 py-0.5 rounded-full">{user.role}</span>
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded text-sm font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
