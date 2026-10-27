import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { CityProvider } from './context/CityContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';

// Pages
import { Home } from './pages/Home.tsx';
import { Movies } from './pages/Movies.tsx';
import { MovieDetails } from './pages/MovieDetails.tsx';
import { SeatSelection } from './pages/SeatSelection.tsx';
import { Checkout } from './pages/Checkout.tsx';
import { BookingSuccess } from './pages/BookingSuccess.tsx';
import { MyBookings } from './pages/MyBookings.tsx';
import { Watchlist } from './pages/Watchlist.tsx';
import { Profile } from './pages/Profile.tsx';
import { Login } from './pages/Login.tsx';
import { Register } from './pages/Register.tsx';
import { AdminDashboard } from './pages/admin/AdminDashboard.tsx';
import { Film } from 'lucide-react';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({
  children,
  adminOnly = false,
}) => {
  const { user, loading, isAuthenticated, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// 404 NotFound Component
const NotFound: React.FC = () => (
  <div className="min-h-[70vh] bg-[#080c14] text-white flex flex-col items-center justify-center p-6 text-center">
    <div className="w-16 h-16 rounded-2xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-500 mb-4">
      <Film className="w-8 h-8" />
    </div>
    <h1 className="text-4xl font-black font-['Outfit'] mb-2">404 - Page Not Found</h1>
    <p className="text-xs text-slate-400 max-w-sm mb-6">
      The reel you're looking for seems to have been cut from the final screening.
    </p>
    <Link
      to="/"
      className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg transition"
    >
      Return to Home
    </Link>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CityProvider>
          <div className="min-h-screen flex flex-col bg-[#080c14] selection:bg-rose-600 selection:text-white">
            <Navbar />
            <div className="flex-1">
              <Routes>
                {/* Public Storefront Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/movies" element={<Movies />} />
                <Route path="/movies/:id" element={<MovieDetails />} />
                <Route path="/seats/:showId" element={<SeatSelection />} />

                {/* Authentication Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* User Protected Routes */}
                <Route
                  path="/checkout"
                  element={
                    <ProtectedRoute>
                      <Checkout />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/booking-success/:bookingId"
                  element={
                    <ProtectedRoute>
                      <BookingSuccess />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-bookings"
                  element={
                    <ProtectedRoute>
                      <MyBookings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/watchlist"
                  element={
                    <ProtectedRoute>
                      <Watchlist />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Role-Protected Route */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute adminOnly>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* 404 Fallback */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            <Footer />
          </div>
        </CityProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
