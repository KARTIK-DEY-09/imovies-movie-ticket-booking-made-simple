# iMovies — Movie Ticket Booking Made Simple

An individual college capstone software engineering project delivering a complete full-stack **MERN** (MongoDB, Express, React, Node.js) movie ticket booking platform. Features Mongoose data persistence, real-time seat locking with Socket.IO, JWT authentication, demo payment simulation, printable QR passes, and an administrative control panel.

Live Demo: [Add your deployed application URL here]

GitHub Repository: [Add your GitHub repository URL here]

---

## 🌟 Architecture & Key Features

### 1. Database & Persistence Layer (MongoDB & Mongoose)
- **Mongoose Data Models (`server/models/`)**:
  - `User`: Email uniqueness constraint, bcrypt hashed passwords (never exposed in JSON), roles (`user`, `admin`), profile details, and watchlist references.
  - `Movie`: Title, slug, genres, language, duration, release date, certification, cast, director, URLs, rating, and status (`now-showing`, `coming-soon`, `inactive`).
  - `Theatre`: Multiplex venue, location, city, screen count, and active status.
  - `Show`: Movie & Theatre ObjectId references, screen number, show date, start time, pricing tiers (`standard`, `premium`, `recliner`), and compound schedule indexing preventing hall collisions.
  - `Seat`: Concurrency-safe seat inventory per show with compound unique index `{ showId: 1, seatId: 1 }`, atomic statuses (`available`, `locked`, `booked`), lock expiry timestamps, and locking user IDs.
  - `Booking`: Unique alphanumeric reference (e.g. `IMOV-882914`), user & show references, seats array, server-calculated totals (preventing client price tampering), and payment statuses.
  - `Payment`: Separate payment transaction records linked to Booking and User, with demo provider simulation flags.
  - `Review`: Ratings (1-5) and comments with compound unique constraint `{ userId: 1, movieId: 1 }` preventing duplicate ratings.
  - `Notification`: User-targeted in-app alerts for booking confirmations and cancellation updates.
- **Connection Manager (`server/config/db.ts`)**:
  - Connects to MongoDB via `MONGO_URI` (MongoDB Atlas or local MongoDB `mongodb://127.0.0.1:27017/imovies`).
  - For local development and zero-config evaluation, automatically initializes an embedded `MongoMemoryServer` if `MONGO_URI` is not provided.
  - In `production` mode, strictly enforces that `MONGO_URI` must be provided.
  - Automatic initial seeding if database is empty.
  - Graceful shutdown handlers for `SIGINT` and `SIGTERM`.

### 2. Concurrency-Safe Seating & Real-Time Updates (Socket.IO)
- **Atomic 5-Minute Seat Locks**: Server-authoritative temporary holding prevents double bookings and checkout race conditions.
- **Automated Expired Lock Release**: Abandoned carts automatically release seats back to the hall inventory via `cleanExpiredLocks()`.
- **Socket.IO Real-Time Broadcast**: Seat status changes broadcast across all connected browsers (`seats:updated`).

### 3. User & Cinema Discovery
- **Dark Navy Cinema Aesthetic**: Deep midnight tones (`#080c14`, `#0c1220`) with cinema red and pink accents (`#e11d48`, `#f43f5e`).
- **Dynamic City Filtering**: Switch between metropolitan cities (Mumbai, Delhi-NCR, Bengaluru, Hyderabad) to view local multiplexes and shows.
- **Multifaceted Search & Filters**: Filter movies by title, starring cast, genre, language, and release status.
- **Embedded Trailers**: Modal preview of official movie trailers directly inside the application.
- **Audience Reviews & Star Ratings**: Submit real-time user ratings with average score recalculation.

### 4. Checkout, Payments & Ticket Generation
- **Demo Payment Simulation**: Safe evaluation environment with options for testing both success and simulated failure scenarios.
- **Printable E-Ticket**: Digital ticket with dynamic QR code pass and cinema details (`window.print()`).
- **Booking Management & Cancellation**: View active and past tickets, with one-click cancellation according to policy.

