import express from 'express';
import mongoose from 'mongoose';
import { Show, Movie, Theatre, Seat, Booking } from '../models/index.ts';
import { generateSeatsForShow } from '../config/db.ts';
import { authMiddleware, adminOnly } from '../middleware/auth.ts';

export const showsRouter = express.Router();

// GET /api/shows
showsRouter.get('/', async (req, res) => {
  try {
    const { movieId, theatreId, date, city } = req.query as Record<string, string>;
    const query: any = { status: 'active' };

    if (movieId && mongoose.Types.ObjectId.isValid(movieId)) {
      query.movieId = new mongoose.Types.ObjectId(movieId);
    }
    if (theatreId && mongoose.Types.ObjectId.isValid(theatreId)) {
      query.theatreId = new mongoose.Types.ObjectId(theatreId);
    }
    if (date) {
      query.showDate = date;
    }

    const shows = await Show.find(query)
      .populate('movieId')
      .populate('theatreId')
      .sort({ showDate: 1, startTime: 1 });

    let enriched = shows.map((s: any) => {
      const movie = s.movieId;
      const theatre = s.theatreId;
      return {
        id: s._id.toString(),
        _id: s._id.toString(),
        movieId: movie?._id?.toString() || s.movieId?.toString(),
        theatreId: theatre?._id?.toString() || s.theatreId?.toString(),
        screenNumber: s.screenNumber,
        showDate: s.showDate,
        startTime: s.startTime,
        pricing: s.pricing,
        status: s.status,
        createdAt: s.createdAt,
        movieTitle: movie?.title || 'Unknown Movie',
        moviePoster: movie?.posterUrl || '',
        movieLanguage: movie?.language || '',
        movieCertification: movie?.certification || '',
        theatreName: theatre?.name || 'Unknown Theatre',
        theatreLocation: theatre?.location || '',
        theatreCity: theatre?.city || '',
      };
    });

    if (city && city !== 'all') {
      enriched = enriched.filter(
        (s) => s.theatreCity.toLowerCase() === city.toLowerCase()
      );
    }

    res.json({ shows: enriched });
  } catch (err: any) {
    console.error('Error fetching shows:', err);
    res.status(500).json({ message: err.message || 'Error fetching shows' });
  }
});

// GET /api/shows/:id
showsRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: 'Invalid show identifier' });
    }

    const show: any = await Show.findById(id).populate('movieId').populate('theatreId');
    if (!show) {
      return res.status(404).json({ message: 'Show not found' });
    }

    res.json({
      show: {
        id: show._id.toString(),
        _id: show._id.toString(),
        movieId: show.movieId?._id?.toString(),
        theatreId: show.theatreId?._id?.toString(),
        screenNumber: show.screenNumber,
        showDate: show.showDate,
        startTime: show.startTime,
        pricing: show.pricing,
        status: show.status,
        movie: show.movieId,
        theatre: show.theatreId,
      },
    });
  } catch (err: any) {
    console.error('Error fetching show detail:', err);
    res.status(500).json({ message: err.message || 'Error fetching show detail' });
  }
});

// POST /api/shows (Admin only)
showsRouter.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { movieId, theatreId, screenNumber, showDate, startTime, pricing } = req.body;

    if (!movieId || !theatreId || !screenNumber || !showDate || !startTime) {
      return res.status(400).json({ message: 'Movie, theatre, screen, date, and time are required.' });
    }

    // Verify movie and theatre exist in DB
    const movie = await Movie.findById(movieId);
    const theatre = await Theatre.findById(theatreId);
    if (!movie || !theatre) {
      return res.status(404).json({ message: 'Selected movie or theatre does not exist in the database.' });
    }

    // Check scheduling conflict: screen clash on same theatre, screen, date, and time
    const conflicting = await Show.findOne({
      theatreId: theatre._id,
      screenNumber: Number(screenNumber),
      showDate,
      startTime,
      status: 'active',
    });

    if (conflicting) {
      return res.status(409).json({
        message: `Conflict detected: Screen ${screenNumber} at ${theatre.name} already has a show scheduled at ${startTime} on ${showDate}.`,
      });
    }

    const showPricing = {
      standard: Number(pricing?.standard) || 200,
      premium: Number(pricing?.premium) || 320,
      recliner: Number(pricing?.recliner) || 480,
    };

    const newShow = await Show.create({
      movieId: movie._id,
      theatreId: theatre._id,
      screenNumber: Number(screenNumber),
      showDate,
      startTime,
      pricing: showPricing,
      status: 'active',
    });

    // Generate fresh seat inventory for this show in MongoDB
    await generateSeatsForShow(newShow._id, showPricing);

    res.status(201).json({
      message: 'Show created and real-time seat inventory generated in database!',
      show: newShow,
    });
  } catch (err: any) {
    console.error('Error creating show:', err);
    res.status(500).json({ message: err.message || 'Error creating show' });
  }
});

// DELETE /api/shows/:id (Admin only)
showsRouter.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const show = await Show.findById(id);
    if (!show) {
      return res.status(404).json({ message: 'Show not found' });
    }

    // Check if confirmed bookings exist
    const hasBookings = await Booking.findOne({ showId: show._id, bookingStatus: 'confirmed' });
    if (hasBookings) {
      show.status = 'cancelled';
      await show.save();
      return res.json({
        message: 'Show has confirmed bookings. Marked as cancelled to preserve customer records.',
      });
    }

    // Delete show and associated seat inventory
    await Seat.deleteMany({ showId: show._id });
    await Show.findByIdAndDelete(show._id);

    res.json({ message: 'Show and seat layout removed successfully.' });
  } catch (err: any) {
    console.error('Error deleting show:', err);
    res.status(500).json({ message: err.message || 'Error deleting show' });
  }
});
