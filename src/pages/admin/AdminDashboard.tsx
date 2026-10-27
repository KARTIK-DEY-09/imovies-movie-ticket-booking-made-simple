import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldAlert,
  TrendingUp,
  DollarSign,
  Ticket,
  Film,
  Building,
  Users,
  Calendar,
  Plus,
  Trash2,
  Edit,
  Eye,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Clock,
  Star,
  RefreshCw,
  Search,
} from 'lucide-react';
import { apiRequest } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';

export const AdminDashboard: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'overview' | 'movies' | 'theatres' | 'shows' | 'bookings' | 'users' | 'reviews' | 'reports'>('overview');
  
  // Dashboard state
  const [stats, setStats] = useState<any>(null);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [popularMovies, setPopularMovies] = useState<any[]>([]);
  const [theatreRevenue, setTheatreRevenue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Tab specific data
  const [moviesList, setMoviesList] = useState<any[]>([]);
  const [theatresList, setTheatresList] = useState<any[]>([]);
  const [showsList, setShowsList] = useState<any[]>([]);
  const [allBookingsList, setAllBookingsList] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [reportsData, setReportsData] = useState<any>(null);

  // Modals
  const [showAddMovieModal, setShowAddMovieModal] = useState(false);
  const [showAddTheatreModal, setShowAddTheatreModal] = useState(false);
  const [showAddShowModal, setShowAddShowModal] = useState(false);

  // Forms State
  const [movieForm, setMovieForm] = useState({
    title: '',
    description: '',
    genre: 'Action, Thriller',
    language: 'Hindi',
    durationMinutes: 150,
    certification: 'U/A',
    director: '',
    cast: '',
    posterUrl: '',
    trailerUrl: '',
    rating: 4.5,
    status: 'now-showing',
  });

  const [theatreForm, setTheatreForm] = useState({
    name: '',
    location: '',
    address: '',
    city: 'Mumbai',
    screens: 5,
  });

  const [showForm, setShowForm] = useState({
    movieId: '',
    theatreId: '',
    screenNumber: 1,
    showDate: new Date().toISOString().split('T')[0],
    startTime: '18:00',
    standardPrice: 200,
    premiumPrice: 320,
    reclinerPrice: 500,
  });

  const [formError, setFormError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // 1. Load Overview Stats
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<any>('/admin/dashboard');
      setStats(data.stats);
      setRecentBookings(data.recentBookings || []);
      setPopularMovies(data.popularMovies || []);
      setTheatreRevenue(data.theatreRevenue || []);
    } catch (err: any) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    fetchDashboardData();
  }, [isAdmin]);

  // Load data according to active tab
  useEffect(() => {
    async function loadTabData() {
      try {
        if (activeTab === 'movies') {
          const res = await apiRequest<{ movies: any[] }>('/movies?limit=100');
          setMoviesList(res.movies || []);
        } else if (activeTab === 'theatres') {
          const res = await apiRequest<{ theatres: any[] }>('/theatres');
          setTheatresList(res.theatres || []);
        } else if (activeTab === 'shows') {
          const res = await apiRequest<{ shows: any[] }>('/shows');
          setShowsList(res.shows || []);
          // Also pre-fetch movies and theatres for show form dropdowns
          const mRes = await apiRequest<{ movies: any[] }>('/movies?limit=100');
          setMoviesList(mRes.movies || []);
          const tRes = await apiRequest<{ theatres: any[] }>('/theatres');
          setTheatresList(tRes.theatres || []);
        } else if (activeTab === 'bookings') {
          const res = await apiRequest<{ bookings: any[] }>('/admin/bookings');
          setAllBookingsList(res.bookings || []);
        } else if (activeTab === 'users') {
          const res = await apiRequest<{ users: any[] }>('/admin/users');
          setUsersList(res.users || []);
        } else if (activeTab === 'reviews') {
          const res = await apiRequest<{ reviews: any[] }>('/admin/reviews');
          setReviewsList(res.reviews || []);
        } else if (activeTab === 'reports') {
          const res = await apiRequest<any>('/admin/reports');
          setReportsData(res);
        }
      } catch (err) {
        console.error('Failed to load tab data:', err);
      }
    }

    if (isAdmin) {
      loadTabData();
    }
  }, [activeTab, isAdmin]);

  // Form Handlers
  const handleCreateMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setFormError('');
      await apiRequest('/movies', {
        method: 'POST',
        body: JSON.stringify(movieForm),
      });
      setShowAddMovieModal(false);
      setActionSuccess('Movie added successfully!');
      setTimeout(() => setActionSuccess(''), 4000);
      const res = await apiRequest<{ movies: any[] }>('/movies?limit=100');
      setMoviesList(res.movies || []);
      fetchDashboardData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create movie.');
    }
  };

  const handleCreateTheatre = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setFormError('');
      await apiRequest('/theatres', {
        method: 'POST',
        body: JSON.stringify(theatreForm),
      });
      setShowAddTheatreModal(false);
      setActionSuccess('Theatre added successfully!');
      setTimeout(() => setActionSuccess(''), 4000);
      const res = await apiRequest<{ theatres: any[] }>('/theatres');
      setTheatresList(res.theatres || []);
      fetchDashboardData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create theatre.');
    }
  };

  const handleCreateShow = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setFormError('');
      await apiRequest('/shows', {
        method: 'POST',
        body: JSON.stringify({
          movieId: showForm.movieId,
          theatreId: showForm.theatreId,
          screenNumber: showForm.screenNumber,
          showDate: showForm.showDate,
          startTime: showForm.startTime,
          pricing: {
            standard: showForm.standardPrice,
            premium: showForm.premiumPrice,
            recliner: showForm.reclinerPrice,
          },
        }),
      });
      setShowAddShowModal(false);
      setActionSuccess('Show schedule created with fresh seat inventory!');
      setTimeout(() => setActionSuccess(''), 4000);
      const res = await apiRequest<{ shows: any[] }>('/shows');
      setShowsList(res.shows || []);
      fetchDashboardData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create show.');
    }
  };

  const handleDeleteMovie = async (movieId: string) => {
    if (!confirm('Are you sure you want to delete or deactivate this movie?')) return;
    try {
      await apiRequest(`/movies/${movieId}`, { method: 'DELETE' });
      setMoviesList((prev) => prev.filter((m) => m.id !== movieId));
      setActionSuccess('Movie updated/removed.');
      setTimeout(() => setActionSuccess(''), 3000);
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message || 'Error deleting movie');
    }
  };

  const handleDeleteShow = async (showId: string) => {
    if (!confirm('Are you sure you want to cancel this show?')) return;
    try {
      await apiRequest(`/shows/${showId}`, { method: 'DELETE' });
      setShowsList((prev) => prev.filter((s) => s.id !== showId));
      setActionSuccess('Show cancelled.');
      setTimeout(() => setActionSuccess(''), 3000);
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message || 'Error deleting show');
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await apiRequest(`/reviews/${reviewId}`, { method: 'DELETE' });
      setReviewsList((prev) => prev.filter((r) => r.id !== reviewId));
      setActionSuccess('Review moderated/removed.');
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Error deleting review');
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Admin Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
              <ShieldAlert className="w-4 h-4" />
              <span>Administrative Control Center</span>
            </div>
            <h1 className="text-3xl font-black text-white font-['Outfit']">
              iMovies Master Dashboard
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time database aggregated analytics, ticket sales, shows & inventory management
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchDashboardData}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 flex items-center gap-1.5 transition"
              title="Refresh Stats"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync DB</span>
            </button>
            <Link
              to="/"
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-md"
            >
              Back to Storefront
            </Link>
          </div>
        </div>

        {actionSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-900 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Top Metric Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-[#0c1220] border border-slate-800 p-4 rounded-2xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Gross Revenue</span>
              <div className="text-xl font-black text-emerald-400">₹{stats.totalRevenue.toLocaleString()}</div>
              <span className="text-[10px] text-slate-400">{stats.confirmedBookingsCount} paid orders</span>
            </div>

            <div className="bg-[#0c1220] border border-slate-800 p-4 rounded-2xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Tickets Sold</span>
              <div className="text-xl font-black text-rose-400">{stats.totalTicketsSold}</div>
              <span className="text-[10px] text-slate-400">across all screens</span>
            </div>

            <div className="bg-[#0c1220] border border-slate-800 p-4 rounded-2xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Catalogue Movies</span>
              <div className="text-xl font-black text-white">{stats.moviesCount}</div>
              <span className="text-[10px] text-slate-400">titles active</span>
            </div>

            <div className="bg-[#0c1220] border border-slate-800 p-4 rounded-2xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Theatres</span>
              <div className="text-xl font-black text-white">{stats.theatresCount}</div>
              <span className="text-[10px] text-slate-400">multiplex venues</span>
            </div>

            <div className="bg-[#0c1220] border border-slate-800 p-4 rounded-2xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Scheduled Shows</span>
              <div className="text-xl font-black text-white">{stats.showsCount}</div>
              <span className="text-[10px] text-slate-400">seat grids ready</span>
            </div>

            <div className="bg-[#0c1220] border border-slate-800 p-4 rounded-2xl space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Users Registered</span>
              <div className="text-xl font-black text-amber-400">{stats.usersCount}</div>
              <span className="text-[10px] text-slate-400">customer accounts</span>
            </div>
          </div>
        )}

        {/* Tab Navigation Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800 text-xs font-bold scrollbar-none">
          {[
            { id: 'overview', label: 'Overview & Charts', icon: BarChart3 },
            { id: 'movies', label: `Manage Movies (${moviesList.length || stats?.moviesCount || 0})`, icon: Film },
            { id: 'theatres', label: `Theatres (${theatresList.length || stats?.theatresCount || 0})`, icon: Building },
            { id: 'shows', label: `Shows Schedule (${showsList.length || stats?.showsCount || 0})`, icon: Calendar },
            { id: 'bookings', label: 'All Bookings', icon: Ticket },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'reviews', label: 'Reviews', icon: Star },
            { id: 'reports', label: 'Sales Reports', icon: TrendingUp },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-xl whitespace-nowrap flex items-center gap-2 transition ${
                  activeTab === tab.id
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-950'
                    : 'bg-[#0c1220] text-slate-400 hover:text-white border border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Popular Movies by Revenue */}
              <div className="bg-[#0c1220] border border-slate-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Film className="w-4 h-4 text-rose-500" />
                  <span>Top Grossing Titles</span>
                </h3>
                <div className="space-y-3">
                  {popularMovies.length === 0 ? (
                    <div className="text-xs text-slate-500 py-4 text-center">No booking sales recorded yet.</div>
                  ) : (
                    popularMovies.slice(0, 5).map((m, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                        <div>
                          <div className="font-bold text-white">{m.title}</div>
                          <div className="text-[10px] text-slate-400">{m.tickets} tickets reserved</div>
                        </div>
                        <div className="text-right font-black text-emerald-400">
                          ₹{m.revenue.toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Theatre Revenue Breakdown */}
              <div className="bg-[#0c1220] border border-slate-800 rounded-2xl p-6 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Building className="w-4 h-4 text-amber-500" />
                  <span>Revenue by Multiplex Venue</span>
                </h3>
                <div className="space-y-3">
                  {theatreRevenue.length === 0 ? (
                    <div className="text-xs text-slate-500 py-4 text-center">No sales yet recorded across venues.</div>
                  ) : (
                    theatreRevenue.map((t, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                        <div>
                          <div className="font-bold text-white">{t.name}</div>
                          <div className="text-[10px] text-slate-400">{t.bookings} bookings processed</div>
                        </div>
                        <div className="text-right font-black text-rose-400">
                          ₹{t.revenue.toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Recent Bookings Table */}
            <div className="bg-[#0c1220] border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-500" />
                <span>Recent Transactions</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                      <th className="pb-3">Reference</th>
                      <th className="pb-3">Customer</th>
                      <th className="pb-3">Movie</th>
                      <th className="pb-3">Theatre & Show</th>
                      <th className="pb-3">Seats</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {recentBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-900/40">
                        <td className="py-3 font-mono font-bold text-white">{b.bookingRef}</td>
                        <td className="py-3">
                          <div className="font-bold text-slate-200">{b.userName}</div>
                          <div className="text-[10px] text-slate-500">{b.userEmail}</div>
                        </td>
                        <td className="py-3 text-white font-medium">{b.movieTitle}</td>
                        <td className="py-3">
                          <div>{b.theatreName}</div>
                          <div className="text-[10px] text-slate-400">{b.showDate} at {b.startTime}</div>
                        </td>
                        <td className="py-3 font-semibold text-rose-400">{b.seatIds?.join(', ')}</td>
                        <td className="py-3 font-bold text-white">₹{b.totalAmount}</td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              b.bookingStatus === 'confirmed'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            {b.bookingStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MANAGE MOVIES */}
        {activeTab === 'movies' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Catalogue Movies</h2>
                <p className="text-xs text-slate-400">Add, edit, or deactivate movies in the database</p>
              </div>
              <button
                onClick={() => setShowAddMovieModal(true)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Movie</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {moviesList.map((m) => (
                <div key={m.id} className="bg-[#0c1220] border border-slate-800 rounded-2xl p-4 flex gap-4 items-start shadow-md">
                  <img
                    src={m.posterUrl}
                    alt={m.title}
                    className="w-20 h-28 object-cover rounded-xl border border-slate-800 flex-shrink-0"
                  />
                  <div className="flex-1 space-y-1 text-xs">
                    <h3 className="font-bold text-white text-sm line-clamp-1">{m.title}</h3>
                    <p className="text-slate-400 text-[11px]">{m.language} • {m.certification}</p>
                    <p className="text-slate-500 text-[10px] line-clamp-2">{m.genre.join(', ')}</p>
                    <div className="flex items-center gap-2 pt-1 text-[10px]">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-400 font-bold">
                        ⭐ {m.rating}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded font-bold uppercase ${
                          m.status === 'now-showing'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                      <button
                        onClick={() => handleDeleteMovie(m.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition"
                        title="Delete or Deactivate"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <Link
                        to={`/movies/${m.id}`}
                        className="text-[10px] text-rose-400 hover:underline font-semibold"
                      >
                        View Page →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: MANAGE THEATRES */}
        {activeTab === 'theatres' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Theatres & Multiplexes</h2>
                <p className="text-xs text-slate-400">Configure screens, locations, and city coverage</p>
              </div>
              <button
                onClick={() => setShowAddTheatreModal(true)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Theatre</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {theatresList.map((t) => (
                <div key={t.id} className="bg-[#0c1220] border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-rose-400 font-bold text-[10px]">
                      {t.city}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold">Active</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">{t.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{t.location}</p>
                    <p className="text-[11px] text-slate-500 mt-1">{t.address}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                    <span>Screens: <strong className="text-white">{t.screens} screens</strong></span>
                    <span className="text-emerald-400 text-[10px] font-bold">Dolby Atmos Ready</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: MANAGE SHOWS */}
        {activeTab === 'shows' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">Shows Schedule</h2>
                <p className="text-xs text-slate-400">Schedule shows across screens with automatic conflict detection</p>
              </div>
              <button
                onClick={() => setShowAddShowModal(true)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition"
              >
                <Plus className="w-4 h-4" />
                <span>Schedule New Show</span>
              </button>
            </div>

            <div className="bg-[#0c1220] border border-slate-800 rounded-2xl overflow-hidden shadow-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 font-semibold uppercase text-[10px] tracking-wider bg-slate-950/60">
                      <th className="p-3.5">Movie</th>
                      <th className="p-3.5">Theatre</th>
                      <th className="p-3.5">Screen</th>
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5">Time</th>
                      <th className="p-3.5">Pricing</th>
                      <th className="p-3.5">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {showsList.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-900/40">
                        <td className="p-3.5 font-bold text-white">{s.movieTitle}</td>
                        <td className="p-3.5">{s.theatreName} ({s.theatreCity})</td>
                        <td className="p-3.5">Screen {s.screenNumber}</td>
                        <td className="p-3.5">{s.showDate}</td>
                        <td className="p-3.5 font-bold text-rose-400">{s.startTime}</td>
                        <td className="p-3.5 text-[11px]">
                          Std: ₹{s.pricing?.standard} • Prm: ₹{s.pricing?.premium} • Rec: ₹{s.pricing?.recliner}
                        </td>
                        <td className="p-3.5">
                          <button
                            onClick={() => handleDeleteShow(s.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition"
                            title="Cancel Show"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: ALL BOOKINGS */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">All Customer Bookings</h2>
            <div className="bg-[#0c1220] border border-slate-800 rounded-2xl overflow-hidden shadow-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 font-semibold uppercase text-[10px] tracking-wider bg-slate-950/60">
                      <th className="p-3.5">Ref</th>
                      <th className="p-3.5">User</th>
                      <th className="p-3.5">Movie</th>
                      <th className="p-3.5">Show</th>
                      <th className="p-3.5">Seats</th>
                      <th className="p-3.5">Paid</th>
                      <th className="p-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {allBookingsList.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-900/40">
                        <td className="p-3.5 font-mono font-bold text-white">{b.bookingRef}</td>
                        <td className="p-3.5">
                          <div>{b.userName}</div>
                          <div className="text-[10px] text-slate-500">{b.userEmail}</div>
                        </td>
                        <td className="p-3.5 font-bold text-white">{b.movieTitle}</td>
                        <td className="p-3.5">{b.theatreName} ({b.showDate} {b.startTime})</td>
                        <td className="p-3.5 text-rose-400 font-semibold">{b.seatIds?.join(', ')}</td>
                        <td className="p-3.5 font-bold text-emerald-400">₹{b.totalAmount}</td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              b.bookingStatus === 'confirmed'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            {b.bookingStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: USERS */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Registered Users & Patrons</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {usersList.map((u) => (
                <div key={u.id} className="bg-[#0c1220] border border-slate-800 rounded-2xl p-4 flex gap-3 items-center">
                  <img
                    src={u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                    alt={u.username}
                    className="w-12 h-12 rounded-full border border-slate-700 object-cover"
                  />
                  <div className="text-xs space-y-0.5">
                    <div className="font-bold text-white flex items-center gap-2">
                      <span>{u.username}</span>
                      <span className="text-[9px] uppercase font-bold text-rose-400 px-1.5 py-0.2 bg-rose-500/20 rounded">
                        {u.role}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">{u.email}</div>
                    <div className="text-[10px] text-slate-500">
                      Bookings: <strong className="text-white">{u.totalBookings}</strong> • Spent: <strong className="text-emerald-400">₹{u.totalSpent}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: REVIEWS MODERATION */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Movie Reviews Moderation</h2>
            <div className="space-y-3">
              {reviewsList.map((r) => (
                <div key={r.id} className="bg-[#0c1220] border border-slate-800 rounded-2xl p-4 flex items-start justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-white">{r.userName}</span>
                      <span className="text-rose-400 font-semibold">{r.movieTitle}</span>
                      <span className="text-amber-400 font-bold">⭐ {r.rating} / 5</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed text-xs">{r.comment}</p>
                    <span className="text-[10px] text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>

                  <button
                    onClick={() => handleDeleteReview(r.id)}
                    className="p-1.5 rounded-lg bg-rose-950/40 text-rose-400 hover:bg-rose-900/60 transition"
                    title="Delete inappropriate review"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 8: SALES REPORTS */}
        {activeTab === 'reports' && reportsData && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Financial & Ticket Sales Reports</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#0c1220] border border-slate-800 p-5 rounded-2xl">
                <span className="text-slate-500 text-xs font-bold uppercase">Net Gross Bookings</span>
                <div className="text-2xl font-black text-emerald-400 mt-1">
                  ₹{reportsData.summary?.grossSales?.toLocaleString()}
                </div>
              </div>
              <div className="bg-[#0c1220] border border-slate-800 p-5 rounded-2xl">
                <span className="text-slate-500 text-xs font-bold uppercase">Total Admissions</span>
                <div className="text-2xl font-black text-rose-400 mt-1">
                  {reportsData.summary?.netTickets} Seats
                </div>
              </div>
              <div className="bg-[#0c1220] border border-slate-800 p-5 rounded-2xl">
                <span className="text-slate-500 text-xs font-bold uppercase">Average Ticket Yield</span>
                <div className="text-2xl font-black text-white mt-1">
                  ₹{reportsData.summary?.avgTicketPrice}
                </div>
              </div>
            </div>

            <div className="bg-[#0c1220] border border-slate-800 rounded-2xl p-6">
              <h3 className="font-bold text-white text-sm mb-4">Daily Sales Aggregations</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 uppercase text-[10px] pb-2">
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Tickets Sold</th>
                      <th className="pb-2">Daily Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {reportsData.dailyReports?.map((d: any, idx: number) => (
                      <tr key={idx}>
                        <td className="py-2.5 font-bold text-white">{d.date}</td>
                        <td className="py-2.5 text-slate-300">{d.tickets} seats</td>
                        <td className="py-2.5 font-bold text-emerald-400">₹{d.revenue.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* MODAL: ADD MOVIE */}
      {showAddMovieModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white">Add New Movie to Catalogue</h3>
            {formError && <div className="text-xs text-rose-400">{formError}</div>}
            
            <form onSubmit={handleCreateMovie} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Movie Title</label>
                <input
                  type="text"
                  required
                  value={movieForm.title}
                  onChange={(e) => setMovieForm({ ...movieForm, title: e.target.value })}
                  placeholder="e.g. Inception 2"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Description / Storyline</label>
                <textarea
                  required
                  rows={3}
                  value={movieForm.description}
                  onChange={(e) => setMovieForm({ ...movieForm, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Genres (comma separated)</label>
                  <input
                    type="text"
                    value={movieForm.genre}
                    onChange={(e) => setMovieForm({ ...movieForm, genre: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Language</label>
                  <input
                    type="text"
                    value={movieForm.language}
                    onChange={(e) => setMovieForm({ ...movieForm, language: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    value={movieForm.durationMinutes}
                    onChange={(e) => setMovieForm({ ...movieForm, durationMinutes: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Certification</label>
                  <select
                    value={movieForm.certification}
                    onChange={(e) => setMovieForm({ ...movieForm, certification: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  >
                    <option value="U">U (Universal)</option>
                    <option value="U/A">U/A (Parental)</option>
                    <option value="A">A (Adults Only)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Status</label>
                  <select
                    value={movieForm.status}
                    onChange={(e) => setMovieForm({ ...movieForm, status: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  >
                    <option value="now-showing">Now Showing</option>
                    <option value="coming-soon">Coming Soon</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Poster Image URL</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={movieForm.posterUrl}
                  onChange={(e) => setMovieForm({ ...movieForm, posterUrl: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">YouTube Trailer URL</label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={movieForm.trailerUrl}
                  onChange={(e) => setMovieForm({ ...movieForm, trailerUrl: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddMovieModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold"
                >
                  Save Movie
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD THEATRE */}
      {showAddTheatreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Add Theatre / Multiplex</h3>
            {formError && <div className="text-xs text-rose-400">{formError}</div>}
            
            <form onSubmit={handleCreateTheatre} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Theatre Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cinepolis Mega Mall"
                  value={theatreForm.name}
                  onChange={(e) => setTheatreForm({ ...theatreForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Location / Mall</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Infinity Mall, Andheri West"
                  value={theatreForm.location}
                  onChange={(e) => setTheatreForm({ ...theatreForm, location: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">City</label>
                  <select
                    value={theatreForm.city}
                    onChange={(e) => setTheatreForm({ ...theatreForm, city: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  >
                    <option value="Mumbai">Mumbai</option>
                    <option value="Delhi-NCR">Delhi-NCR</option>
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Hyderabad">Hyderabad</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Total Screens</label>
                  <input
                    type="number"
                    min={1}
                    max={16}
                    value={theatreForm.screens}
                    onChange={(e) => setTheatreForm({ ...theatreForm, screens: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddTheatreModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold"
                >
                  Add Theatre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD SHOW */}
      {showAddShowModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white">Schedule New Show</h3>
            <p className="text-xs text-slate-400">
              Generates a brand-new real-time seating map with automatic screen clash prevention.
            </p>
            {formError && <div className="text-xs text-rose-400">{formError}</div>}

            <form onSubmit={handleCreateShow} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Select Movie</label>
                <select
                  required
                  value={showForm.movieId}
                  onChange={(e) => setShowForm({ ...showForm, movieId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                >
                  <option value="">-- Choose Movie --</option>
                  {moviesList.map((m) => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Select Theatre</label>
                <select
                  required
                  value={showForm.theatreId}
                  onChange={(e) => setShowForm({ ...showForm, theatreId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                >
                  <option value="">-- Choose Theatre --</option>
                  {theatresList.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.city})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Screen No.</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={showForm.screenNumber}
                    onChange={(e) => setShowForm({ ...showForm, screenNumber: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Show Date</label>
                  <input
                    type="date"
                    required
                    value={showForm.showDate}
                    onChange={(e) => setShowForm({ ...showForm, showDate: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">Start Time (24h)</label>
                  <input
                    type="time"
                    required
                    value={showForm.startTime}
                    onChange={(e) => setShowForm({ ...showForm, startTime: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <span className="block text-slate-400 font-bold mb-2">Ticket Pricing by Category (₹)</span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 text-[10px]">Standard (Rows F-H)</label>
                    <input
                      type="number"
                      value={showForm.standardPrice}
                      onChange={(e) => setShowForm({ ...showForm, standardPrice: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px]">Premium (Rows C-E)</label>
                    <input
                      type="number"
                      value={showForm.premiumPrice}
                      onChange={(e) => setShowForm({ ...showForm, premiumPrice: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px]">Recliner (Rows A-B)</label>
                    <input
                      type="number"
                      value={showForm.reclinerPrice}
                      onChange={(e) => setShowForm({ ...showForm, reclinerPrice: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold"
                >
                  Schedule Show & Seats
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
