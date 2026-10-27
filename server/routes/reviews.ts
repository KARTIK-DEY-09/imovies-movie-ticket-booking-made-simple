import express from 'express';
import mongoose from 'mongoose';
import { Review, Movie } from '../models/index.ts';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.ts';

export const reviewsRouter = express.Router();

// GET /api/reviews/movie/:id
reviewsRouter.get('/movie/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let movieId = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      movieId = new mongoose.Types.ObjectId(id);
    } else {
      const movie = await Movie.findOne({ slug: id });
      if (movie) movieId = movie._id;
    }

    if (!movieId) {
      return res.json({ reviews: [] });
    }

    const reviews = await Review.find({ movieId }).sort({ createdAt: -1 });
    res.json({ reviews });
  } catch (err: any) {
    console.error('Error fetching reviews:', err);
    res.status(500).json({ message: err.message || 'Error fetching reviews' });
  }
});

// POST /api/reviews/movie/:id
reviewsRouter.post('/movie/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const user = req.user!;
    const { rating, comment } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({ message: 'Rating and comment are required.' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
    }

    let movie = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      movie = await Movie.findById(id);
    } else {
      movie = await Movie.findOne({ slug: id });
    }

    if (!movie) {
      return res.status(404).json({ message: 'Movie not found.' });
    }

    // Upsert or update review for this user & movie
    const review = await Review.findOneAndUpdate(
      { userId: user._id, movieId: movie._id },
      {
        $set: {
          userName: user.username,
          rating: Number(rating),
          comment: comment.trim(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Recalculate average rating for the movie
    const allMovieReviews = await Review.find({ movieId: movie._id });
    const avg = allMovieReviews.reduce((sum, r) => sum + r.rating, 0) / allMovieReviews.length;
    movie.rating = Number(avg.toFixed(1));
    await movie.save();

    res.status(201).json({ message: 'Review posted successfully!', review });
  } catch (err: any) {
    console.error('Error posting review:', err);
    res.status(500).json({ message: err.message || 'Error posting review' });
  }
});

// DELETE /api/reviews/:id
reviewsRouter.delete('/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found.' });
    }

    if (review.userId.toString() !== req.user!._id.toString() && req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const movieId = review.movieId;
    await Review.findByIdAndDelete(review._id);

    // Recalculate average rating
    const allRemaining = await Review.find({ movieId });
    if (allRemaining.length > 0) {
      const avg = allRemaining.reduce((sum, r) => sum + r.rating, 0) / allRemaining.length;
      await Movie.findByIdAndUpdate(movieId, { rating: Number(avg.toFixed(1)) });
    }

    res.json({ message: 'Review deleted successfully.' });
  } catch (err: any) {
    console.error('Error deleting review:', err);
    res.status(500).json({ message: err.message || 'Error deleting review' });
  }
});
