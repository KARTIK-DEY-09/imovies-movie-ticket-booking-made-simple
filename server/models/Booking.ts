import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBooking extends Document {
  bookingRef: string;
  userId: mongoose.Types.ObjectId;
  showId: mongoose.Types.ObjectId;
  movieId: mongoose.Types.ObjectId;
  theatreId: mongoose.Types.ObjectId;
  screenNumber: number;
  showDate: string;
  startTime: string;
  seatIds: string[];
  seatDetails: Array<{ seatId: string; category: string; price: number }>;
  ticketSubtotal: number;
  taxesAndFees: number;
  totalAmount: number;
  bookingStatus: 'confirmed' | 'cancelled' | 'pending' | 'failed';
  paymentStatus: 'paid' | 'pending' | 'refunded' | 'failed';
  paymentMethod: string;
  paymentId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    bookingRef: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    showId: {
      type: Schema.Types.ObjectId,
      ref: 'Show',
      required: true,
      index: true,
    },
    movieId: {
      type: Schema.Types.ObjectId,
      ref: 'Movie',
      required: true,
      index: true,
    },
    theatreId: {
      type: Schema.Types.ObjectId,
      ref: 'Theatre',
      required: true,
      index: true,
    },
    screenNumber: {
      type: Number,
      required: true,
    },
    showDate: {
      type: String,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    seatIds: {
      type: [String],
      required: true,
    },
    seatDetails: [
      {
        seatId: String,
        category: String,
        price: Number,
      },
    ],
    ticketSubtotal: {
      type: Number,
      required: true,
    },
    taxesAndFees: {
      type: Number,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    bookingStatus: {
      type: String,
      enum: ['confirmed', 'cancelled', 'pending', 'failed'],
      default: 'confirmed',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['paid', 'pending', 'refunded', 'failed'],
      default: 'paid',
    },
    paymentMethod: {
      type: String,
      default: 'Demo UPI / Card',
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
    },
  },
  {
    timestamps: true,
  }
);

BookingSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: Record<string, any>) => {
    ret.id = ret._id ? ret._id.toString() : ret.id;
    return ret;
  },
});

export const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);
