import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Play,
  Ticket,
  Star,
  Clock,
  Sparkles,
  ShieldCheck,
  Zap,
  ChevronRight,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { apiRequest } from '../services/api.ts';
import { useCity } from '../context/CityContext.tsx';
import { MovieCard, MovieItem } from '../components/MovieCard.tsx';
import { TrailerModal } from '../components/TrailerModal.tsx';

export const Home: React.FC = () => {
  const { city } = useCity();
  const [movies, setMovies] = useState<MovieItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [activeTrailer, setActiveTrailer] = useState<{ url?: string; title: string } | null>(null);

  useEffect(() => {
    async function fetchMovies() {
      try {
        setLoading(true);
        const data = await apiRequest<{ movies: MovieItem[] }>(`/movies?city=${encodeURIComponent(city)}`);
        setMovies(data.movies || []);
      } catch (err) {
        console.error('Failed to load movies:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchMovies();
  }, [city]);

  const genres = ['all', 'Action', 'Drama', 'Sci-Fi', 'Crime', 'Adventure', 'Comedy'];

  const nowShowing = movies.filter((m) => m.status === 'now-showing');
  const comingSoon = movies.filter((m) => m.status === 'coming-soon');

  const filteredNowShowing =
    selectedGenre === 'all'
      ? nowShowing
      : nowShowing.filter((m) => m.genre.some((g) => g.toLowerCase() === selectedGenre.toLowerCase()));

  // Featured Hero Movie (e.g. RRR or first now-showing)
  const heroMovie = nowShowing.find((m) => m.id === 'mov_rrr') || nowShowing[0] || movies[0];

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100">
      
      {/* 1. Hero Banner */}
      {heroMovie && (
        <section className="relative w-full min-h-[520px] md:min-h-[600px] flex items-center overflow-hidden border-b border-slate-800/60">
          {/* Backdrop Image */}
          <div className="absolute inset-0 z-0">
            <img
              src={heroMovie.backdropUrl || heroMovie.posterUrl}
              alt={heroMovie.title}
              className="w-full h-full object-cover object-center filter brightness-[0.4] scale-105"
            />
            {/* Atmospheric Cinema Gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#080c14] via-[#080c14]/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#080c14] via-transparent to-transparent" />
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
            <div className="max-w-2xl space-y-4">
              
              {/* Tag / Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 text-xs font-bold tracking-wide">
                <Sparkles className="w-3.5 h-3.5" />
                <span>TRENDING BLOCKBUSTER • IN CINEMAS NOW</span>
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight font-['Outfit']">
                {heroMovie.title}
              </h1>

              {/* Metadata row */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 font-medium">
                <span className="px-2 py-0.5 rounded bg-black/60 border border-slate-700 text-slate-200 font-bold">
                  {heroMovie.certification}
                </span>
                <span className="flex items-center gap-1 text-amber-400 font-bold">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  {heroMovie.rating.toFixed(1)} / 5.0
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {heroMovie.durationMinutes} mins
                </span>
                <span>•</span>
                <span>{heroMovie.language}</span>
                <span>•</span>
                <span className="text-rose-400">{heroMovie.genre.join(', ')}</span>
              </div>

              {/* Synopsis */}
              <p className="text-sm sm:text-base text-slate-300 line-clamp-3 leading-relaxed">
                {heroMovie.description}
              </p>

              {/* Director & Cast */}
              <div className="text-xs text-slate-400">
                <span className="text-slate-500">Starring:</span> {heroMovie.cast ? heroMovie.cast.slice(0, 3).join(', ') : 'All Star Cast'}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Link
                  to={`/movies/${heroMovie.id}#showtimes`}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white font-bold text-sm shadow-xl shadow-rose-950 flex items-center gap-2 transition transform hover:-translate-y-0.5 active:scale-95"
                >
                  <Ticket className="w-4 h-4" />
                  Book Tickets Now
                </Link>

                <button
                  onClick={() => setActiveTrailer({ url: heroMovie.trailerUrl, title: heroMovie.title })}
                  className="px-5 py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-white font-semibold text-sm flex items-center gap-2 transition"
                >
                  <Play className="w-4 h-4 text-rose-500 fill-current" />
                  Watch Trailer
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 2. Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        
        {/* Genre Tags Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-2 flex-shrink-0">
            Genres:
          </span>
          {genres.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGenre(g)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition capitalize ${
                selectedGenre === g
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-950'
                  : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
              }`}
            >
              {g === 'all' ? 'All Genres' : g}
            </button>
          ))}
        </div>

        {/* 3. Now Showing Section */}
        <section>
          <div className="flex items-end justify-between mb-6 border-b border-slate-800/80 pb-4">
            <div>
              <div className="flex items-center gap-2 text-rose-500 text-xs font-bold uppercase tracking-wider mb-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Currently Playing in {city}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white font-['Outfit']">
                Now Showing
              </h2>
            </div>
            <Link
              to="/movies?status=now-showing"
              className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 group"
            >
              <span>View All</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-slate-900/60 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredNowShowing.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/30 rounded-2xl border border-slate-800">
              <Ticket className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 text-sm font-medium">No movies found matching this filter in {city}.</p>
              <button
                onClick={() => setSelectedGenre('all')}
                className="mt-3 text-xs text-rose-400 hover:underline font-semibold"
              >
                Clear filter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {filteredNowShowing.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          )}
        </section>

        {/* 4. Coming Soon Section */}
        {comingSoon.length > 0 && (
          <section>
            <div className="flex items-end justify-between mb-6 border-b border-slate-800/80 pb-4">
              <div>
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Upcoming Anticipated Titles</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white font-['Outfit']">
                  Coming Soon
                </h2>
              </div>
              <Link
                to="/movies?status=coming-soon"
                className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 group"
              >
                <span>View All</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
              {comingSoon.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          </section>
        )}

        {/* 5. Cinema Experience Value Props */}
        <section className="bg-gradient-to-b from-slate-900/60 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-10">
          <div className="max-w-3xl mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-500">Premium Cinema Experience</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white font-['Outfit'] mt-1">
              Why Book With iMovies?
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Next-generation ticketing built for true movie aficionados with seamless seat reservation and zero hassle.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Live Real-Time Seat Locking</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Socket-powered live seating avoids race conditions and double bookings. Your seats are held safely for 5 minutes during checkout.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">IMAX, 4K & Dolby Atmos</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Filter and select premium theatre halls featuring immersive laser projection, plush luxury recliners, and precision audio.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Instant E-Ticket with QR</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Receive verifiable digital tickets instantly on your smartphone with direct print and QR pass scanning at cinema turnstiles.
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* Trailer Modal */}
      <TrailerModal
        isOpen={!!activeTrailer}
        onClose={() => setActiveTrailer(null)}
        trailerUrl={activeTrailer?.url}
        movieTitle={activeTrailer?.title || ''}
      />
    </div>
  );
};
