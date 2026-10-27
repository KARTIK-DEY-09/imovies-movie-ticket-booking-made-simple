import React, { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';
import {
  CheckCircle,
  Printer,
  Ticket,
  Calendar,
  Clock,
  MapPin,
  Film,
  ArrowRight,
  Share2,
} from 'lucide-react';
import { apiRequest } from '../services/api.ts';

export const BookingSuccess: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<any>(location.state?.booking || null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [loading, setLoading] = useState(!booking);

  useEffect(() => {
    // Fire celebratory confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#e11d48', '#f43f5e', '#fb7185', '#38bdf8', '#fbbf24'],
    });

    async function fetchBooking() {
      if (booking) return;
      try {
        setLoading(true);
        const data = await apiRequest<{ booking: any }>(`/bookings/${bookingId}`);
        setBooking(data.booking);
      } catch (err) {
        console.error('Failed to load booking:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchBooking();
  }, [bookingId]);

  // Generate QR code for ticket verification
  useEffect(() => {
    if (booking?.bookingRef) {
      QRCode.toDataURL(
        `IMOVIES-TICKET:${booking.bookingRef}|SHOW:${booking.showId}|SEATS:${booking.seatIds?.join(',')}|TOTAL:INR${booking.totalAmount}`,
        { width: 180, margin: 1, color: { dark: '#000000', light: '#ffffff' } },
        (err, url) => {
          if (!err && url) {
            setQrDataUrl(url);
          }
        }
      );
    }
  }, [booking]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-[#080c14] text-white flex flex-col items-center justify-center p-6">
        <h2 className="text-xl font-bold mb-2">Booking Not Found</h2>
        <Link to="/my-bookings" className="text-rose-500 hover:underline text-sm font-semibold">
          View My Bookings
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-8">
        
        {/* Success Header Notification */}
        <div className="text-center space-y-2 no-print">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 mx-auto shadow-xl shadow-emerald-950 animate-bounce">
            <CheckCircle className="w-9 h-9" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white font-['Outfit']">
            Booking Confirmed!
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            Your movie tickets are confirmed and ready. Present the M-Ticket QR code at the cinema entry gate.
          </p>
        </div>

        {/* Printable Cinema Ticket Card */}
        <div
          id="printable-ticket"
          className="bg-[#0f1526] border-2 border-slate-700 rounded-3xl overflow-hidden shadow-2xl relative"
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-rose-700 via-rose-600 to-red-600 p-5 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Film className="w-6 h-6" />
              <span className="text-xl font-black tracking-wider font-['Outfit']">
                i<span className="text-slate-100">Movies</span>
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold tracking-widest opacity-80 block">
                Booking Reference
              </span>
              <span className="text-sm font-mono font-black tracking-wider">{booking.bookingRef}</span>
            </div>
          </div>

          {/* Ticket Body */}
          <div className="p-6 sm:p-8 space-y-6">
            
            {/* Movie Title & Badges */}
            <div className="border-b border-slate-800 pb-4">
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest block mb-1">
                E-TICKET ADMISSION PASS
              </span>
              <h2 className="text-2xl font-black text-white font-['Outfit']">{booking.movieTitle}</h2>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                <span>{booking.movieLanguage || 'Hindi'}</span>
                <span>•</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 text-[10px] font-bold">
                  {booking.movieCertification || 'U/A'}
                </span>
                <span>•</span>
                <span className="text-emerald-400 font-semibold">Payment Confirmed</span>
              </div>
            </div>

            {/* Theatre & Showtime Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] block">
                  Cinema & Screen
                </span>
                <p className="font-bold text-white text-sm">{booking.theatreName}</p>
                <p className="text-slate-400 text-xs">Screen {booking.screenNumber}</p>
                <p className="text-slate-500 text-[11px]">{booking.theatreLocation || booking.theatreCity}</p>
              </div>

              <div className="space-y-1">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] block">
                  Date & Showtime
                </span>
                <p className="font-bold text-white text-sm">
                  {new Date(booking.showDate).toLocaleDateString([], {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
                <p className="text-rose-400 font-bold text-base">{booking.startTime}</p>
              </div>
            </div>

            {/* Seats Section with Perforated Divider */}
            <div className="pt-4 border-t-2 border-dashed border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
              
              <div className="space-y-2 text-left w-full sm:w-auto">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px] block">
                  Reserved Seats ({booking.seatIds?.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {booking.seatIds?.map((sid: string) => (
                    <span
                      key={sid}
                      className="px-3 py-1.5 rounded-lg bg-rose-600/20 border border-rose-500 text-rose-300 font-bold text-sm"
                    >
                      {sid}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-slate-400 pt-1">
                  Total Paid: <strong className="text-white text-sm">₹{booking.totalAmount}</strong>{' '}
                  <span className="text-[10px] text-slate-500">via {booking.paymentMethod}</span>
                </div>
              </div>

              {/* QR Code */}
              {qrDataUrl && (
                <div className="flex flex-col items-center flex-shrink-0 bg-white p-2.5 rounded-xl shadow-md">
                  <img src={qrDataUrl} alt="Ticket QR" className="w-28 h-28 object-contain" />
                  <span className="text-[9px] font-mono text-black font-bold mt-1">SCAN AT ENTRY</span>
                </div>
              )}
            </div>

            {/* Terms notice on ticket */}
            <div className="pt-4 border-t border-slate-800/80 text-[10px] text-slate-500 leading-relaxed">
              * Please arrive 15 minutes before showtime. Outside food & beverages not permitted. Handbag screening required. Cancellations permitted up to 2 hours prior to scheduled showtime.
            </div>

          </div>
        </div>

        {/* Action Buttons (Hidden when printing) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 no-print pt-2">
          <button
            onClick={handlePrint}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition"
          >
            <Printer className="w-4 h-4 text-rose-500" />
            <span>Print E-Ticket</span>
          </button>

          <Link
            to="/my-bookings"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-950 transition"
          >
            <Ticket className="w-4 h-4" />
            <span>Go to My Bookings</span>
          </Link>

          <Link
            to="/movies"
            className="w-full sm:w-auto px-4 py-3 text-xs text-slate-400 hover:text-white font-semibold flex items-center justify-center gap-1 transition"
          >
            <span>Book Another Movie</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

      </div>
    </div>
  );
};
