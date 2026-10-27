import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IShow extends Document {
  movieId: mongoose.Types.ObjectId;
  theatreId: mongoose.Types.ObjectId;
  screenNumber: number;
  showDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  pricing: {
    standard: number;
    premium: number;
    recliner: number;
  };
  status: 'active' | 'cancelled' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

const ShowSchema = new Schema<IShow>(
  {
    movieId: {
      type: Schema.Types.ObjectId,
      ref: 'Movie',
      required: [true, 'Movie reference is required'],
      index: true,
    },
    theatreId: {
      type: Schema.Types.ObjectId,
      ref: 'Theatre',
      required: [true, 'Theatre reference is required'],
      index: true,
    },
    screenNumber: {
      type: Number,
      required: [true, 'Screen number is required'],
      min: 1,
    },
    showDate: {
      type: String,
      required: [true, 'Show date is required (YYYY-MM-DD)'],
      index: true,
    },
    startTime: {
      type: String,
      required: [true, 'Show start time is required (HH:mm)'],
    },
    pricing: {
      standard: {
        type: Number,
        required: true,
        min: 50,
      },
      premium: {
        type: Number,
        required: true,
        min: 100,
      },
      recliner: {
        type: Number,
        required: true,
        min: 150,
      },
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'completed'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to help query shows and detect scheduling conflicts
ShowSchema.index({ theatreId: 1, screenNumber: 1, showDate: 1, startTime: 1 });

ShowSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: Record<string, any>) => {
    ret.id = ret._id ? ret._id.toString() : ret.id;
    return ret;
  },
});

export const Show: Model<IShow> =
  mongoose.models.Show || mongoose.model<IShow>('Show', ShowSchema);
