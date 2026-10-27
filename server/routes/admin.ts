import express from 'express';
import { User, Movie, Theatre, Show, Booking, Review, Payment } from '../models/index.ts';
import { authMiddleware, adminOnly } from '../middleware/auth.ts';

export const adminRouter = express.Router();

adminRouter.use(authMiddleware, adminOnly);

// GET /api/admin/dashboard
adminRouter.get('/dashboard', async (_req, res) => {
  try {
    const allBookings = await Booking.find()
      .populate('movieId')
      .populate('theatreId')
      .populate('userId');

    const confirmedBookings = allBookings.filter((b) => b.bookingStatus === 'confirmed');
    const cancelledBookings = allBookings.filter((b) => b.bookingStatus === 'cancelled');

    const totalRevenue = confirmedBookings.reduce((sum, b) => sum + b.totalAmount, 0);
    const totalTicketsSold = confirmedBookings.reduce((sum, b) => sum + b.seatIds.length, 0);

    const moviesCount = await Movie.countDocuments();
    const theatresCount = await Theatre.countDocuments();
    const usersCount = await User.countDocuments();
    const showsCount = await Show.countDocuments();

    // Recent 10 bookings
    const recentBookings = allBookings
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
      .map((b: any) => ({
        id: b._id.toString(),
        _id: b._id.toString(),
        bookingRef: b.bookingRef,
        movieTitle: b.movieId?.title || 'Unknown Movie',
        theatreName: b.theatreId?.name || 'Unknown Theatre',
        userName: b.userId?.username || 'Customer',
        userEmail: b.userId?.email || '',
        showDate: b.showDate,
        startTime: b.startTime,
        seatIds: b.seatIds,
        totalAmount: b.totalAmount,
        bookingStatus: b.bookingStatus,
        createdAt: b.createdAt,
      }));

    // Calculate revenue per theatre
    const theatreRevenueMap: Record<string, { name: string; revenue: number; bookings: number }> = {};
    for (const b of confirmedBookings as any[]) {
      const thId = b.theatreId?._id?.toString() || 'unknown';
      const thName = b.theatreId?.name || 'Unknown Theatre';
      if (!theatreRevenueMap[thId]) {
        theatreRevenueMap[thId] = { name: thName, revenue: 0, bookings: 0 };
      }
      theatreRevenueMap[thId].revenue += b.totalAmount;
      theatreRevenueMap[thId].bookings += 1;
    }

    // Calculate revenue and tickets per movie
    const moviePopularityMap: Record<string, { title: string; tickets: number; revenue: number }> = {};
    for (const b of confirmedBookings as any[]) {
      const movId = b.movieId?._id?.toString() || 'unknown';
      const movTitle = b.movieId?.title || 'Unknown Movie';
      if (!moviePopularityMap[movId]) {
        moviePopularityMap[movId] = { title: movTitle, tickets: 0, revenue: 0 };
      }
      moviePopularityMap[movId].tickets += b.seatIds.length;
      moviePopularityMap[movId].revenue += b.totalAmount;
    }

    res.json({
      stats: {
        totalRevenue,
        totalTicketsSold,
        totalBookings: allBookings.length,
        confirmedBookingsCount: confirmedBookings.length,
        cancelledBookingsCount: cancelledBookings.length,
        moviesCount,
        theatresCount,
        usersCount,
        showsCount,
      },
      recentBookings,
      theatreRevenue: Object.values(theatreRevenueMap),
      popularMovies: Object.values(moviePopularityMap).sort((a, b) => b.revenue - a.revenue),
    });
  } catch (err: any) {
    console.error('Error in admin dashboard:', err);
    res.status(500).json({ message: err.message || 'Error fetching admin dashboard metrics' });
  }
});

// GET /api/admin/users
adminRouter.get('/users', async (_req, res) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    const allBookings = await Booking.find();

    const usersEnriched = users.map((u) => {
      const userBookings = allBookings.filter((b) => b.userId.toString() === u._id.toString());
      const totalSpent = userBookings
        .filter((b) => b.bookingStatus === 'confirmed')
        .reduce((sum, b) => sum + b.totalAmount, 0);

      return {
        id: u._id.toString(),
        _id: u._id.toString(),
        username: u.username,
        email: u.email,
        phone: u.phone,
        role: u.role,
        avatar: u.avatar,
        createdAt: u.createdAt,
        totalBookings: userBookings.length,
        totalSpent,
      };
    });

    res.json({ users: usersEnriched });
  } catch (err: any) {
    console.error('Error fetching admin users:', err);
    res.status(500).json({ message: err.message || 'Error fetching users' });
  }
});

// GET /api/admin/bookings
adminRouter.get('/bookings', async (_req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('movieId')
      .populate('theatreId')
      .populate('userId')
      .sort({ createdAt: -1 });

    const formatted = bookings.map((b: any) => ({
      id: b._id.toString(),
      _id: b._id.toString(),
      bookingRef: b.bookingRef,
      userName: b.userId?.username || 'Customer',
      userEmail: b.userId?.email || '',
      movieTitle: b.movieId?.title || 'Unknown Movie',
      theatreName: b.theatreId?.name || 'Unknown Theatre',
      screenNumber: b.screenNumber,
      showDate: b.showDate,
      startTime: b.startTime,
      seatIds: b.seatIds,
      totalAmount: b.totalAmount,
      bookingStatus: b.bookingStatus,
      paymentStatus: b.paymentStatus,
      paymentMethod: b.paymentMethod,
      createdAt: b.createdAt,
    }));

    res.json({ bookings: formatted });
  } catch (err: any) {
    console.error('Error fetching admin bookings:', err);
    res.status(500).json({ message: err.message || 'Error fetching bookings' });
  }
});

// GET /api/admin/reviews
adminRouter.get('/reviews', async (_req, res) => {
  try {
    const reviews = await Review.find().populate('movieId').sort({ createdAt: -1 });
    const formatted = reviews.map((r: any) => ({
      id: r._id.toString(),
      _id: r._id.toString(),
      userName: r.userName,
      movieTitle: r.movieId?.title || 'Unknown Movie',
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
    }));

    res.json({ reviews: formatted });
  } catch (err: any) {
    console.error('Error fetching admin reviews:', err);
    res.status(500).json({ message: err.message || 'Error fetching reviews' });
  }
});

// GET /api/admin/reports
adminRouter.get('/reports', async (_req, res) => {
  try {
    const confirmed = await Booking.find({ bookingStatus: 'confirmed' });

    const dailyMap: Record<string, { date: string; revenue: number; tickets: number }> = {};
    for (const b of confirmed) {
      const d = b.showDate || (b.createdAt ? b.createdAt.toISOString().split('T')[0] : '2026-10-27');
      if (!dailyMap[d]) {
        dailyMap[d] = { date: d, revenue: 0, tickets: 0 };
      }
      dailyMap[d].revenue += b.totalAmount;
      dailyMap[d].tickets += b.seatIds.length;
    }

    const grossSales = confirmed.reduce((sum, b) => sum + b.totalAmount, 0);
    const netTickets = confirmed.reduce((sum, b) => sum + b.seatIds.length, 0);

    res.json({
      dailyReports: Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date)),
      summary: {
        grossSales,
        netTickets,
        avgTicketPrice: Math.round(grossSales / Math.max(1, netTickets)),
      },
    });
  } catch (err: any) {
    console.error('Error fetching admin reports:', err);
    res.status(500).json({ message: err.message || 'Error generating reports' });
  }
});
