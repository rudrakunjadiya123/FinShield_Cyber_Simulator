import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard, Target, FileText, Users, GraduationCap,
  Trophy, ClipboardCheck, Shield, User, LogOut, Menu, X, ChevronDown
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const navLinks = {
    admin: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/campaigns', label: 'Campaigns', icon: Target },
      { to: '/templates', label: 'Templates', icon: FileText },
      { to: '/users', label: 'Users', icon: Users },
      { to: '/training', label: 'Training', icon: GraduationCap },
      { to: '/employee-reports', label: 'User Reports', icon: ClipboardCheck },
    ],
    cybersecurity: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/templates', label: 'Templates', icon: FileText },
      { to: '/training', label: 'Training', icon: GraduationCap },
      { to: '/employee-reports', label: 'User Reports', icon: ClipboardCheck },
    ],
    analyst: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
    employee: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/training', label: 'Training', icon: GraduationCap },
    ],
  };

  const links = navLinks[user.role] || [];

  return (
    <>
      <nav className="glass-nav sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <Link to="/dashboard" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-shadow">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-white tracking-tight hidden sm:block">
                  Fin<span className="text-cyan-400">Shield</span>
                </span>
              </Link>
            </div>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-1">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 relative group ${
                      isActive
                        ? 'bg-white/10 text-cyan-300 shadow-inner'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                    {isActive && (
                      <span className="absolute -bottom-[1px] left-3 right-3 h-0.5 bg-gradient-to-r from-cyan-400 to-indigo-400 rounded-full" />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-3">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleTheme}
                className="relative w-12 h-6 rounded-full bg-white/10 hover:bg-white/15 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 flex items-center border border-white/10"
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                <div
                  className={`absolute w-5 h-5 rounded-full transition-all duration-300 flex items-center justify-center text-[10px] ${
                    darkMode
                      ? 'translate-x-[26px] bg-indigo-500 shadow-lg shadow-indigo-500/30'
                      : 'translate-x-0.5 bg-amber-400 shadow-lg shadow-amber-400/30'
                  }`}
                >
                  {darkMode ? '🌙' : '☀️'}
                </div>
              </button>

              {/* Profile Dropdown */}
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-white/5 transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                    {user.name?.charAt(0)}
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-sm font-medium text-white leading-none">{user.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                      {user.organization_name && <span>{user.organization_name}</span>}
                      <span className="bg-cyan-500/20 text-cyan-300 px-1.5 py-px rounded text-[10px] font-semibold uppercase tracking-wider">{user.role}</span>
                    </p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
                </button>

                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 mt-2 w-52 z-50 rounded-xl border border-white/10 bg-slate-800/95 backdrop-blur-xl shadow-xl py-1.5 animate-fade-in-up">
                      <div className="px-4 py-2.5 border-b border-white/5">
                        <p className="text-sm font-medium text-white">{user.name}</p>
                        <p className="text-xs text-slate-400">{user.email}</p>
                      </div>
                      <Link
                        to="/profile"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
                      >
                        <User className="w-4 h-4" />
                        Profile
                      </Link>
                      <button
                        onClick={() => { setProfileOpen(false); handleLogout(); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-white/10 text-white transition-colors"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 top-16 z-40 bg-slate-900/95 backdrop-blur-xl">
          <div className="px-4 py-4 space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-300'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {link.label}
                </Link>
              );
            })}
            <div className="border-t border-white/10 mt-3 pt-3 space-y-1">
              <Link
                to="/profile"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-base text-slate-300 hover:bg-white/5 hover:text-white transition-all"
              >
                <User className="w-5 h-5" />
                Profile
              </Link>
              <button
                onClick={() => { setMobileOpen(false); handleLogout(); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base text-red-400 hover:bg-red-500/10 transition-all"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
