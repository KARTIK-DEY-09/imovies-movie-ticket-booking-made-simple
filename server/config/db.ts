import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, Movie, Theatre, Show, Seat, Booking, Payment, Review, Notification } from '../models/index.ts';

let mongoMemoryServerInstance: any = null;

export async function connectDB(): Promise<string> {
  const envUri = process.env.MONGO_URI;

  if (envUri && envUri.trim() !== '') {
    try {
      console.log(`Connecting to MongoDB at: ${envUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
      await mongoose.connect(envUri);
      console.log('✅ Connected to MongoDB successfully via Mongoose.');
      await seedDatabaseIfEmpty();
      return envUri;
    } catch (err: any) {
      console.error('❌ MongoDB Connection Error:', err.message);
      if (process.env.NODE_ENV === 'production') {
        throw new Error(`Production MongoDB Connection Failed: ${err.message}`);
      }
      console.log('⚠️ Falling back to local MongoMemoryServer for development.');
    }
  }

  // When MONGO_URI is not provided
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'FATAL: MONGO_URI environment variable is required in production. Please set MONGO_URI in your environment or server/.env'
    );
  }

  // Development / Test mode with MongoMemoryServer
  try {
    console.log('ℹ️ MONGO_URI not provided or unreachable. Initializing local MongoDB instance via MongoMemoryServer...');
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    mongoMemoryServerInstance = await MongoMemoryServer.create();
    const uri = mongoMemoryServerInstance.getUri();
    await mongoose.connect(uri);
    console.log(`✅ Connected to local MongoDB engine at ${uri}`);
    console.log('💡 Tip: To persist data permanently, set MONGO_URI="mongodb://localhost:27017/imovies" or your MongoDB Atlas URI in server/.env');
    await seedDatabaseIfEmpty();
    return uri;
  } catch (err: any) {
    console.error('❌ Failed to initialize MongoDB:', err.message);
    throw err;
  }
}

export async function disconnectDB(): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('MongoDB connection disconnected.');
    }
    if (mongoMemoryServerInstance) {
      await mongoMemoryServerInstance.stop();
      console.log('Local MongoMemoryServer stopped.');
    }
  } catch (err) {
    console.error('Error disconnecting MongoDB:', err);
  }
}

// Concurrency helper: generate seats for a newly scheduled show
export async function generateSeatsForShow(showId: mongoose.Types.ObjectId | string, pricing: { standard: number; premium: number; recliner: number }) {
  const rows = [
    { name: 'A', category: 'recliner' as const, seats: 8, price: pricing.recliner },
    { name: 'B', category: 'recliner' as const, seats: 8, price: pricing.recliner },
    { name: 'C', category: 'premium' as const, seats: 12, price: pricing.premium },
    { name: 'D', category: 'premium' as const, seats: 12, price: pricing.premium },
    { name: 'E', category: 'premium' as const, seats: 12, price: pricing.premium },
    { name: 'F', category: 'standard' as const, seats: 12, price: pricing.standard },
    { name: 'G', category: 'standard' as const, seats: 12, price: pricing.standard },
    { name: 'H', category: 'standard' as const, seats: 12, price: pricing.standard },
  ];

  const seatDocs: any[] = [];
  rows.forEach((r) => {
    for (let num = 1; num <= r.seats; num++) {
      seatDocs.push({
        showId: new mongoose.Types.ObjectId(showId.toString()),
        seatId: `${r.name}${num}`,
        row: r.name,
        number: num,
        category: r.category,
        price: r.price,
        status: 'available',
        lockExpiresAt: null,
        lockedByUserId: null,
      });
    }
  });

  try {
    await Seat.insertMany(seatDocs, { ordered: false });
  } catch (err: any) {
    // Ignore duplicate key errors if seats already exist
    if (err.code !== 11000) {
      console.warn('Seat generation notice:', err.message);
    }
  }
}

// Seat concurrency helper: Clean up expired seat locks
export async function cleanExpiredLocks(): Promise<number> {
  const now = new Date();
  const res = await Seat.updateMany(
    {
      status: 'locked',
      lockExpiresAt: { $lt: now },
    },
    {
      $set: {
        status: 'available',
        lockExpiresAt: null,
        lockedByUserId: null,
      },
    }
  );
  return res.modifiedCount;
}

// Database Seeder
export async function seedDatabaseIfEmpty() {
  const movieCount = await Movie.countDocuments();
  if (movieCount > 0) {
    console.log(`Database already populated (${movieCount} movies found). Skipping seed.`);
    return;
  }

  console.log('🌱 Seeding initial cinema catalogue, multiplexes, shows, and demo users into MongoDB...');

  // 1. Seed Users
  const adminPasswordHash = bcrypt.hashSync('Admin@123', 10);
  const userPasswordHash = bcrypt.hashSync('User@123', 10);

  const admin = await User.create({
    username: 'iMovies Admin',
    email: 'admin@imovies.com',
    passwordHash: adminPasswordHash,
    phone: '+91 98765 43210',
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    watchlist: [],
  });

  const demoUser = await User.create({
    username: 'Rahul Sharma',
    email: 'user@imovies.com',
    passwordHash: userPasswordHash,
    phone: '+91 91234 56789',
    role: 'user',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    watchlist: [],
  });

  // 2. Seed Movies
  const initialMovies = [
    {
      title: 'RRR (Rise Roar Revolt)',
      slug: 'rrr',
      description: 'A fictional tale of two legendary revolutionaries and their journey away from home before they began fighting for their country in the 1920s.',
      genre: ['Action', 'Drama', 'Period'],
      language: 'Telugu / Hindi',
      durationMinutes: 187,
      releaseDate: '2024-03-25',
      certification: 'U/A',
      cast: ['N.T. Rama Rao Jr.', 'Ram Charan', 'Alia Bhatt', 'Ajay Devgn'],
      director: 'S.S. Rajamouli',
      posterUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&auto=format&fit=crop&q=80',
      backdropUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1200&auto=format&fit=crop&q=80',
      trailerUrl: 'https://www.youtube.com/watch?v=NgBoMJy39863',
      rating: 4.9,
      status: 'now-showing',
    },
    {
      title: 'Baahubali 2: The Conclusion',
      slug: 'baahubali-2-the-conclusion',
      description: 'Amarendra Baahubali must navigate court intrigues and betrayal while upholding honour in the kingdom of Mahishmati.',
      genre: ['Action', 'Fantasy', 'Epic'],
      language: 'Telugu / Hindi',
      durationMinutes: 167,
      releaseDate: '2024-04-28',
      certification: 'U/A',
      cast: ['Prabhas', 'Rana Daggubati', 'Anushka Shetty', 'Ramya Krishnan'],
      director: 'S.S. Rajamouli',
      posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
      backdropUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=80',
      trailerUrl: 'https://www.youtube.com/watch?v=qD-6d8Wo3do',
      rating: 4.8,
      status: 'now-showing',
    },
    {
      title: 'They Call Him OG',
      slug: 'they-call-him-og',
      description: 'A ruthless gangster named Ojas Gambheera returns to the Mumbai underworld to reclaim his empire and avenge a blood debt.',
      genre: ['Action', 'Crime', 'Thriller'],
      language: 'Telugu / Hindi',
      durationMinutes: 155,
      releaseDate: '2026-09-27',
      certification: 'A',
      cast: ['Pawan Kalyan', 'Emraan Hashmi', 'Priyanka Arul Mohan'],
      director: 'Sujeeth',
      posterUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80',
      backdropUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=1200&auto=format&fit=crop&q=80',
      trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      rating: 4.7,
      status: 'now-showing',
    },
    {
      title: 'The Raja Saab',
      slug: 'the-raja-saab',
      description: 'A romantic horror comedy blending vintage royalty, supernatural mysteries, and charismatic spectacle in an ancestral palace.',
      genre: ['Comedy', 'Horror', 'Romance'],
      language: 'Telugu / Hindi',
      durationMinutes: 150,
      releaseDate: '2026-04-10',
      certification: 'U/A',
      cast: ['Prabhas', 'Malavika Mohanan', 'Nidhhi Agerwal'],
      director: 'Maruthi',
      posterUrl: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=600&auto=format&fit=crop&q=80',
      backdropUrl: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=1200&auto=format&fit=crop&q=80',
      trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      rating: 4.5,
      status: 'now-showing',
    },
    {
      title: 'Toxic: A Fairy Tale for Grown-ups',
      slug: 'toxic',
      description: 'Set against the backdrop of the global drug mafia in Goa and London, an anti-hero carves a bloody path through betrayal.',
      genre: ['Action', 'Thriller', 'Neo-Noir'],
      language: 'Kannada / Hindi / English',
      durationMinutes: 160,
      releaseDate: '2026-11-20',
      certification: 'A',
      cast: ['Yash', 'Kiara Advani', 'Nayanthara', 'Huma Qureshi'],
      director: 'Geetu Mohandas',
      posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
      backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
      trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      rating: 4.6,
      status: 'coming-soon',
    },
    {
      title: 'Avatar: The Way of Water',
      slug: 'avatar-the-way-of-water',
      description: 'Jake Sully lives with his newfound family formed on the extrasolar moon Pandora. Once a familiar threat returns, Jake must work with Neytiri and the army of the Na\'vi race.',
      genre: ['Sci-Fi', 'Adventure', 'Action'],
      language: 'English / Hindi',
      durationMinutes: 192,
      releaseDate: '2025-12-16',
      certification: 'U/A',
      cast: ['Sam Worthington', 'Zoe Saldana', 'Sigourney Weaver', 'Stephen Lang'],
      director: 'James Cameron',
      posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
      backdropUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80',
      trailerUrl: 'https://www.youtube.com/watch?v=d9MyW72ELq0',
      rating: 4.8,
      status: 'now-showing',
    },
    {
      title: 'Chhaava',
      slug: 'chhaava',
      description: 'An epic historical saga on the valorous life of Chhatrapati Sambhaji Maharaj, son of Chhatrapati Shivaji Maharaj, and his legendary defiance.',
      genre: ['Historical', 'Drama', 'Action'],
      language: 'Hindi / Marathi',
      durationMinutes: 165,
      releaseDate: '2026-02-14',
      certification: 'U/A',
      cast: ['Vicky Kaushal', 'Rashmika Mandanna', 'Akshaye Khanna'],
      director: 'Laxman Utekar',
      posterUrl: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=600&auto=format&fit=crop&q=80',
      backdropUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=80',
      trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      rating: 4.7,
      status: 'now-showing',
    },
    {
      title: 'Pushpa 2: The Rule',
      slug: 'pushpa-2-the-rule',
      description: 'Pushpa Raj expands his red sandalwood empire while locked in an escalating duel of wits and muscle with SP Bhanwar Singh Shekhawat.',
      genre: ['Action', 'Thriller', 'Crime'],
      language: 'Telugu / Hindi',
      durationMinutes: 200,
      releaseDate: '2024-12-05',
      certification: 'A',
      cast: ['Allu Arjun', 'Fahadh Faasil', 'Rashmika Mandanna'],
      director: 'Sukumar',
      posterUrl: 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=600&auto=format&fit=crop&q=80',
      backdropUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1200&auto=format&fit=crop&q=80',
      trailerUrl: 'https://www.youtube.com/watch?v=1kVK0MZlbI4',
      rating: 4.8,
      status: 'now-showing',
    },
    {
      title: 'Kalki 2898 AD',
      slug: 'kalki-2898-ad',
      description: 'In a post-apocalyptic world ruled by the Supreme Yaskin in the Complex, Ashwatthama protects the mother of the prophesied tenth avatar.',
      genre: ['Sci-Fi', 'Mythology', 'Action'],
      language: 'Telugu / Hindi / English',
      durationMinutes: 181,
      releaseDate: '2024-06-27',
      certification: 'U/A',
      cast: ['Prabhas', 'Amitabh Bachchan', 'Kamal Haasan', 'Deepika Padukone'],
      director: 'Nag Ashwin',
      posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
      backdropUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=1200&auto=format&fit=crop&q=80',
      trailerUrl: 'https://www.youtube.com/watch?v=kQDd1AhGIHk',
      rating: 4.6,
      status: 'now-showing',
    },
    {
      title: 'Dune: Part Two',
      slug: 'dune-part-two',
      description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.',
      genre: ['Sci-Fi', 'Adventure', 'Action'],
      language: 'English / Hindi',
      durationMinutes: 166,
      releaseDate: '2024-03-01',
      certification: 'U/A',
      cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson', 'Austin Butler'],
      director: 'Denis Villeneuve',
      posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
      backdropUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80',
      trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
      rating: 4.9,
      status: 'coming-soon',
    },
  ];

  const createdMovies = await Movie.insertMany(initialMovies);

  // 3. Seed Theatres
  const initialTheatres = [
    {
      name: 'PVR ICON: Inorbit Mall',
      location: 'Inorbit Mall, Malad West',
      address: 'Level 3, Link Road, Malad West',
      city: 'Mumbai',
      screens: 6,
      active: true,
    },
    {
      name: 'INOX Megaplex: Nariman Point',
      location: 'CR2 Mall, Nariman Point',
      address: 'Barrister Rajni Patel Marg, Nariman Point',
      city: 'Mumbai',
      screens: 5,
      active: true,
    },
    {
      name: 'Cinépolis: Grand Plaza',
      location: 'Vegas Mall, Dwarka Sector 14',
      address: 'Sector 14, Dwarka',
      city: 'Delhi-NCR',
      screens: 8,
      active: true,
    },
    {
      name: 'PVR Superplex: Forum Mall',
      location: 'Koramangala',
      address: 'Hosur Road, Koramangala',
      city: 'Bengaluru',
      screens: 11,
      active: true,
    },
    {
      name: 'AMB Cinemas: Gachibowli',
      location: 'Sarath City Capital Mall, Kondapur',
      address: 'Gachibowli - Miyapur Rd',
      city: 'Hyderabad',
      screens: 7,
      active: true,
    },
  ];

  const createdTheatres = await Theatre.insertMany(initialTheatres);

  // 4. Seed Shows
  const today = new Date();
  const formatDate = (offsetDays: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split('T')[0];
  };

  const dates = [formatDate(0), formatDate(1), formatDate(2)];
  const times = ['10:30', '14:15', '18:00', '21:45'];

  const nowShowingMovies = createdMovies.filter((m) => m.status === 'now-showing');
  let firstCreatedShow: any = null;

  for (const movie of nowShowingMovies.slice(0, 5)) {
    for (const theatre of createdTheatres.slice(0, 3)) {
      for (const dateStr of dates) {
        for (let i = 0; i < 2; i++) {
          const show = await Show.create({
            movieId: movie._id,
            theatreId: theatre._id,
            screenNumber: (i % theatre.screens) + 1,
            showDate: dateStr,
            startTime: times[i],
            pricing: {
              standard: 220,
              premium: 350,
              recliner: 550,
            },
            status: 'active',
          });

          await generateSeatsForShow(show._id, show.pricing);

          if (!firstCreatedShow) {
            firstCreatedShow = show;
          }
        }
      }
    }
  }

  // 5. Seed Reviews
  const rrrMovie = createdMovies.find((m) => m.title.includes('RRR'));
  if (rrrMovie) {
    await Review.create({
      userId: demoUser._id,
      userName: demoUser.username,
      movieId: rrrMovie._id,
      rating: 5,
      comment: 'Pure cinematic adrenaline rush! Rajamouli masterclass. The interval sequence gave me goosebumps!',
    });
  }

  const avatarMovie = createdMovies.find((m) => m.title.includes('Avatar'));
  if (avatarMovie) {
    await Review.create({
      userId: admin._id,
      userName: 'Ananya Verma',
      movieId: avatarMovie._id,
      rating: 5,
      comment: 'Visual feast of the highest order. The 3D underwater sequences redefine what movies can achieve.',
    });
  }

  // 6. Seed a sample confirmed booking for the demo user
  if (firstCreatedShow) {
    const bookedSeatIds = ['C4', 'C5'];
    // Update seats in database
    await Seat.updateMany(
      { showId: firstCreatedShow._id, seatId: { $in: bookedSeatIds } },
      { $set: { status: 'booked' } }
    );

    const ticketSubtotal = firstCreatedShow.pricing.premium * 2;
    const taxesAndFees = Math.round(ticketSubtotal * 0.12);
    const totalAmount = ticketSubtotal + taxesAndFees;

    const sampleBooking = await Booking.create({
      bookingRef: 'IMOV-882914',
      userId: demoUser._id,
      showId: firstCreatedShow._id,
      movieId: firstCreatedShow.movieId,
      theatreId: firstCreatedShow.theatreId,
      screenNumber: firstCreatedShow.screenNumber,
      showDate: firstCreatedShow.showDate,
      startTime: firstCreatedShow.startTime,
      seatIds: bookedSeatIds,
      seatDetails: [
        { seatId: 'C4', category: 'premium', price: firstCreatedShow.pricing.premium },
        { seatId: 'C5', category: 'premium', price: firstCreatedShow.pricing.premium },
      ],
      ticketSubtotal,
      taxesAndFees,
      totalAmount,
      bookingStatus: 'confirmed',
      paymentStatus: 'paid',
      paymentMethod: 'UPI / Demo Pay',
    });

    // Create Payment record
    const payment = await Payment.create({
      bookingId: sampleBooking._id,
      bookingRef: sampleBooking.bookingRef,
      userId: demoUser._id,
      amount: totalAmount,
      currency: 'INR',
      paymentMethod: 'UPI / Demo Pay',
      provider: 'Demo Gateway (Simulated)',
      transactionRef: `TXN-DEMO-${Date.now()}`,
      status: 'successful',
      isDemo: true,
    });

    sampleBooking.paymentId = payment._id as any;
    await sampleBooking.save();

    // Sample Notification
    await Notification.create({
      userId: demoUser._id,
      title: 'Booking Confirmed!',
      message: `Your booking IMOV-882914 for RRR is confirmed. Show time: ${sampleBooking.showDate} at ${sampleBooking.startTime}.`,
      type: 'booking',
      read: false,
    });
  }

  console.log('✅ Initial database seed completed successfully with real MongoDB documents.');
}
