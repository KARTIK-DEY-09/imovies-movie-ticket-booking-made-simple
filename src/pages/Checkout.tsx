import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  CreditCard,
  Film,
  MapPin,
  Calendar,
  Clock,
  Ticket,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronLeft,
} from 'lucide-react';
import { apiRequest } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';

export const Checkout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const state = location.state as {
    showId: string;
    show: any;
    seatIds: string[];
    selectedSeatsData: Array<{ seatId: string; category: string; price: number }>;
    subtotal: number;
    taxes: number;
    total: number;
  } | null;

  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [contactPhone, setContactPhone] = useState(user?.phone || '+91 98765 43210');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!state || !state.seatIds || state.seatIds.length === 0) {
    return (
      <div className="min-h-screen bg-[#080c14] text-white flex flex-col items-center justify-center p-6">
        <h2 className="text-xl font-bold mb-2">No active checkout session</h2>
        <p className="text-xs text-slate-400 mb-4">Please select seats from a movie show to proceed to checkout.</p>
        <Link to="/movies" className="px-4 py-2 bg-rose-600 rounded-xl text-xs font-bold">
          Browse Movies
        </Link>
      </div>
    );
  }

  const { show, seatIds, selectedSeatsData, subtotal, taxes, total } = state;

  const handleProcessPayment = async (simulateFailure: boolean) => {
    try {
      setProcessing(true);
      setErrorMessage('');

      const res = await apiRequest<{ message: string; booking: any }>('/bookings/checkout-demo', {
        method: 'POST',
        body: JSON.stringify({
          showId: state.showId,
          seatIds,
          paymentMethod: `Demo ${paymentMethod.toUpperCase()}`,
          simulateFailure,
        }),
      });

      // Nav to success with confirmed booking
      navigate(`/booking-success/${res.booking.id}`, { state: { booking: res.booking } });
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment processing failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Navigation / Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-white font-['Outfit']">Checkout & Confirmation</h1>
            <p className="text-xs text-slate-400">Review your ticket summary and complete payment</p>
          </div>
        </div>

        {/* Demo Mode Notice Banner */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-sm">Demo Mode • Academic Capstone Demonstration</span>
            <p className="mt-0.5 leading-relaxed text-amber-200/90 text-xs">
              This is a simulated payment gateway designed for software engineering evaluation. No real money will be charged.
              You can test both the <strong className="text-white">Successful Booking</strong> and <strong className="text-white">Simulated Failure</strong> scenarios below to observe backend seat release.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-900 text-rose-300 text-xs flex items-center gap-3">
            <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Left Column: Contact & Payment selection (2 cols) */}
          <div className="md:col-span-2 space-y-6">
            
            {/* 1. Contact Information */}
            <div className="bg-[#0e1424] border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>1. Contact Details for M-Ticket</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Email Address</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Mobile Number</label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            </div>

            {/* 2. Payment Method selection */}
            <div className="bg-[#0e1424] border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>2. Select Simulated Payment Option</span>
              </h3>

              <div className="space-y-2">
                {[
                  { id: 'upi', label: 'UPI / QR Payment (Google Pay, PhonePe, Paytm)', desc: 'Instant demo confirmation' },
                  { id: 'card', label: 'Credit / Debit Card (Visa, MasterCard, RuPay)', desc: 'Simulated 3DS authorization' },
                  { id: 'netbanking', label: 'Net Banking (All Major Indian Banks)', desc: 'Instant demo processing' },
                ].map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                      paymentMethod === opt.id
                        ? 'bg-rose-950/20 border-rose-500 text-white'
                        : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === opt.id}
                      onChange={() => setPaymentMethod(opt.id as any)}
                      className="mt-1 accent-rose-500"
                    />
                    <div>
                      <span className="font-bold text-xs text-slate-200 block">{opt.label}</span>
                      <span className="text-[11px] text-slate-400">{opt.desc}</span>
                    </div>
                  </label>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <button
                  disabled={processing}
                  onClick={() => handleProcessPayment(false)}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white font-bold text-sm shadow-xl shadow-rose-950 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{processing ? 'Processing Demo Transaction...' : `Pay ₹${total} (Test Success)`}</span>
                </button>

                <button
                  disabled={processing}
                  onClick={() => handleProcessPayment(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-rose-400 font-semibold text-xs flex items-center justify-center gap-2 transition"
                >
                  <XCircle className="w-3.5 h-3.5 text-rose-500" />
                  <span>Simulate Payment Failure (Verify Lock Release)</span>
                </button>
              </div>
            </div>

          </div>

          {/* Right Column: Order Summary (1 col) */}
          <div className="space-y-6">
            <div className="bg-[#0e1424] border border-slate-800 rounded-2xl p-6 space-y-5">
              <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3 flex items-center gap-2">
                <Ticket className="w-4 h-4 text-rose-500" />
                <span>Booking Summary</span>
              </h3>

              {/* Movie info */}
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white font-['Outfit']">{show.movie?.title}</h4>
                <div className="text-xs text-slate-400">{show.theatre?.name}</div>
                <div className="text-xs text-rose-400 font-medium">Screen {show.screenNumber}</div>
              </div>

              {/* Date & Time */}
              <div className="text-xs text-slate-300 space-y-1 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{new Date(show.showDate).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-rose-400" />
                  <span className="font-bold text-white">{show.startTime}</span>
                </div>
              </div>

              {/* Seats breakdown */}
              <div className="space-y-2 text-xs">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Seats</span>
                <div className="space-y-1">
                  {selectedSeatsData.map((s) => (
                    <div key={s.seatId} className="flex justify-between text-slate-300">
                      <span>Seat {s.seatId} ({s.category})</span>
                      <span>₹{s.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Calculation */}
              <div className="pt-3 border-t border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Tickets Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Integrated GST (12%)</span>
                  <span>₹{taxes}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Booking Convenience Fee</span>
                  <span className="text-emerald-400 font-medium">FREE</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between text-base font-black text-white">
                  <span>Total Amount</span>
                  <span className="text-rose-500">₹{total}</span>
                </div>
              </div>

              <div className="pt-2 text-[10px] text-slate-500 text-center flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Encrypted simulated checkout</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
