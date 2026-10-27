import React from 'react';
import { Film, Github, Shield, Heart, Award, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#05080f] border-t border-slate-900 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white">
                <Film className="w-4 h-4" />
              </div>
              <span className="text-xl font-black text-white font-['Outfit']">
                i<span className="text-rose-500">Movies</span>
              </span>
            </Link>
            <p className="text-slate-400 text-xs leading-relaxed">
              Your ultimate destination for the latest blockbusters and timeless classics. Book tickets with real-time seat locks and instant e-tickets.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span>Simulated SSL 256-Bit Secure Checkout</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold mb-3 uppercase tracking-wider text-[11px]">Explore</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/movies?status=now-showing" className="hover:text-rose-400 transition">
                  Now Showing
                </Link>
              </li>
              <li>
                <Link to="/movies?status=coming-soon" className="hover:text-rose-400 transition">
                  Coming Soon
                </Link>
              </li>
              <li>
                <Link to="/movies" className="hover:text-rose-400 transition">
                  All Movies
                </Link>
              </li>
              <li>
                <Link to="/my-bookings" className="hover:text-rose-400 transition">
                  My Bookings
                </Link>
              </li>
            </ul>
          </div>

          {/* Cinema Technologies */}
          <div>
            <h4 className="text-white font-bold mb-3 uppercase tracking-wider text-[11px]">Cinema Formats</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-1.5 text-slate-400">
                <Sparkles className="w-3 h-3 text-rose-500" /> IMAX Laser 3D
              </li>
              <li className="flex items-center gap-1.5 text-slate-400">
                <Sparkles className="w-3 h-3 text-rose-500" /> Dolby Atmos 7.1 Surround
              </li>
              <li className="flex items-center gap-1.5 text-slate-400">
                <Sparkles className="w-3 h-3 text-rose-500" /> 4K Ultra RGB Projection
              </li>
              <li className="flex items-center gap-1.5 text-slate-400">
                <Sparkles className="w-3 h-3 text-rose-500" /> VIP Luxury Recliner Lounges
              </li>
            </ul>
          </div>

          {/* Academic / Project Accreditation */}
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-1.5 text-rose-400 font-bold mb-1.5 text-xs">
              <Award className="w-4 h-4" />
              <span>College Capstone Project</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
              Full-Stack MERN Architecture: MongoDB, Express, React & Node.js with real-time Socket.IO seat inventory and atomic locking.
            </p>
            <div className="text-[10px] text-slate-500 space-y-1">
              <div>Developer: <span className="text-slate-300 font-medium">B.Tech CSE Student</span></div>
              <div>Faculty Mentor Review Ready: <span className="text-emerald-400 font-medium">Verified</span></div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <p>© {new Date().getFullYear()} iMovies Booking System. All rights reserved.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Demo Payments Enabled</span>
            <span>•</span>
            <span className="text-slate-500">GitHub Repository: [Add your GitHub repository URL here]</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
