import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Ticket,
  Calendar,
  Clock,
  MapPin,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Trash2,
  ChevronRight,
  Printer,
} from 'lucide-react';
import { apiRequest } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface UserBooking {
  id: string;
  bookingRef: string;
  movieId: string;
  theatreId: string;
  screenNumber: number;
  showDate: string;
  startTime: string;
  seatIds: string[];
  totalAmount: number;
  bookingStatus: 'confirmed' | 'cancelled' | 'pending';
  paymentStatus: 'paid' | 'refunded' | 'pending';
  paymentMethod: string;
  movieTitle: string;
  moviePoster: string;
  theatreName: string;
  theatreLocation: string;
  theatreCity: string;
  createdAt: string;
}

export const MyBookings: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState<UserBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelModalBooking, setCancelModalBooking] = useState<UserBooking | null>(null);
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    async function loadBookings() {
      try {
        setLoading(true);
        const data = await apiRequest<{ bookings: UserBooking[] }>('/bookings/my');
        setBookings(data.bookings || []);
      } catch (err) {
        console.error('Failed to load bookings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBookings();
  }, []);

  const handleCancelBooking = async () => {
    if (!cancelModalBooking) return;
    try {
      setCancellingId(cancelModalBooking.id);
      const res = await apiRequest<{ message: string; booking: UserBooking }>(`/bookings/${cancelModalBooking.id}/cancel`, {
        method: 'POST',
      });
      setBookings((prev) =>
        prev.map((b) => (b.id === cancelModalBooking.id ? { ...b, bookingStatus: 'cancelled', paymentStatus: 'refunded' } : b))
      );
      setCancelModalBooking(null);
      setActionMessage('Booking cancelled successfully. Seats have been freed.');
      setTimeout(() => setActionMessage(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to cancel booking.');
    } finally {
      setCancellingId(null);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  const upcomingBookings = bookings.filter(
    (b) => b.bookingStatus === 'confirmed' && b.showDate >= today
  );

  const pastBookings = bookings.filter(
    (b) => b.bookingStatus === 'cancelled' || b.showDate < today
  );

  const displayed = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white font-['Outfit']">My Bookings</h1>
            <p className="text-xs text-slate-400">View and manage your movie tickets, passes, and cancellation requests</p>
          </div>
          <Link
            to="/movies"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 text-white text-xs font-bold shadow-md shadow-rose-950 flex items-center gap-1.5 self-start"
          >
            <Ticket className="w-3.5 h-3.5" />
            Book More Tickets
          </Link>
        </div>

        {actionMessage && (
          <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-900 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Tab Toggle */}
        <div className="flex items-center gap-3 border-b border-slate-800">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`pb-3 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
              activeTab === 'upcoming'
                ? 'border-rose-500 text-white'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <span>Upcoming Shows</span>
            <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px]">
              {upcomingBookings.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`pb-3 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
              activeTab === 'past'
                ? 'border-rose-500 text-white'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <span>Past & Cancelled</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">
              {pastBookings.length}
            </span>
          </button>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 bg-slate-900/60 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : displayed.length === 0 ? (
          <div className="p-16 text-center bg-slate-900/30 rounded-3xl border border-slate-800">
            <Ticket className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">No {activeTab} bookings found</h3>
            <p className="text-xs text-slate-400 mt-1">
              {activeTab === 'upcoming'
                ? "You don't have any upcoming shows booked right now."
                : "You don't have any past or cancelled tickets."}
            </p>
            <Link
              to="/movies"
              className="mt-4 inline-block px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold"
            >
              Browse Now Showing
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {displayed.map((b) => (
              <div
                key={b.id}
                className="bg-[#0e1424] border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700 transition flex flex-col md:flex-row gap-5 items-start md:items-center justify-between shadow-lg"
              >
                
                {/* Poster & Details */}
                <div className="flex items-start gap-4 flex-1">
                  <img
                    src={b.moviePoster || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=200'}
                    alt={b.movieTitle}
                    className="w-16 h-24 object-cover rounded-xl border border-slate-800 flex-shrink-0"
                  />
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">{b.movieTitle}</h3>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          b.bookingStatus === 'confirmed'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {b.bookingStatus}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                      <span>{b.theatreName} (Screen {b.screenNumber})</span>
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(b.showDate).toLocaleDateString([], {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-bold text-white">
                        <Clock className="w-3.5 h-3.5 text-rose-400" />
                        {b.startTime}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 pt-1">
                      Seats:{' '}
                      <strong className="text-white">
                        {b.seatIds ? b.seatIds.join(', ') : 'None'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Right side: Ref, Total, Actions */}
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-slate-800 gap-3">
                  <div className="text-left md:text-right">
                    <div className="text-[10px] font-mono text-slate-500">REF: {b.bookingRef}</div>
                    <div className="text-sm font-black text-white">₹{b.totalAmount}</div>
                    <div className="text-[10px] text-slate-400">{b.paymentStatus}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/booking-success/${b.id}`, { state: { booking: b } })}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-white flex items-center gap-1.5 transition"
                    >
                      <Eye className="w-3.5 h-3.5 text-rose-500" />
                      <span>View Pass</span>
                    </button>

                    {b.bookingStatus === 'confirmed' && (
                      <button
                        onClick={() => setCancelModalBooking(b)}
                        className="px-3 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/60 text-xs font-semibold text-rose-400 transition"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>

      {/* Cancellation Confirmation Modal */}
      {cancelModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-500">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Confirm Ticket Cancellation</h3>
            </div>
            
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to cancel your booking for <strong className="text-white">{cancelModalBooking.movieTitle}</strong>?
            </p>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
              <div>Ref: <span className="font-mono text-white">{cancelModalBooking.bookingRef}</span></div>
              <div>Seats: <span className="text-white">{cancelModalBooking.seatIds.join(', ')}</span></div>
              <div>Refund Amount: <span className="text-emerald-400 font-bold">₹{cancelModalBooking.totalAmount}</span></div>
            </div>

            <p className="text-[11px] text-slate-500">
              Upon cancellation, your seats will immediately be released back to the hall inventory for other moviegoers.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setCancelModalBooking(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-white font-semibold transition"
              >
                Keep Booking
              </button>
              <button
                disabled={cancellingId !== null}
                onClick={handleCancelBooking}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs text-white font-bold transition disabled:opacity-50"
              >
                {cancellingId ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
