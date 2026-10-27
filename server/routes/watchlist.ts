import express from 'express';
import mongoose from 'mongoose';
import { User, Movie } from '../models/index.ts';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.ts';

export const watchlistRouter = express.Router();

// GET /api/users/watchlist
watchlistRouter.get('/', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await User.findById(req.user!._id).populate('watchlist');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ watchlist: user.watchlist || [] });
  } catch (err: any) {
    console.error('Error fetching watchlist:', err);
    res.status(500).json({ message: err.message || 'Error fetching watchlist' });
  }
});

// POST /api/users/watchlist/:movieId
watchlistRouter.post('/:movieId', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { movieId } = req.params;
    let movie = null;

    if (mongoose.Types.ObjectId.isValid(movieId)) {
      movie = await Movie.findById(movieId);
    }
    if (!movie) {
      movie = await Movie.findOne({ slug: movieId });
    }

    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    const user = await User.findById(req.user!._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const movieObjId = movie._id as mongoose.Types.ObjectId;
    const exists = user.watchlist.some((id) => id.toString() === movieObjId.toString());

    if (!exists) {
      user.watchlist.push(movieObjId);
      await user.save();
    }

    res.json({
      message: 'Added to watchlist',
      watchlist: user.watchlist.map((id) => id.toString()),
    });
  } catch (err: any) {
    console.error('Error adding to watchlist:', err);
    res.status(500).json({ message: err.message || 'Error adding to watchlist' });
  }
});

// DELETE /api/users/watchlist/:movieId
watchlistRouter.delete('/:movieId', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { movieId } = req.params;
    const user = await User.findById(req.user!._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.watchlist = user.watchlist.filter((id) => id.toString() !== movieId.toString());
    await user.save();

    res.json({
      message: 'Removed from watchlist',
      watchlist: user.watchlist.map((id) => id.toString()),
    });
  } catch (err: any) {
    console.error('Error removing from watchlist:', err);
    res.status(500).json({ message: err.message || 'Error removing from watchlist' });
  }
});
