import express from 'express';
import { Theatre, Show } from '../models/index.ts';
import { authMiddleware, adminOnly } from '../middleware/auth.ts';

export const theatresRouter = express.Router();

// GET /api/theatres
theatresRouter.get('/', async (req, res) => {
  try {
    const { city } = req.query as { city?: string };
    const query: any = {};

    if (city && city !== 'all') {
      query.city = { $regex: new RegExp(`^${city.trim()}$`, 'i') };
    }

    const theatres = await Theatre.find(query).sort({ name: 1 });
    res.json({ theatres });
  } catch (err: any) {
    console.error('Error fetching theatres:', err);
    res.status(500).json({ message: err.message || 'Error fetching theatres' });
  }
});

// GET /api/theatres/:id
theatresRouter.get('/:id', async (req, res) => {
  try {
    const theatre = await Theatre.findById(req.params.id);
    if (!theatre) {
      return res.status(404).json({ message: 'Theatre not found' });
    }
    res.json({ theatre });
  } catch (err: any) {
    console.error('Error fetching theatre details:', err);
    res.status(500).json({ message: err.message || 'Error fetching theatre details' });
  }
});

// POST /api/theatres (Admin only)
theatresRouter.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, location, address, city, screens } = req.body;

    if (!name || !location || !city) {
      return res.status(400).json({ message: 'Name, location, and city are required.' });
    }

    const newTheatre = await Theatre.create({
      name: name.trim(),
      location: location.trim(),
      address: address?.trim() || location.trim(),
      city: city.trim(),
      screens: Number(screens) || 4,
      active: true,
    });

    res.status(201).json({ message: 'Theatre added successfully', theatre: newTheatre });
  } catch (err: any) {
    console.error('Error creating theatre:', err);
    res.status(500).json({ message: err.message || 'Error creating theatre' });
  }
});

// PUT /api/theatres/:id (Admin only)
theatresRouter.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const theatre = await Theatre.findById(req.params.id);
    if (!theatre) {
      return res.status(404).json({ message: 'Theatre not found' });
    }

    const updates = req.body;
    if (updates.name) theatre.name = updates.name.trim();
    if (updates.location) theatre.location = updates.location.trim();
    if (updates.address) theatre.address = updates.address.trim();
    if (updates.city) theatre.city = updates.city.trim();
    if (updates.screens) theatre.screens = Number(updates.screens);
    if (updates.active !== undefined) theatre.active = Boolean(updates.active);

    await theatre.save();
    res.json({ message: 'Theatre updated successfully', theatre });
  } catch (err: any) {
    console.error('Error updating theatre:', err);
    res.status(500).json({ message: err.message || 'Error updating theatre' });
  }
});

// DELETE /api/theatres/:id (Admin only)
theatresRouter.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const theatre = await Theatre.findById(req.params.id);
    if (!theatre) {
      return res.status(404).json({ message: 'Theatre not found' });
    }

    // Check if active shows exist for this theatre
    const hasActiveShows = await Show.findOne({ theatreId: theatre._id, status: 'active' });
    if (hasActiveShows) {
      theatre.active = false;
      await theatre.save();
      return res.json({
        message: 'Theatre has active showtimes scheduled. Deactivated instead of deleted to protect active bookings.',
      });
    }

    await Theatre.findByIdAndDelete(theatre._id);
    res.json({ message: 'Theatre deleted successfully' });
  } catch (err: any) {
    console.error('Error deleting theatre:', err);
    res.status(500).json({ message: err.message || 'Error deleting theatre' });
  }
});