### 5. Comprehensive Admin Control Panel
- **Aggregated Analytics**: Live totals for Gross Revenue, Tickets Sold, Movies, Multiplex Theatres, and Registered Users.
- **Movie Catalogue CRUD**: Add new blockbusters, update details, or deactivate inactive titles.
- **Multiplex Management**: Configure cinema halls, screens, and addresses.
- **Show Scheduling Engine**: Schedule shows with screen collision prevention and automated seat layout generation.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, React Router DOM, Tailwind CSS v4, Lucide Icons, Canvas Confetti, QRCode |
| **Backend** | Node.js, Express.js, Socket.IO, JWT, bcryptjs, Helmet, CORS |
| **Database** | MongoDB with Mongoose (local, Atlas, or MongoMemoryServer dev engine) |
| **Testing** | Node.js Test Runner & MongoDB Memory Server |

---

## 🚀 Setup & Execution Guide

### Prerequisites
- Node.js (v18.0.0 or higher recommended)
- npm (v9.0.0 or higher)
- Optional: Local MongoDB installation or free MongoDB Atlas cluster

### 1. Installation
Clone the repository and install all dependencies:
```bash
git clone [Add your GitHub repository URL here]
cd imovies
npm install
```

### 2. Environment Configuration
Copy the sample environment file:
```bash
cp server/.env.example server/.env
```

To connect to **MongoDB Atlas**:
1. Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a database user and allow your IP address in Network Access.
3. In `server/.env`, set:
   ```env
   MONGO_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/imovies?retryWrites=true&w=majority"
   ```

To connect to **Local MongoDB**:
```env
MONGO_URI="mongodb://127.0.0.1:27017/imovies"
```

*Note: If `MONGO_URI` is left blank in development, the application will automatically initialize an embedded MongoDB engine for evaluation.*

### 3. Seed Database
To populate the database with 10 sample blockbusters, multiplexes, schedules, and test accounts:
```bash
npm run seed
```

Default credentials:
- **Admin**: `admin@imovies.com` / `Admin@123`
- **User**: `user@imovies.com` / `User@123`

*(Fast-fill demo buttons are also available on the Sign In page for one-click testing.)*

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Running Automated Tests
```bash
npm test
```
Executes the Mongoose test suite verifying User authentication, duplicate prevention, Show collision detection, Seat concurrency locking, and Booking/Payment creation.

### 6. Production Build
```bash
npm run build
npm start
```

---

## 📡 REST API Overview

### Authentication
- `POST /api/auth/register` — Register new user account with hashed password
- `POST /api/auth/login` — Authenticate and receive signed JWT
- `GET /api/auth/me` — Retrieve active session user
- `PUT /api/auth/profile` — Update username, phone, or avatar
- `PUT /api/auth/change-password` — Change account password

### Movies & Shows
- `GET /api/movies` — List movies with genre, city, status, and search filters
- `GET /api/movies/:id` — Get detailed movie information and average rating
- `POST /api/movies` — Admin create movie
- `PUT /api/movies/:id` — Admin update movie
- `DELETE /api/movies/:id` — Admin delete or deactivate movie
- `GET /api/shows` — Retrieve shows by movie, theatre, city, and date
- `POST /api/shows` — Admin schedule show with screen conflict checks
- `GET /api/shows/:id/seats` — Get seat map layout and availability

### Bookings, Payments & Concurrency
- `POST /api/shows/:id/lock-seats` — Atomically lock selected seats for 5 minutes
- `POST /api/shows/:id/unlock-seats` — Release held seat locks
- `POST /api/bookings/checkout-demo` — Complete demo payment, confirm seats, and record payment
- `GET /api/bookings/my` — Get authenticated user's tickets
- `GET /api/bookings/:id` — Get specific booking pass
- `POST /api/bookings/:id/cancel` — Cancel ticket, refund demo payment, and free seat inventory
- `GET /api/payments` — Get transaction payment history
- `POST /api/payments/verify` — Verify demo transaction status

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
