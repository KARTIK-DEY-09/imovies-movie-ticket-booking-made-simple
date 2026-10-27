import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, RotateCcw, Film } from 'lucide-react';
import { apiRequest } from '../services/api.ts';
import { MovieCard, MovieItem } from '../components/MovieCard.tsx';
import { useCity } from '../context/CityContext.tsx';

export const Movies: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { city } = useCity();

  const [movies, setMovies] = useState<MovieItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters from query or state
  const search = searchParams.get('search') || '';
  const genre = searchParams.get('genre') || 'all';
  const language = searchParams.get('language') || 'all';
  const status = searchParams.get('status') || 'all';
  const sort = searchParams.get('sort') || 'rating';

  useEffect(() => {
    async function fetchFilteredMovies() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (genre !== 'all') params.set('genre', genre);
        if (language !== 'all') params.set('language', language);
        if (status !== 'all') params.set('status', status);
        if (sort) params.set('sort', sort);
        params.set('city', city);

        const data = await apiRequest<{ movies: MovieItem[] }>(`/movies?${params.toString()}`);
        setMovies(data.movies || []);
      } catch (err) {
        console.error('Failed to fetch movies:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchFilteredMovies();
  }, [search, genre, language, status, sort, city]);

  const updateFilter = (key: string, value: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value === 'all' || value === '') {
      nextParams.delete(key);
    } else {
      nextParams.set(key, value);
    }
    setSearchParams(nextParams);
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const genresList = ['all', 'Action', 'Drama', 'Sci-Fi', 'Crime', 'Adventure', 'Comedy', 'Thriller', 'Period'];
  const languagesList = ['all', 'Hindi', 'Telugu', 'English', 'Kannada', 'Marathi'];

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Page Header */}
        <div className="border-b border-slate-800 pb-6">
          <h1 className="text-3xl sm:text-4xl font-black text-white font-['Outfit']">
            Explore Movies
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Discover the hottest releases, upcoming tentpoles, and critically acclaimed cinema playing in {city}.
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-slate-900/80 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-xl space-y-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="relative">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Search Title or Cast
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. RRR, Prabhas, Avatar..."
                  value={search}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition"
                />
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Genre Dropdown */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Genre
              </label>
              <select
                value={genre}
                onChange={(e) => updateFilter('genre', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 transition cursor-pointer"
              >
                {genresList.map((g) => (
                  <option key={g} value={g}>
                    {g === 'all' ? 'All Genres' : g}
                  </option>
                ))}
              </select>
            </div>

            {/* Language Dropdown */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => updateFilter('language', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 transition cursor-pointer"
              >
                {languagesList.map((l) => (
                  <option key={l} value={l}>
                    {l === 'all' ? 'All Languages' : l}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Sort By
              </label>
              <select
                value={sort}
                onChange={(e) => updateFilter('sort', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500 transition cursor-pointer"
              >
                <option value="rating">Highest Rated</option>
                <option value="releaseDate">Newest Releases</option>
                <option value="title">Alphabetical (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Status Tabs & Clear Filters */}
          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Status:</span>
              <button
                onClick={() => updateFilter('status', 'all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  status === 'all'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-slate-950 text-slate-300 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => updateFilter('status', 'now-showing')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  status === 'now-showing'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-slate-950 text-slate-300 hover:text-white'
                }`}
              >
                Now Showing
              </button>
              <button
                onClick={() => updateFilter('status', 'coming-soon')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  status === 'coming-soon'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-slate-950 text-slate-300 hover:text-white'
                }`}
              >
                Coming Soon
              </button>
            </div>

            <button
              onClick={clearAllFilters}
              className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 font-semibold transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>
            Showing <strong className="text-white">{movies.length}</strong> movies
          </span>
          <span>Location: <strong className="text-rose-400">{city}</strong></span>
        </div>

        {/* Movies Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-slate-900/60 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : movies.length === 0 ? (
          <div className="text-center py-24 bg-slate-900/30 rounded-3xl border border-slate-800">
            <Film className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No Movies Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              We couldn't find any titles matching your filter criteria. Try resetting or selecting another city.
            </p>
            <button
              onClick={clearAllFilters}
              className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-md transition"
            >
              Reset All Filters
            </button>
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
