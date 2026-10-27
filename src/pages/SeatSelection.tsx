import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import {
  Film,
  MapPin,
  Calendar,
  Clock,
  Shield,
  ArrowRight,
  AlertCircle,
  Timer,
  Info,
  Check,
  ChevronLeft,
} from 'lucide-react';
import { apiRequest } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface SeatData {
  id: string;
  showId: string;
  seatId: string;
  row: string;
  number: number;
  category: 'standard' | 'premium' | 'recliner';
  price: number;
  status: 'available' | 'locked' | 'booked';
  lockedByUserId?: string;
  lockExpiresAt?: number;
}

interface ShowDetail {
  id: string;
  movieId: string;
  theatreId: string;
  screenNumber: number;
  showDate: string;
  startTime: string;
  pricing: {
    standard: number;
    premium: number;
    recliner: number;
  };
  movie?: {
    id: string;
    title: string;
    posterUrl: string;
    certification: string;
    durationMinutes: number;
  };
  theatre?: {
    id: string;
    name: string;
    location: string;
    city: string;
  };
}

export const SeatSelection: React.FC = () => {
  const { showId } = useParams<{ showId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [show, setShow] = useState<ShowDetail | null>(null);
  const [seats, setSeats] = useState<SeatData[]>([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [locking, setLocking] = useState(false);

  // Seat Lock Timer state
  const [isLockedByMe, setIsLockedByMe] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const timerRef = useRef<any>(null);

  const socketRef = useRef<Socket | null>(null);

  // 1. Fetch Show and Seats
  useEffect(() => {
    async function initShowData() {
      if (!showId) return;
      try {
        setLoading(true);
        // Show info
        const showData = await apiRequest<{ show: ShowDetail }>(`/shows/${showId}`);
        setShow(showData.show);

        // Seats info
        const seatsData = await apiRequest<{ seats: SeatData[] }>(`/shows/${showId}/seats`);
        setSeats(seatsData.seats || []);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to load show details');
      } finally {
        setLoading(false);
      }
    }

    initShowData();
  }, [showId]);

  // 2. Connect Socket.IO for real-time seat lock & booking updates
  useEffect(() => {
    if (!showId) return;

    const socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.emit('join:show', showId);

    // Listen for seat updates from backend
    socket.on('seats:updated', (payload: { seatIds: string[]; status: 'available' | 'locked' | 'booked'; lockedBy?: string }) => {
      setSeats((prevSeats) =>
        prevSeats.map((seat) => {
          if (payload.seatIds.includes(seat.seatId)) {
            return {
              ...seat,
              status: payload.status,
              lockedByUserId: payload.lockedBy,
            };
          }
          return seat;
        })
      );

      // If any of the user's selected seats were booked or locked by someone else, remove them
      if (payload.lockedBy !== user?.id && payload.status !== 'available') {
        setSelectedSeatIds((prev) => prev.filter((id) => !payload.seatIds.includes(id)));
      }
    });

    return () => {
      socket.emit('leave:show', showId);
      socket.disconnect();
    };
  }, [showId, user?.id]);

  // Timer countdown
  useEffect(() => {
    if (isLockedByMe && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsLockedByMe(false);
            setSelectedSeatIds([]);
            setErrorMsg('Seat hold reservation expired. Please select seats again.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLockedByMe, timeLeft]);

  // Handle seat click
  const toggleSeat = (seat: SeatData) => {
    if (seat.status === 'booked') return;
    if (seat.status === 'locked' && seat.lockedByUserId !== user?.id) return;

    setErrorMsg('');
    const sid = seat.seatId;

    if (selectedSeatIds.includes(sid)) {
      setSelectedSeatIds((prev) => prev.filter((id) => id !== sid));
    } else {
      if (selectedSeatIds.length >= 8) {
        setErrorMsg('You can select a maximum of 8 seats per booking.');
        return;
      }
      setSelectedSeatIds((prev) => [...prev, sid]);
    }
  };

  // Group seats by category for visual sections
  const recliners = seats.filter((s) => s.category === 'recliner');
  const premiums = seats.filter((s) => s.category === 'premium');
  const standards = seats.filter((s) => s.category === 'standard');

  // Calculate pricing based on server prices
  const selectedSeatsData = seats.filter((s) => selectedSeatIds.includes(s.seatId));
  const subtotal = selectedSeatsData.reduce((acc, s) => acc + s.price, 0);
  const taxes = Math.round(subtotal * 0.12);
  const total = subtotal + taxes;

  // Handle proceed to checkout: lock seats first on server!
  const handleProceedToCheckout = async () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/seats/${showId}`);
      return;
    }

    if (selectedSeatIds.length === 0) {
      setErrorMsg('Please select at least one seat to continue.');
      return;
    }

    try {
      setLocking(true);
      setErrorMsg('');

      const res = await apiRequest<{ message: string; expiresAt: number }>(`/shows/${showId}/lock-seats`, {
        method: 'POST',
        body: JSON.stringify({ seatIds: selectedSeatIds }),
      });

      setIsLockedByMe(true);
      const remainingSeconds = Math.max(0, Math.floor((res.expiresAt - Date.now()) / 1000));
      setTimeLeft(remainingSeconds || 300);

      // Navigate to checkout with show and seat details in state
      navigate('/checkout', {
        state: {
          showId,
          show,
          seatIds: selectedSeatIds,
          selectedSeatsData,
          subtotal,
          taxes,
          total,
        },
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'These seats are no longer available. Please choose other seats.');
    } finally {
      setLocking(false);
    }
  };

  // Render a row of seats
  const renderSeatRow = (rowSeats: SeatData[]) => {
    // Group seats by row character
    const rowMap: Record<string, SeatData[]> = {};
    rowSeats.forEach((s) => {
      if (!rowMap[s.row]) rowMap[s.row] = [];
      rowMap[s.row].push(s);
    });

    return Object.entries(rowMap).map(([rowChar, sList]) => (
      <div key={rowChar} className="flex items-center justify-center gap-1.5 sm:gap-2 my-1.5">
        <span className="w-5 text-center text-xs font-bold text-slate-500">{rowChar}</span>
        
        <div className="flex items-center gap-1 sm:gap-1.5">
          {sList.map((seat) => {
            const isSelected = selectedSeatIds.includes(seat.seatId);
            const isBooked = seat.status === 'booked';
            const isLocked = seat.status === 'locked' && seat.lockedByUserId !== user?.id;

            let seatClasses =
              'w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-[10px] sm:text-xs font-bold flex items-center justify-center transition cursor-pointer ';

            if (isSelected) {
              seatClasses += 'bg-rose-600 text-white shadow-md shadow-rose-950 scale-105 border border-rose-400';
            } else if (isBooked) {
              seatClasses += 'bg-slate-900/90 text-slate-600 border border-slate-800 cursor-not-allowed opacity-40';
            } else if (isLocked) {
              seatClasses += 'bg-amber-950/60 text-amber-500 border border-amber-800/80 cursor-not-allowed';
            } else {
              seatClasses +=
                'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-rose-500';
            }

            return (
              <button
                key={seat.seatId}
                disabled={isBooked || isLocked}
                onClick={() => toggleSeat(seat)}
                className={seatClasses}
                title={`${seat.seatId} • ${seat.category.toUpperCase()} • ₹${seat.price}`}
              >
                {seat.number}
              </button>
            );
          })}
        </div>

        <span className="w-5 text-center text-xs font-bold text-slate-500">{rowChar}</span>
      </div>
    ));
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!show) {
    return (
      <div className="min-h-screen bg-[#080c14] text-white flex flex-col items-center justify-center p-6">
        <h2 className="text-xl font-bold mb-2">Show Not Found</h2>
        <Link to="/movies" className="text-rose-500 hover:underline text-sm font-semibold">
          Return to Movies
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 pb-36">
      
      {/* 1. Show Header Bar */}
      <div className="bg-[#0b0f1a] border-b border-slate-800 sticky top-16 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition"
              title="Back"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-black text-white flex items-center gap-2 font-['Outfit']">
                <span>{show.movie?.title}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  {show.movie?.certification}
                </span>
              </h1>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-rose-500" />
                  {show.theatre?.name} (Screen {show.screenNumber})
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {new Date(show.showDate).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-bold text-white">
                  <Clock className="w-3 h-3 text-rose-400" />
                  {show.startTime}
                </span>
              </div>
            </div>
          </div>

          {/* Seat Hold Timer */}
          {isLockedByMe && timeLeft > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold animate-pulse">
              <Timer className="w-4 h-4" />
              <span>Seat Hold: {formatTimer(timeLeft)}</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Seating Canvas */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Error Notification */}
        {errorMsg && (
          <div className="p-3 bg-rose-950/60 border border-rose-900/60 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-6 py-3 px-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-slate-900 border border-slate-700" />
            <span className="text-slate-300">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-rose-600 border border-rose-400 shadow-sm" />
            <span className="text-white font-semibold">Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-amber-950 border border-amber-600" />
            <span className="text-amber-400">Held by another</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-slate-900 border border-slate-800 opacity-40" />
            <span className="text-slate-500">Booked</span>
          </div>
        </div>

        {/* Seat Layout by Tiers */}
        <div className="bg-[#0b0f1a] border border-slate-800/80 rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8">
          
          {/* Recliner Tier */}
          {recliners.length > 0 && (
            <div>
              <div className="flex items-center justify-between pb-2 mb-4 border-b border-slate-800">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  👑 VIP Recliner Lounger (Rows A - B)
                </span>
                <span className="text-xs font-bold text-slate-300">₹{show.pricing.recliner}</span>
              </div>
              <div>{renderSeatRow(recliners)}</div>
            </div>
          )}

          {/* Premium Tier */}
          {premiums.length > 0 && (
            <div>
              <div className="flex items-center justify-between pb-2 mb-4 border-b border-slate-800">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                  ⭐ Prime Executive (Rows C - E)
                </span>
                <span className="text-xs font-bold text-slate-300">₹{show.pricing.premium}</span>
              </div>
              <div>{renderSeatRow(premiums)}</div>
            </div>
          )}

          {/* Standard Tier */}
          {standards.length > 0 && (
            <div>
              <div className="flex items-center justify-between pb-2 mb-4 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  🎬 Classic Standard (Rows F - H)
                </span>
                <span className="text-xs font-bold text-slate-300">₹{show.pricing.standard}</span>
              </div>
              <div>{renderSeatRow(standards)}</div>
            </div>
          )}

          {/* Cinema Screen Curve at Bottom */}
          <div className="pt-10 flex flex-col items-center">
            <div className="w-4/5 h-2.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent rounded-full screen-glow opacity-80" />
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-1.5">
              <span>CINEMA SCREEN THIS WAY</span>
            </p>
          </div>
        </div>

      </main>

      {/* 3. Sticky Bottom Checkout Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#090d16]/95 backdrop-blur-md border-t border-slate-800 p-4 shadow-2xl">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Selected Seats info */}
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-rose-500 flex-shrink-0">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-400">
                Selected: <strong className="text-white">{selectedSeatIds.length}</strong> seat(s)
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedSeatIds.length === 0 ? (
                  <span className="text-[11px] text-slate-500">No seats selected</span>
                ) : (
                  selectedSeatIds.map((sid) => (
                    <span
                      key={sid}
                      className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-bold border border-rose-500/30"
                    >
                      {sid}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Price & Action */}
          <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
            <div className="text-left sm:text-right">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Total Payable</div>
              <div className="text-lg font-black text-white">
                ₹{total}{' '}
                <span className="text-[10px] text-slate-400 font-normal">incl. 12% GST</span>
              </div>
            </div>

            <button
              disabled={selectedSeatIds.length === 0 || locking}
              onClick={handleProceedToCheckout}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold shadow-xl shadow-rose-950 flex items-center gap-2 transition active:scale-95 flex-shrink-0"
            >
              <span>{locking ? 'Locking Seats...' : 'Proceed to Checkout'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

    </div>
  );
};
