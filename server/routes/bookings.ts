import express from 'express';
import mongoose from 'mongoose';
import { Booking, Payment, Show, Movie, Theatre, Seat, Notification } from '../models/index.ts';
import { cleanExpiredLocks } from '../config/db.ts';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.ts';
import { broadcastSeatsUpdated } from '../sockets.ts';

export const bookingsRouter = express.Router();

function generateBookingRef(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let ref = 'IMOV-';
  for (let i = 0; i < 6; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return ref;
}

// POST /api/bookings/checkout-demo
bookingsRouter.post('/checkout-demo', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { showId, seatIds, paymentMethod = 'Demo UPI / Card', simulateFailure = false } = req.body;
    const userId = req.user!._id;

    if (!showId || !seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
      return res.status(400).json({ message: 'Show and selected seats are required.' });
    }

    if (!mongoose.Types.ObjectId.isValid(showId)) {
      return res.status(400).json({ message: 'Invalid show identifier.' });
    }

    const show = await Show.findById(showId);
    if (!show) {
      return res.status(404).json({ message: 'Show not found.' });
    }

    const movie = await Movie.findById(show.movieId);
    const theatre = await Theatre.findById(show.theatreId);

    // If simulated payment failure was requested
    if (simulateFailure) {
      // Release user's held locks in MongoDB
      await Seat.updateMany(
        {
          showId: show._id,
          seatId: { $in: seatIds },
          lockedByUserId: userId,
        },
        {
          $set: {
            status: 'available',
            lockExpiresAt: null,
            lockedByUserId: null,
          },
        }
      );

      broadcastSeatsUpdated(show._id.toString(), {
        seatIds,
        status: 'available',
      });

      return res.status(402).json({
        message: 'Demo Payment Failed (Simulated Test). Your seat locks have been safely released back to the hall.',
        status: 'failed',
      });
    }

    // Clean expired locks across database before confirming
    await cleanExpiredLocks();

    // Verify seats in MongoDB
    const seatsToBook = await Seat.find({
      showId: show._id,
      seatId: { $in: seatIds },
    });

    if (seatsToBook.length !== seatIds.length) {
      return res.status(400).json({ message: 'One or more selected seats were not found in this show.' });
    }

    for (const s of seatsToBook) {
      if (s.status === 'booked') {
        return res.status(409).json({ message: `Seat ${s.seatId} is already booked by another customer.` });
      }
      if (
        s.status === 'locked' &&
        s.lockedByUserId &&
        s.lockedByUserId.toString() !== userId.toString()
      ) {
        return res.status(409).json({ message: `Seat ${s.seatId} lock has expired or is held by someone else.` });
      }
    }

    // Calculate ticket prices strictly on server
    let ticketSubtotal = 0;
    const seatDetails: Array<{ seatId: string; category: string; price: number }> = [];

    for (const s of seatsToBook) {
      ticketSubtotal += s.price;
      seatDetails.push({
        seatId: s.seatId,
        category: s.category,
        price: s.price,
      });
    }

    const taxesAndFees = Math.round(ticketSubtotal * 0.12);
    const totalAmount = ticketSubtotal + taxesAndFees;
    const bookingRef = generateBookingRef();

    // Concurrency-safe atomic seat booking confirmation
    await Seat.updateMany(
      {
        showId: show._id,
        seatId: { $in: seatIds },
      },
      {
        $set: {
          status: 'booked',
          lockExpiresAt: null,
          lockedByUserId: null,
        },
      }
    );

    // Create Booking record
    const booking = await Booking.create({
      bookingRef,
      userId,
      showId: show._id,
      movieId: show.movieId,
      theatreId: show.theatreId,
      screenNumber: show.screenNumber,
      showDate: show.showDate,
      startTime: show.startTime,
      seatIds,
      seatDetails,
      ticketSubtotal,
      taxesAndFees,
      totalAmount,
      bookingStatus: 'confirmed',
      paymentStatus: 'paid',
      paymentMethod,
    });

    // Create separate Payment record linked to Booking & User
    const payment = await Payment.create({
      bookingId: booking._id,
      bookingRef,
      userId,
      amount: totalAmount,
      currency: 'INR',
      paymentMethod,
      provider: 'Demo Gateway (Simulated)',
      transactionRef: `TXN-DEMO-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: 'successful',
      isDemo: true,
    });

    booking.paymentId = payment._id as any;
    await booking.save();

    // Create Notification
    await Notification.create({
      userId,
      title: 'Booking Confirmed!',
      message: `Your booking for "${movie?.title}" at ${theatre?.name} is confirmed. Ref: ${bookingRef}`,
      type: 'booking',
      read: false,
    });

    // Real-time Socket.IO broadcast
    broadcastSeatsUpdated(show._id.toString(), {
      seatIds,
      status: 'booked',
    });

    res.status(201).json({
      message: 'Booking confirmed successfully!',
      booking: {
        id: booking._id.toString(),
        _id: booking._id.toString(),
        bookingRef: booking.bookingRef,
        userId: booking.userId.toString(),
        showId: booking.showId.toString(),
        movieId: booking.movieId.toString(),
        theatreId: booking.theatreId.toString(),
        screenNumber: booking.screenNumber,
        showDate: booking.showDate,
        startTime: booking.startTime,
        seatIds: booking.seatIds,
        seatDetails: booking.seatDetails,
        ticketSubtotal: booking.ticketSubtotal,
        taxesAndFees: booking.taxesAndFees,
        totalAmount: booking.totalAmount,
        bookingStatus: booking.bookingStatus,
        paymentStatus: booking.paymentStatus,
        paymentMethod: booking.paymentMethod,
        paymentId: payment._id.toString(),
        createdAt: booking.createdAt,
        movieTitle: movie?.title,
        moviePoster: movie?.posterUrl,
        theatreName: theatre?.name,
        theatreLocation: theatre?.location,
        theatreCity: theatre?.city,
      },
    });
  } catch (err: any) {
    console.error('Error during demo checkout:', err);
    res.status(500).json({ message: err.message || 'Error processing booking' });
  }
});

// GET /api/bookings/my
bookingsRouter.get('/my', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!._id;

    const bookings = await Booking.find({ userId })
      .populate('movieId')
      .populate('theatreId')
      .sort({ createdAt: -1 });

    const formatted = bookings.map((b: any) => {
      const movie = b.movieId;
      const theatre = b.theatreId;
      return {
        id: b._id.toString(),
        _id: b._id.toString(),
        bookingRef: b.bookingRef,
        movieId: movie?._id?.toString() || b.movieId?.toString(),
        theatreId: theatre?._id?.toString() || b.theatreId?.toString(),
        screenNumber: b.screenNumber,
        showDate: b.showDate,
        startTime: b.startTime,
        seatIds: b.seatIds,
        seatDetails: b.seatDetails,
        ticketSubtotal: b.ticketSubtotal,
        taxesAndFees: b.taxesAndFees,
        totalAmount: b.totalAmount,
        bookingStatus: b.bookingStatus,
        paymentStatus: b.paymentStatus,
        paymentMethod: b.paymentMethod,
        createdAt: b.createdAt,
        movieTitle: movie?.title || 'Unknown Movie',
        moviePoster: movie?.posterUrl || '',
        movieLanguage: movie?.language || '',
        movieCertification: movie?.certification || '',
        theatreName: theatre?.name || 'Unknown Theatre',
        theatreLocation: theatre?.location || '',
        theatreCity: theatre?.city || '',
      };
    });

    res.json({ bookings: formatted });
  } catch (err: any) {
    console.error('Error fetching user bookings:', err);
    res.status(500).json({ message: err.message || 'Error fetching user bookings' });
  }
});

// GET /api/bookings/:id
bookingsRouter.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    let booking: any = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      booking = await Booking.findById(id).populate('movieId').populate('theatreId');
    }
    if (!booking) {
      booking = await Booking.findOne({ bookingRef: id }).populate('movieId').populate('theatreId');
    }

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    // Access authorization: user ownership or admin
    if (booking.userId.toString() !== req.user!._id.toString() && req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const movie = booking.movieId;
    const theatre = booking.theatreId;

    res.json({
      booking: {
        id: booking._id.toString(),
        _id: booking._id.toString(),
        bookingRef: booking.bookingRef,
        userId: booking.userId.toString(),
        showId: booking.showId.toString(),
        movieId: movie?._id?.toString(),
        theatreId: theatre?._id?.toString(),
        screenNumber: booking.screenNumber,
        showDate: booking.showDate,
        startTime: booking.startTime,
        seatIds: booking.seatIds,
        seatDetails: booking.seatDetails,
        ticketSubtotal: booking.ticketSubtotal,
        taxesAndFees: booking.taxesAndFees,
        totalAmount: booking.totalAmount,
        bookingStatus: booking.bookingStatus,
        paymentStatus: booking.paymentStatus,
        paymentMethod: booking.paymentMethod,
        paymentId: booking.paymentId?.toString(),
        createdAt: booking.createdAt,
        movieTitle: movie?.title || 'Unknown Movie',
        moviePoster: movie?.posterUrl || '',
        movieLanguage: movie?.language || '',
        movieCertification: movie?.certification || '',
        theatreName: theatre?.name || 'Unknown Theatre',
        theatreLocation: theatre?.location || '',
        theatreCity: theatre?.city || '',
      },
    });
  } catch (err: any) {
    console.error('Error fetching booking details:', err);
    res.status(500).json({ message: err.message || 'Error fetching booking details' });
  }
});

// POST /api/bookings/:id/cancel
bookingsRouter.post('/:id/cancel', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    let booking = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      booking = await Booking.findById(id);
    }
    if (!booking) {
      booking = await Booking.findOne({ bookingRef: id });
    }

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    if (booking.userId.toString() !== req.user!._id.toString() && req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    if (booking.bookingStatus === 'cancelled') {
      return res.status(400).json({ message: 'This booking is already cancelled.' });
    }

    booking.bookingStatus = 'cancelled';
    booking.paymentStatus = 'refunded';
    await booking.save();

    // Update payment record
    if (booking.paymentId) {
      await Payment.findByIdAndUpdate(booking.paymentId, { status: 'refunded' });
    }

    // Release booked seats back to available in MongoDB
    await Seat.updateMany(
      {
        showId: booking.showId,
        seatId: { $in: booking.seatIds },
      },
      {
        $set: {
          status: 'available',
          lockExpiresAt: null,
          lockedByUserId: null,
        },
      }
    );

    // Socket.IO broadcast
    broadcastSeatsUpdated(booking.showId.toString(), {
      seatIds: booking.seatIds,
      status: 'available',
    });

    // In-app Notification
    await Notification.create({
      userId: booking.userId,
      title: 'Booking Cancelled',
      message: `Your booking ${booking.bookingRef} has been cancelled. Demo refund of ₹${booking.totalAmount} has been credited.`,
      type: 'cancellation',
      read: false,
    });

    res.json({
      message: 'Booking cancelled successfully. Seats have been released.',
      booking,
    });
  } catch (err: any) {
    console.error('Error cancelling booking:', err);
    res.status(500).json({ message: err.message || 'Error cancelling booking' });
  }
});
