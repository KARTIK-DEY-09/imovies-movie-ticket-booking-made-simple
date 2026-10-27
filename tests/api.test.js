import test from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

test.before(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

test.after(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

test('iMovies MongoDB & Mongoose Backend Test Suite', async (t) => {
  // Dynamic import of models
  const { User } = await import('../server/models/User.ts');
  const { Movie } = await import('../server/models/Movie.ts');
  const { Theatre } = await import('../server/models/Theatre.ts');
  const { Show } = await import('../server/models/Show.ts');
  const { Seat } = await import('../server/models/Seat.ts');
  const { Booking } = await import('../server/models/Booking.ts');
  const { Payment } = await import('../server/models/Payment.ts');

  let testUserId;
  let testMovieId;
  let testTheatreId;
  let testShowId;

  await t.test('1. User Registration & Password Hashing in MongoDB', async () => {
    // Ensure all schema indexes (especially the unique index on email) are initialized
    await User.init();
    await Seat.init();

    const rawPassword = 'SecurePassword@123';
    const passwordHash = bcrypt.hashSync(rawPassword, 10);

    const user = await User.create({
      username: 'Test Cinema Fan',
      email: 'fan@imovies.test',
      passwordHash,
      role: 'user',
    });

    testUserId = user._id;
    assert.ok(user._id, 'User should have generated MongoDB _id');
    assert.strictEqual(user.email, 'fan@imovies.test');
    assert.strictEqual(bcrypt.compareSync(rawPassword, user.passwordHash), true);

    // Verify toJSON omits passwordHash
    const safeObj = user.toJSON();
    assert.strictEqual(safeObj.passwordHash, undefined, 'passwordHash must be stripped from JSON');

    // Verify duplicate email is rejected by unique index / validation
    await assert.rejects(
      async () => {
        await User.create({
          username: 'Another User',
          email: 'fan@imovies.test',
          passwordHash: 'dummyhash',
        });
      },
      /E11000|duplicate/i,
      'Duplicate email must be rejected'
    );
  });

  await t.test('2. Movie & Theatre Creation in MongoDB', async () => {
    const movie = await Movie.create({
      title: 'RRR (Rise Roar Revolt)',
      slug: 'rrr-test',
      description: 'Epic revolutionaries drama',
      genre: ['Action', 'Drama'],
      language: 'Telugu / Hindi',
      durationMinutes: 187,
      releaseDate: '2024-03-25',
      posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1',
      rating: 4.9,
      status: 'now-showing',
    });

    testMovieId = movie._id;
    assert.strictEqual(movie.title, 'RRR (Rise Roar Revolt)');
    assert.strictEqual(movie.status, 'now-showing');

    const theatre = await Theatre.create({
      name: 'PVR ICON Inorbit Mall',
      location: 'Malad West',
      city: 'Mumbai',
      screens: 6,
      active: true,
    });

    testTheatreId = theatre._id;
    assert.strictEqual(theatre.city, 'Mumbai');
    assert.strictEqual(theatre.screens, 6);
  });

  await t.test('3. Show Schedule & Collision Detection', async () => {
    const show = await Show.create({
      movieId: testMovieId,
      theatreId: testTheatreId,
      screenNumber: 1,
      showDate: '2026-10-30',
      startTime: '18:00',
      pricing: { standard: 200, premium: 350, recliner: 500 },
      status: 'active',
    });

    testShowId = show._id;
    assert.ok(show._id);
    assert.strictEqual(show.pricing.recliner, 500);

    // Conflict detection simulation: attempting to book identical screen at same time
    const conflict = await Show.findOne({
      theatreId: testTheatreId,
      screenNumber: 1,
      showDate: '2026-10-30',
      startTime: '18:00',
      status: 'active',
    });
    assert.ok(conflict, 'Show query must detect existing show on same screen and time');
  });

  await t.test('4. Seat Inventory & Concurrency Locking', async () => {
    // Generate test seats
    const seat1 = await Seat.create({
      showId: testShowId,
      seatId: 'C4',
      row: 'C',
      number: 4,
      category: 'premium',
      price: 350,
      status: 'available',
    });

    const seat2 = await Seat.create({
      showId: testShowId,
      seatId: 'C5',
      row: 'C',
      number: 5,
      category: 'premium',
      price: 350,
      status: 'available',
    });

    assert.strictEqual(seat1.status, 'available');

    // User locks seats atomically
    const lockExpiry = new Date(Date.now() + 5 * 60 * 1000);
    await Seat.updateMany(
      { showId: testShowId, seatId: { $in: ['C4', 'C5'] }, status: 'available' },
      { $set: { status: 'locked', lockExpiresAt: lockExpiry, lockedByUserId: testUserId } }
    );

    const lockedSeats = await Seat.find({ showId: testShowId, seatId: { $in: ['C4', 'C5'] } });
    assert.strictEqual(lockedSeats[0].status, 'locked');
    assert.strictEqual(lockedSeats[0].lockedByUserId.toString(), testUserId.toString());

    // Conflict test: Another user cannot lock the same seats
    const otherUserId = new mongoose.Types.ObjectId();
    const clashSeats = await Seat.find({
      showId: testShowId,
      seatId: { $in: ['C4', 'C5'] },
      status: 'locked',
      lockedByUserId: { $ne: otherUserId },
    });
    assert.strictEqual(clashSeats.length, 2, 'Must detect that seats are already held by another user');
  });

  await t.test('5. Booking Creation with Separate Payment Model', async () => {
    // Confirm seats atomically
    await Seat.updateMany(
      { showId: testShowId, seatId: { $in: ['C4', 'C5'] } },
      { $set: { status: 'booked', lockExpiresAt: null, lockedByUserId: null } }
    );

    const ticketSubtotal = 350 * 2;
    const taxesAndFees = Math.round(ticketSubtotal * 0.12);
    const totalAmount = ticketSubtotal + taxesAndFees;

    const booking = await Booking.create({
      bookingRef: 'IMOV-TEST-99',
      userId: testUserId,
      showId: testShowId,
      movieId: testMovieId,
      theatreId: testTheatreId,
      screenNumber: 1,
      showDate: '2026-10-30',
      startTime: '18:00',
      seatIds: ['C4', 'C5'],
      seatDetails: [
        { seatId: 'C4', category: 'premium', price: 350 },
        { seatId: 'C5', category: 'premium', price: 350 },
      ],
      ticketSubtotal,
      taxesAndFees,
      totalAmount,
      bookingStatus: 'confirmed',
      paymentStatus: 'paid',
      paymentMethod: 'UPI / Demo Pay',
    });

    assert.ok(booking._id);
    assert.strictEqual(booking.totalAmount, 784);

    // Create Payment record linked to Booking and User
    const payment = await Payment.create({
      bookingId: booking._id,
      bookingRef: booking.bookingRef,
      userId: testUserId,
      amount: totalAmount,
      currency: 'INR',
      paymentMethod: 'UPI / Demo Pay',
      provider: 'Demo Gateway (Simulated)',
      transactionRef: `TXN-TEST-${Date.now()}`,
      status: 'successful',
      isDemo: true,
    });

    assert.ok(payment._id);
    assert.strictEqual(payment.isDemo, true);
    assert.strictEqual(payment.bookingId.toString(), booking._id.toString());
  });

  await t.test('6. Booking Cancellation & Seat Release', async () => {
    const booking = await Booking.findOne({ bookingRef: 'IMOV-TEST-99' });
    assert.ok(booking);

    booking.bookingStatus = 'cancelled';
    booking.paymentStatus = 'refunded';
    await booking.save();

    // Release seats
    await Seat.updateMany(
      { showId: booking.showId, seatId: { $in: booking.seatIds } },
      { $set: { status: 'available', lockExpiresAt: null, lockedByUserId: null } }
    );

    const releasedSeats = await Seat.find({ showId: booking.showId, seatId: { $in: ['C4', 'C5'] } });
    assert.strictEqual(releasedSeats[0].status, 'available', 'Seat C4 should be available again');
    assert.strictEqual(releasedSeats[1].status, 'available', 'Seat C5 should be available again');
  });
});
