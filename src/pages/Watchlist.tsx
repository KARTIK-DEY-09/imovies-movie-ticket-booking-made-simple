import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Film, Trash2, Ticket } from 'lucide-react';
import { apiRequest } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { MovieCard, MovieItem } from '../components/MovieCard.tsx';

export const Watchlist: React.FC = () => {
  const { watchlist, toggleWatchlist } = useAuth();
  const [movies, setMovies] = useState<MovieItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWatchlistMovies() {
      try {
        setLoading(true);
        const data = await apiRequest<{ watchlist: MovieItem[] }>('/users/watchlist');
        setMovies(data.watchlist || []);
      } catch (err) {
        console.error('Failed to load watchlist:', err);
      } finally {
        setLoading(false);
      }
    }
    loadWatchlistMovies();
  }, [watchlist]);

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        <div className="border-b border-slate-800 pb-4">
          <h1 className="text-3xl font-black text-white font-['Outfit'] flex items-center gap-3">
            <Heart className="w-8 h-8 text-rose-500 fill-current" />
            <span>My Watchlist</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Movies you've saved to watch next. Keep track of release dates and ticket availability.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-slate-900/60 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : movies.length === 0 ? (
          <div className="text-center py-24 bg-slate-900/30 rounded-3xl border border-slate-800">
            <Heart className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">Your Watchlist is Empty</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Explore our current blockbusters and click the heart icon on any poster to bookmark it.
            </p>
            <Link
              to="/movies"
              className="mt-4 inline-block px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md transition"
            >
              Browse Movies
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
