import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Film,
  MapPin,
  Heart,
  Ticket,
  Bell,
  User as UserIcon,
  LogOut,
  ShieldAlert,
  Menu,
  X,
  Search,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useCity } from '../context/CityContext.tsx';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, isAdmin, logout, watchlist, notifications, unreadCount, markNotificationRead } = useAuth();
  const { city, setCity, availableCities } = useCity();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/movies?search=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-[#090d16]/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-red-500 flex items-center justify-center shadow-lg shadow-rose-900/40 group-hover:scale-105 transition">
              <Film className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-white font-['Outfit']">
                i<span className="text-rose-500">Movies</span>
              </span>
              <span className="hidden sm:block text-[10px] text-slate-400 font-medium tracking-wider uppercase -mt-1">
                Tickets Made Simple
              </span>
            </div>
          </Link>

          {/* City Selector */}
          <div className="relative hidden md:flex items-center text-sm text-slate-300 bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-1.5 hover:border-slate-700 transition">
            <MapPin className="w-4 h-4 text-rose-500 mr-2" />
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              aria-label="Select City"
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer pr-2"
            >
              {availableCities.map((c) => (
                <option key={c} value={c} className="bg-slate-900 text-white">
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Search */}
          <form onSubmit={handleSearchSubmit} className="hidden lg:flex flex-1 max-w-xs relative">
            <input
              type="text"
              placeholder="Search movies, actors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-800 rounded-full pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-rose-500 transition"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </form>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link
              to="/"
              className={`transition hover:text-rose-400 ${isActive('/') ? 'text-rose-500 font-semibold' : 'text-slate-300'}`}
            >
              Home
            </Link>
            <Link
              to="/movies"
              className={`transition hover:text-rose-400 ${isActive('/movies') ? 'text-rose-500 font-semibold' : 'text-slate-300'}`}
            >
              Movies
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  to="/my-bookings"
                  className={`flex items-center gap-1.5 transition hover:text-rose-400 ${isActive('/my-bookings') ? 'text-rose-500 font-semibold' : 'text-slate-300'}`}
                >
                  <Ticket className="w-4 h-4" />
                  My Bookings
                </Link>
                <Link
                  to="/watchlist"
                  className={`flex items-center gap-1.5 transition hover:text-rose-400 ${isActive('/watchlist') ? 'text-rose-500 font-semibold' : 'text-slate-300'}`}
                >
                  <Heart className="w-4 h-4" />
                  Watchlist
                  {watchlist.length > 0 && (
                    <span className="px-1.5 py-0.2 bg-rose-500/20 text-rose-400 text-[10px] rounded-full font-bold">
                      {watchlist.length}
                    </span>
                  )}
                </Link>
              </>
            )}
          </nav>

          {/* Right Action Icons & Auth */}
          <div className="flex items-center gap-3">
            {isAuthenticated && (
              <>
                {/* Admin Button */}
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25 text-xs font-semibold transition"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Admin Panel
                  </Link>
                )}

                {/* Notifications Bell */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowNotifications(!showNotifications);
                      setShowUserMenu(false);
                    }}
                    className="p-2 text-slate-300 hover:text-white rounded-lg bg-slate-900 border border-slate-800 relative transition"
                    title="Notifications"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-3 z-50">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                        <span className="text-xs font-bold text-white uppercase tracking-wider">Notifications</span>
                        <span className="text-[11px] text-slate-400">{notifications.length} total</span>
                      </div>
                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {notifications.length === 0 ? (
                          <div className="text-center py-6 text-xs text-slate-500">No notifications yet.</div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => markNotificationRead(n.id)}
                              className={`p-2.5 rounded-lg text-xs cursor-pointer transition ${
                                n.read ? 'bg-slate-950/60 text-slate-400' : 'bg-rose-950/30 border border-rose-900/30 text-slate-200'
                              }`}
                            >
                              <div className="font-semibold text-rose-400 mb-0.5">{n.title}</div>
                              <p className="text-[11px] leading-relaxed text-slate-300">{n.message}</p>
                              <div className="text-[9px] text-slate-500 mt-1">
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Avatar Menu */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowUserMenu(!showUserMenu);
                      setShowNotifications(false);
                    }}
                    className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
                  >
                    <img
                      src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                      alt={user?.username}
                      className="w-7 h-7 rounded-full object-cover border border-rose-500/50"
                    />
                    <span className="hidden sm:block text-xs font-semibold text-slate-200 max-w-[100px] truncate">
                      {user?.username}
                    </span>
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50">
                      <div className="px-3 py-2 border-b border-slate-800">
                        <p className="text-xs font-bold text-white truncate">{user?.username}</p>
                        <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 text-[9px] font-bold rounded bg-rose-500/20 text-rose-400 uppercase">
                          {user?.role}
                        </span>
                      </div>
                      <div className="py-1">
                        <Link
                          to="/profile"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 rounded-lg transition"
                        >
                          <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                          My Profile
                        </Link>
                        <Link
                          to="/my-bookings"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 rounded-lg transition"
                        >
                          <Ticket className="w-3.5 h-3.5 text-slate-400" />
                          My Bookings
                        </Link>
                        <Link
                          to="/watchlist"
                          onClick={() => setShowUserMenu(false)}
                          className="flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 rounded-lg transition"
                        >
                          <Heart className="w-3.5 h-3.5 text-slate-400" />
                          Watchlist ({watchlist.length})
                        </Link>
                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-2 px-3 py-2 text-xs text-amber-400 hover:bg-amber-950/40 rounded-lg transition"
                          >
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                            Admin Dashboard
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            logout();
                            navigate('/');
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:bg-rose-950/30 rounded-lg transition text-left mt-1 border-t border-slate-800/80"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {!isAuthenticated && (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white text-xs font-bold shadow-md shadow-rose-950 transition"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-3 pb-6 space-y-3">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search movies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </form>

          {/* City select mobile */}
          <div className="flex items-center justify-between text-xs py-2 border-b border-slate-800">
            <span className="text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-rose-500" /> City
            </span>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="bg-slate-950 text-white border border-slate-800 rounded px-2 py-1 text-xs"
            >
              {availableCities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-slate-200 py-1.5 hover:text-rose-400"
            >
              Home
            </Link>
            <Link
              to="/movies"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-slate-200 py-1.5 hover:text-rose-400"
            >
              Movies
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  to="/my-bookings"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-medium text-slate-200 py-1.5 hover:text-rose-400"
                >
                  My Bookings
                </Link>
                <Link
                  to="/watchlist"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-medium text-slate-200 py-1.5 hover:text-rose-400"
                >
                  Watchlist ({watchlist.length})
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-medium text-slate-200 py-1.5 hover:text-rose-400"
                >
                  Profile
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm font-medium text-amber-400 py-1.5 hover:underline"
                  >
                    Admin Dashboard
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
