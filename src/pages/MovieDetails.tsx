import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Star,
  Clock,
  Calendar,
  Heart,
  Play,
  MapPin,
  Ticket,
  MessageSquare,
  Sparkles,
  ChevronRight,
  Send,
  User as UserIcon,
} from 'lucide-react';
import { apiRequest } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useCity } from '../context/CityContext.tsx';
import { TrailerModal } from '../components/TrailerModal.tsx';

interface MovieDetail {
  id: string;
  title: string;
  description: string;
  genre: string[];
  language: string;
  durationMinutes: number;
  releaseDate: string;
  certification: string;
  cast: string[];
  director: string;
  posterUrl: string;
  backdropUrl?: string;
  trailerUrl?: string;
  rating: number;
  status: 'now-showing' | 'coming-soon' | 'inactive';
  reviewCount?: number;
}

interface ShowEnriched {
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
  theatreName: string;
  theatreLocation: string;
  theatreCity: string;
}

interface ReviewItem {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export const MovieDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { city } = useCity();
  const { user, isAuthenticated, watchlist, toggleWatchlist } = useAuth();

  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [shows, setShows] = useState<ShowEnriched[]>([]);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);

  // Date selection state
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Review Form state
  const [userRating, setUserRating] = useState<number>(5);
  const [userComment, setUserComment] = useState<string>('');
  const [reviewSubmitting, setReviewSubmitting] = useState<boolean>(false);
  const [reviewMessage, setReviewMessage] = useState<string>('');

  // Generate 4 consecutive dates for the date selector
  const availableDates = [0, 1, 2, 3].map((offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' });
    const monthDay = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    return { dateStr, dayName, monthDay };
  });

  useEffect(() => {
    async function loadMovieDetails() {
      if (!id) return;
      try {
        setLoading(true);
        // 1. Get Movie
        const movieData = await apiRequest<{ movie: MovieDetail }>(`/movies/${id}`);
        setMovie(movieData.movie);

        // 2. Get Shows
        const showsData = await apiRequest<{ shows: ShowEnriched[] }>(`/shows?movieId=${id}&city=${encodeURIComponent(city)}`);
        setShows(showsData.shows || []);

        // 3. Get Reviews
        const reviewsData = await apiRequest<{ reviews: ReviewItem[] }>(`/reviews/movie/${id}`);
        setReviews(reviewsData.reviews || []);
      } catch (err) {
        console.error('Failed to load movie details:', err);
      } finally {
        setLoading(false);
      }
    }

    loadMovieDetails();
  }, [id, city]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('Please sign in to write a review.');
      return;
    }
    if (!userComment.trim()) return;

    try {
      setReviewSubmitting(true);
      const res = await apiRequest<{ message: string; review: ReviewItem }>(`/reviews/movie/${id}`, {
        method: 'POST',
        body: JSON.stringify({ rating: userRating, comment: userComment.trim() }),
      });
      setReviews((prev) => [res.review, ...prev.filter((r) => r.id !== res.review.id)]);
      setUserComment('');
      setReviewMessage('Your review has been posted successfully!');
      setTimeout(() => setReviewMessage(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to submit review.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-[#080c14] text-white flex flex-col items-center justify-center p-6">
        <h2 className="text-xl font-bold mb-2">Movie Not Found</h2>
        <Link to="/movies" className="text-rose-500 hover:underline text-sm font-semibold">
          Return to Movies
        </Link>
      </div>
    );
  }

  // Filter shows by selected date
  const filteredShows = shows.filter((s) => s.showDate === selectedDate);

  // Group shows by Theatre
  const showsByTheatre: Record<string, { theatreName: string; theatreLocation: string; shows: ShowEnriched[] }> = {};
  filteredShows.forEach((s) => {
    if (!showsByTheatre[s.theatreId]) {
      showsByTheatre[s.theatreId] = {
        theatreName: s.theatreName,
        theatreLocation: s.theatreLocation,
        shows: [],
      };
    }
    showsByTheatre[s.theatreId].shows.push(s);
  });

  const isInWatchlist = watchlist.includes(movie.id);

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 pb-20">
      
      {/* 1. Backdrop & Movie Header */}
      <div className="relative w-full min-h-[460px] md:min-h-[500px] flex items-end overflow-hidden border-b border-slate-800">
        {/* Backdrop Image */}
        <div className="absolute inset-0 z-0">
          <img
            src={movie.backdropUrl || movie.posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover object-center filter brightness-[0.35]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080c14] via-[#080c14]/75 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080c14] via-transparent to-[#080c14]/80" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-end">
            
            {/* Poster Card */}
            <div className="w-40 sm:w-56 md:w-64 aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-700/80 bg-slate-900 flex-shrink-0">
              <img src={movie.posterUrl} alt={movie.title} className="w-full h-full object-cover" />
            </div>

            {/* Info Container */}
            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-rose-500/20 text-rose-400 border border-rose-500/40 text-xs font-bold uppercase tracking-wider">
                  {movie.status === 'now-showing' ? 'Now Showing' : 'Coming Soon'}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-black/60 border border-slate-700 text-slate-300 text-xs font-bold">
                  {movie.certification}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-black/60 border border-slate-700 text-slate-300 text-xs font-semibold">
                  {movie.language}
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white font-['Outfit'] tracking-tight">
                {movie.title}
              </h1>

              {/* Badges / Ratings */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-300">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-sm">{movie.rating.toFixed(1)}</span>
                  <span className="text-slate-400 font-normal">({reviews.length} reviews)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>{movie.durationMinutes} mins</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>Released: {new Date(movie.releaseDate).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Genre Pills */}
              <div className="flex flex-wrap gap-2 pt-1">
                {movie.genre.map((g) => (
                  <span
                    key={g}
                    className="px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300 text-xs font-medium"
                  >
                    {g}
                  </span>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                {movie.status === 'now-showing' && (
                  <a
                    href="#showtimes"
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white font-bold text-sm shadow-xl shadow-rose-950 flex items-center gap-2 transition active:scale-95"
                  >
                    <Ticket className="w-4 h-4" />
                    Book Tickets
                  </a>
                )}

                <button
                  onClick={() => setIsTrailerOpen(true)}
                  className="px-5 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-white font-semibold text-sm flex items-center gap-2 transition"
                >
                  <Play className="w-4 h-4 text-rose-500 fill-current" />
                  Watch Trailer
                </button>

                <button
                  onClick={() => toggleWatchlist(movie.id)}
                  className={`p-3 rounded-xl border transition ${
                    isInWatchlist
                      ? 'bg-rose-600 border-rose-500 text-white'
                      : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                  title="Add to Watchlist"
                >
                  <Heart className={`w-5 h-5 ${isInWatchlist ? 'fill-current' : ''}`} />
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Details & Showtimes Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left Column: Story, Cast & Showtimes (2 cols) */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* Story & Credits */}
          <div className="bg-[#0e1424] border border-slate-800/80 rounded-2xl p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white mb-2 font-['Outfit']">About the Movie</h2>
              <p className="text-sm text-slate-300 leading-relaxed">{movie.description}</p>
            </div>

            <div className="pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block mb-1 font-semibold uppercase tracking-wider text-[10px]">
                  Director
                </span>
                <span className="text-white font-semibold text-sm">{movie.director}</span>
              </div>
              <div>
                <span className="text-slate-500 block mb-1 font-semibold uppercase tracking-wider text-[10px]">
                  Starring Cast
                </span>
                <span className="text-white font-semibold text-sm">
                  {movie.cast && movie.cast.length > 0 ? movie.cast.join(', ') : 'Ensemble Cast'}
                </span>
              </div>
            </div>
          </div>

          {/* Showtimes & Booking Section */}
          <div id="showtimes" className="scroll-mt-24 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-bold text-rose-500 uppercase tracking-wider">Book Your Seats</span>
                <h2 className="text-2xl font-black text-white font-['Outfit']">Theatres & Showtimes</h2>
              </div>
              <span className="text-xs text-slate-400">
                City: <strong className="text-rose-400">{city}</strong>
              </span>
            </div>

            {/* Date Selector Pills */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
              {availableDates.map((item) => (
                <button
                  key={item.dateStr}
                  onClick={() => setSelectedDate(item.dateStr)}
                  className={`px-5 py-2.5 rounded-xl text-center flex-shrink-0 transition ${
                    selectedDate === item.dateStr
                      ? 'bg-rose-600 text-white shadow-lg shadow-rose-950 font-bold'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="text-[10px] uppercase tracking-wider opacity-80">{item.dayName}</div>
                  <div className="text-sm font-bold">{item.monthDay}</div>
                </button>
              ))}
            </div>

            {/* Theatre & Shows List */}
            {Object.keys(showsByTheatre).length === 0 ? (
              <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800">
                <Ticket className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No shows scheduled for {movie.title} on this date in {city}.</p>
                <p className="text-xs text-slate-500 mt-1">Please pick another date or switch your city in the top navigation bar.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(showsByTheatre).map(([theatreId, data]) => (
                  <div
                    key={theatreId}
                    className="bg-[#0e1424] border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/80 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800/60">
                      <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-rose-500 flex-shrink-0" />
                          <span>{data.theatreName}</span>
                        </h3>
                        <p className="text-xs text-slate-400 ml-6">{data.theatreLocation}</p>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                          M-Ticket Available
                        </span>
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                          Food & Beverages
                        </span>
                      </div>
                    </div>

                    {/* Showtimes Buttons */}
                    <div className="flex flex-wrap gap-3">
                      {data.shows.map((show) => (
                        <button
                          key={show.id}
                          onClick={() => navigate(`/seats/${show.id}`)}
                          className="group relative p-3 rounded-xl bg-slate-900 hover:bg-rose-600 border border-slate-800 hover:border-rose-500 text-left transition transform hover:-translate-y-0.5 active:scale-95 shadow-md"
                        >
                          <div className="text-xs font-black text-white group-hover:text-white flex items-center justify-between gap-4">
                            <span>{show.startTime}</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-rose-100 font-normal">
                              Screen {show.screenNumber}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 group-hover:text-rose-100 font-semibold mt-1">
                            Starts ₹{show.pricing.standard}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: User Reviews & Add Review (1 col) */}
        <div className="space-y-6">
          <div className="bg-[#0e1424] border border-slate-800/80 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-['Outfit']">
                <MessageSquare className="w-4 h-4 text-rose-500" />
                <span>Audience Reviews</span>
              </h3>
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-current" />
                {movie.rating.toFixed(1)}
              </span>
            </div>

            {/* Write a review form */}
            <form onSubmit={handleReviewSubmit} className="space-y-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <span className="block text-xs font-bold text-white">Rate & Review this Movie</span>
              
              {/* Star selector */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setUserRating(star)}
                    className="p-1 focus:outline-none"
                  >
                    <Star
                      className={`w-5 h-5 transition ${
                        star <= userRating ? 'text-amber-400 fill-current' : 'text-slate-600'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs text-slate-400 ml-2 font-medium">{userRating} / 5 Stars</span>
              </div>

              <textarea
                placeholder={isAuthenticated ? "Share your thoughts about this movie..." : "Sign in to write a review"}
                disabled={!isAuthenticated || reviewSubmitting}
                value={userComment}
                onChange={(e) => setUserComment(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition resize-none disabled:opacity-50"
              />

              {reviewMessage && (
                <div className="text-xs text-emerald-400 font-semibold">{reviewMessage}</div>
              )}

              <button
                type="submit"
                disabled={!isAuthenticated || reviewSubmitting || !userComment.trim()}
                className="w-full py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{reviewSubmitting ? 'Submitting...' : 'Post Review'}</span>
              </button>

              {!isAuthenticated && (
                <div className="text-[11px] text-slate-400 text-center">
                  <Link to="/login" className="text-rose-400 font-semibold hover:underline">
                    Sign in
                  </Link>{' '}
                  to submit your rating.
                </div>
              )}
            </form>

            {/* Reviews List */}
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {reviews.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500">
                  Be the first to review this movie!
                </div>
              ) : (
                reviews.map((rev) => (
                  <div key={rev.id} className="p-3 bg-slate-900/40 rounded-xl border border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-200 flex items-center gap-1.5">
                        <UserIcon className="w-3 h-3 text-rose-500" />
                        {rev.userName}
                      </span>
                      <div className="flex items-center gap-1 text-amber-400 font-bold text-[11px]">
                        <Star className="w-3 h-3 fill-current" />
                        <span>{rev.rating}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{rev.comment}</p>
                    <div className="text-[10px] text-slate-500">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Trailer Modal */}
      <TrailerModal
        isOpen={isTrailerOpen}
        onClose={() => setIsTrailerOpen(false)}
        trailerUrl={movie.trailerUrl}
        movieTitle={movie.title}
      />
    </div>
  );
};
