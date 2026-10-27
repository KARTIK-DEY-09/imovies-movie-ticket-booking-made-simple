import express from 'express';
import mongoose from 'mongoose';
import { Movie, Theatre, Show, Booking, Review } from '../models/index.ts';
import { authMiddleware, adminOnly } from '../middleware/auth.ts';

export const moviesRouter = express.Router();

// GET /api/movies
moviesRouter.get('/', async (req, res) => {
  try {
    const { search, genre, language, status, city, sort, page = '1', limit = '50' } = req.query as Record<string, string>;

    const query: any = {};

    // Search query
    if (search && search.trim() !== '') {
      const q = search.trim();
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { director: { $regex: q, $options: 'i' } },
        { cast: { $elemMatch: { $regex: q, $options: 'i' } } },
      ];
    }

    // Genre filter
    if (genre && genre !== 'all') {
      query.genre = { $regex: new RegExp(`^${genre.trim()}$`, 'i') };
    }

    // Language filter
    if (language && language !== 'all') {
      query.language = { $regex: language.trim(), $options: 'i' };
    }

    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // City filter: Find theatres in that city, then shows for those theatres, then movie IDs
    if (city && city !== 'all') {
      const theatresInCity = await Theatre.find({
        city: { $regex: new RegExp(`^${city.trim()}$`, 'i') },
        active: true,
      }).select('_id');

      const theatreIds = theatresInCity.map((t) => t._id);
      const activeShows = await Show.find({
        theatreId: { $in: theatreIds },
        status: 'active',
      }).select('movieId');

      const movieIds = [...new Set(activeShows.map((s) => s.movieId.toString()))];
      query._id = { $in: movieIds };
    }

    // Sorting
    let sortOption: any = { rating: -1 };
    if (sort === 'releaseDate') {
      sortOption = { releaseDate: -1 };
    } else if (sort === 'title') {
      sortOption = { title: 1 };
    } else if (sort === 'rating') {
      sortOption = { rating: -1 };
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));

    const total = await Movie.countDocuments(query);
    const movies = await Movie.find(query)
      .sort(sortOption)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    res.json({
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      movies,
    });
  } catch (err: any) {
    console.error('Error fetching movies:', err);
    res.status(500).json({ message: err.message || 'Error fetching movies' });
  }
});

// GET /api/movies/:id
moviesRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let movie = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      movie = await Movie.findById(id);
    }
    if (!movie) {
      movie = await Movie.findOne({ slug: id });
    }

    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    // Calculate real average rating from Review collection
    const reviews = await Review.find({ movieId: movie._id });
    let averageRating = movie.rating;
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, curr) => acc + curr.rating, 0);
      averageRating = Number((sum / reviews.length).toFixed(1));
    }

    res.json({
      movie: {
        ...movie.toJSON(),
        rating: averageRating,
        reviewCount: reviews.length,
      },
    });
  } catch (err: any) {
    console.error('Error fetching movie details:', err);
    res.status(500).json({ message: err.message || 'Error fetching movie details' });
  }
});

// POST /api/movies (Admin only)
moviesRouter.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const {
      title,
      description,
      genre,
      language,
      durationMinutes,
      releaseDate,
      certification,
      cast,
      director,
      posterUrl,
      backdropUrl,
      trailerUrl,
      rating,
      status,
    } = req.body;

    if (!title || !description || !language) {
      return res.status(400).json({ message: 'Title, description, and language are required.' });
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const newMovie = await Movie.create({
      title: title.trim(),
      slug,
      description: description.trim(),
      genre: Array.isArray(genre)
        ? genre
        : (genre ? genre.split(',').map((g: string) => g.trim()) : ['Action']),
      language: language.trim(),
      durationMinutes: Number(durationMinutes) || 120,
      releaseDate: releaseDate || new Date().toISOString().split('T')[0],
      certification: certification || 'U/A',
      cast: Array.isArray(cast)
        ? cast
        : (cast ? cast.split(',').map((c: string) => c.trim()) : []),
      director: director?.trim() || 'Director',
      posterUrl: posterUrl?.trim() || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80',
      backdropUrl: backdropUrl?.trim() || '',
      trailerUrl: trailerUrl?.trim() || '',
      rating: Number(rating) || 4.5,
      status: status || 'now-showing',
    });

    res.status(201).json({ message: 'Movie created successfully', movie: newMovie });
  } catch (err: any) {
    console.error('Error creating movie:', err);
    res.status(500).json({ message: err.message || 'Error creating movie' });
  }
});

// PUT /api/movies/:id (Admin only)
moviesRouter.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const movie = await Movie.findById(id);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    const updates = req.body;
    if (updates.title) movie.title = updates.title.trim();
    if (updates.description) movie.description = updates.description.trim();
    if (updates.language) movie.language = updates.language.trim();
    if (updates.durationMinutes) movie.durationMinutes = Number(updates.durationMinutes);
    if (updates.releaseDate) movie.releaseDate = updates.releaseDate;
    if (updates.certification) movie.certification = updates.certification;
    if (updates.director) movie.director = updates.director.trim();
    if (updates.posterUrl) movie.posterUrl = updates.posterUrl.trim();
    if (updates.backdropUrl !== undefined) movie.backdropUrl = updates.backdropUrl.trim();
    if (updates.trailerUrl !== undefined) movie.trailerUrl = updates.trailerUrl.trim();
    if (updates.rating) movie.rating = Number(updates.rating);
    if (updates.status) movie.status = updates.status;

    if (updates.genre) {
      movie.genre = Array.isArray(updates.genre)
        ? updates.genre
        : updates.genre.split(',').map((g: string) => g.trim());
    }
    if (updates.cast) {
      movie.cast = Array.isArray(updates.cast)
        ? updates.cast
        : updates.cast.split(',').map((c: string) => c.trim());
    }

    await movie.save();
    res.json({ message: 'Movie updated successfully', movie });
  } catch (err: any) {
    console.error('Error updating movie:', err);
    res.status(500).json({ message: err.message || 'Error updating movie' });
  }
});

// DELETE /api/movies/:id (Admin only)
moviesRouter.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const movie = await Movie.findById(id);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    // Safety: check confirmed bookings
    const confirmedBooking = await Booking.findOne({
      movieId: movie._id,
      bookingStatus: 'confirmed',
    });

    if (confirmedBooking) {
      movie.status = 'inactive';
      await movie.save();
      return res.json({
        message: 'Movie has confirmed bookings. Marked as inactive to preserve customer ticket history.',
      });
    }

    await Movie.findByIdAndDelete(movie._id);
    res.json({ message: 'Movie deleted successfully' });
  } catch (err: any) {
    console.error('Error deleting movie:', err);
    res.status(500).json({ message: err.message || 'Error deleting movie' });
  }
});
