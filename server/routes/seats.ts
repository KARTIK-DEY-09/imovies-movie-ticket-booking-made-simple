import express from 'express';
import mongoose from 'mongoose';
import { Seat, Show } from '../models/index.ts';
import { cleanExpiredLocks, generateSeatsForShow } from '../config/db.ts';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.ts';
import { broadcastSeatsUpdated } from '../sockets.ts';

export const seatsRouter = express.Router();

// GET /api/shows/:id/seats
seatsRouter.get('/:id/seats', async (req, res) => {
  try {
    const showId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(showId)) {
      return res.status(404).json({ message: 'Invalid show identifier' });
    }

    // Free up any expired seat locks first
    await cleanExpiredLocks();

    let seats = await Seat.find({ showId: new mongoose.Types.ObjectId(showId) }).sort({
      row: 1,
      number: 1,
    });

    // If seats haven't been generated yet, auto-generate from show pricing
    if (seats.length === 0) {
      const show = await Show.findById(showId);
      if (show) {
        await generateSeatsForShow(show._id, show.pricing);
        seats = await Seat.find({ showId: new mongoose.Types.ObjectId(showId) }).sort({
          row: 1,
          number: 1,
        });
      }
    }

    res.json({ seats });
  } catch (err: any) {
    console.error('Error fetching seats:', err);
    res.status(500).json({ message: err.message || 'Error fetching seats' });
  }
});

// POST /api/shows/:id/lock-seats
seatsRouter.post('/:id/lock-seats', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const showId = req.params.id;
    const { seatIds } = req.body;
    const userId = req.user!._id;

    if (!mongoose.Types.ObjectId.isValid(showId)) {
      return res.status(400).json({ message: 'Invalid show identifier' });
    }

    if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
      return res.status(400).json({ message: 'seatIds array is required.' });
    }

    if (seatIds.length > 8) {
      return res.status(400).json({ message: 'Maximum 8 tickets can be booked per transaction.' });
    }

    // Clean expired locks across database first
    await cleanExpiredLocks();

    const now = new Date();
    const lockExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes atomic lock

    // Concurrency verification: Query requested seats for this show
    const existingSeats = await Seat.find({
      showId: new mongoose.Types.ObjectId(showId),
      seatId: { $in: seatIds },
    });

    if (existingSeats.length !== seatIds.length) {
      return res.status(400).json({ message: 'One or more selected seats were not found in this hall.' });
    }

    for (const seat of existingSeats) {
      if (seat.status === 'booked') {
        return res.status(409).json({ message: `Seat ${seat.seatId} is already booked by another moviegoer.` });
      }
      if (
        seat.status === 'locked' &&
        seat.lockedByUserId &&
        seat.lockedByUserId.toString() !== userId.toString()
      ) {
        return res.status(409).json({ message: `Seat ${seat.seatId} is temporarily held by another customer.` });
      }
    }

    // Atomic update in MongoDB
    await Seat.updateMany(
      {
        showId: new mongoose.Types.ObjectId(showId),
        seatId: { $in: seatIds },
        status: { $in: ['available', 'locked'] },
      },
      {
        $set: {
          status: 'locked',
          lockExpiresAt,
          lockedByUserId: userId,
        },
      }
    );

    const updatedSeats = await Seat.find({
      showId: new mongoose.Types.ObjectId(showId),
      seatId: { $in: seatIds },
    });

    // Broadcast live event via Socket.IO
    broadcastSeatsUpdated(showId, {
      seatIds,
      status: 'locked',
      lockedBy: userId.toString(),
    });

    res.json({
      message: 'Seats held successfully for 5 minutes.',
      lockedSeats: updatedSeats,
      expiresAt: lockExpiresAt.getTime(),
    });
  } catch (err: any) {
    console.error('Error locking seats:', err);
    res.status(500).json({ message: err.message || 'Error locking seats' });
  }
});

// POST /api/shows/:id/unlock-seats
seatsRouter.post('/:id/unlock-seats', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const showId = req.params.id;
    const { seatIds } = req.body;
    const userId = req.user!._id;

    if (!mongoose.Types.ObjectId.isValid(showId)) {
      return res.status(400).json({ message: 'Invalid show identifier' });
    }

    if (!seatIds || !Array.isArray(seatIds)) {
      return res.status(400).json({ message: 'seatIds array is required.' });
    }

    await Seat.updateMany(
      {
        showId: new mongoose.Types.ObjectId(showId),
        seatId: { $in: seatIds },
        lockedByUserId: userId,
        status: 'locked',
      },
      {
        $set: {
          status: 'available',
          lockExpiresAt: null,
          lockedByUserId: null,
        },
      }
    );

    // Broadcast live release event via Socket.IO
    broadcastSeatsUpdated(showId, {
      seatIds,
      status: 'available',
    });

    res.json({ message: 'Seats released successfully.' });
  } catch (err: any) {
    console.error('Error unlocking seats:', err);
    res.status(500).json({ message: err.message || 'Error unlocking seats' });
  }
});
