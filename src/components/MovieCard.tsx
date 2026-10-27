import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart, Clock, Ticket } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

export interface MovieItem {
  id: string;
  title: string;
  slug?: string;
  description: string;
  genre: string[];
  language: string;
  durationMinutes: number;
  releaseDate: string;
  certification: string;
  cast?: string[];
  director: string;
  posterUrl: string;
  backdropUrl?: string;
  trailerUrl?: string;
  rating: number;
  status: 'now-showing' | 'coming-soon' | 'inactive';
}

interface MovieCardProps {
  movie: MovieItem;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie }) => {
  const { watchlist, toggleWatchlist, isAuthenticated } = useAuth();
  const [imgError, setImgError] = useState(false);
  const isInWatchlist = watchlist.includes(movie.id);

  // Format duration into hours and mins
  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h}h ${m}m`;
  };

  const handleWatchlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      alert('Please sign in to add movies to your watchlist.');
      return;
    }
    await toggleWatchlist(movie.id);
  };

  const fallbackPoster = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80';

  return (
    <div className="group relative bg-[#0e1424] border border-slate-800/80 rounded-2xl overflow-hidden card-hover flex flex-col h-full shadow-lg">
      
      {/* Poster Image Container */}
      <Link to={`/movies/${movie.id}`} className="relative aspect-[2/3] overflow-hidden bg-slate-900 block">
        <img
          src={imgError ? fallbackPoster : movie.posterUrl}
          alt={movie.title}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e1424] via-transparent to-black/30" />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
          <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-bold text-slate-200 border border-slate-700">
            {movie.certification}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-md text-[10px] font-semibold text-rose-400 border border-rose-900/40">
            {movie.language.split('/')[0]}
          </span>
        </div>

        {/* Watchlist Button */}
        <button
          onClick={handleWatchlistClick}
          aria-label={isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center transition backdrop-blur-md z-10 ${
            isInWatchlist
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/50'
              : 'bg-black/60 text-slate-300 hover:text-rose-500 hover:bg-black/80'
          }`}
        >
          <Heart className={`w-4 h-4 ${isInWatchlist ? 'fill-current' : ''}`} />
        </button>

        {/* Rating Floating Tag */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md border border-amber-500/30 text-amber-400 text-xs font-bold shadow-md">
          <Star className="w-3.5 h-3.5 fill-current text-amber-400" />
          <span>{movie.rating ? movie.rating.toFixed(1) : '4.5'}</span>
        </div>

        {/* Duration Floating Tag */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 rounded-lg bg-black/80 backdrop-blur-md text-slate-300 text-[10px] font-medium border border-slate-800">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>{formatDuration(movie.durationMinutes)}</span>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <Link to={`/movies/${movie.id}`}>
            <h3 className="text-base font-bold text-white group-hover:text-rose-400 transition truncate" title={movie.title}>
              {movie.title}
            </h3>
          </Link>
          <p className="text-[11px] text-slate-400 truncate mt-0.5">
            {movie.genre.slice(0, 3).join(' • ')}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
          {movie.status === 'now-showing' ? (
            <Link
              to={`/movies/${movie.id}#showtimes`}
              className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-rose-950 transition active:scale-95"
            >
              <Ticket className="w-3.5 h-3.5" />
              Book Tickets
            </Link>
          ) : (
            <Link
              to={`/movies/${movie.id}`}
              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center transition"
            >
              Coming Soon
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
