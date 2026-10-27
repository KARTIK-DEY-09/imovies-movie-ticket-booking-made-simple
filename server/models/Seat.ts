import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISeat extends Document {
  showId: mongoose.Types.ObjectId;
  seatId: string; // e.g. 'A1', 'C4'
  row: string;
  number: number;
  category: 'standard' | 'premium' | 'recliner';
  price: number;
  status: 'available' | 'locked' | 'booked';
  lockExpiresAt?: Date | null;
  lockedByUserId?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const SeatSchema = new Schema<ISeat>(
  {
    showId: {
      type: Schema.Types.ObjectId,
      ref: 'Show',
      required: [true, 'Show reference is required'],
      index: true,
    },
    seatId: {
      type: String,
      required: [true, 'Seat identifier is required'],
      trim: true,
    },
    row: {
      type: String,
      required: true,
      trim: true,
    },
    number: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      enum: ['standard', 'premium', 'recliner'],
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['available', 'locked', 'booked'],
      default: 'available',
      index: true,
    },
    lockExpiresAt: {
      type: Date,
      default: null,
      index: true,
    },
    lockedByUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index prevents any duplicate seat record for the same show
SeatSchema.index({ showId: 1, seatId: 1 }, { unique: true });
SeatSchema.index({ showId: 1, status: 1 });

SeatSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: Record<string, any>) => {
    ret.id = ret._id ? ret._id.toString() : ret.id;
    return ret;
  },
});

export const Seat: Model<ISeat> =
  mongoose.models.Seat || mongoose.model<ISeat>('Seat', SeatSchema);
