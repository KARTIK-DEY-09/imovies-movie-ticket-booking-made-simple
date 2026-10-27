import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPayment extends Document {
  bookingId: mongoose.Types.ObjectId;
  bookingRef: string;
  userId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  paymentMethod: string;
  provider: string;
  transactionRef: string;
  status: 'successful' | 'failed' | 'refunded' | 'pending';
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true,
    },
    bookingRef: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
    paymentMethod: {
      type: String,
      required: true,
      trim: true,
    },
    provider: {
      type: String,
      default: 'Demo Gateway (Simulated)',
    },
    transactionRef: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['successful', 'failed', 'refunded', 'pending'],
      default: 'successful',
      index: true,
    },
    isDemo: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

PaymentSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: Record<string, any>) => {
    ret.id = ret._id ? ret._id.toString() : ret.id;
    return ret;
  },
});

export const Payment: Model<IPayment> =
  mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);
