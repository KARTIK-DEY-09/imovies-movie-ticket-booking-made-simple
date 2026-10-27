import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMovie extends Document {
  title: string;
  slug: string;
  description: string;
  genre: string[];
  language: string;
  durationMinutes: number;
  releaseDate: string;
  certification: string;
  cast: string[];
  director: string;
  posterUrl: string;
  backdropUrl?: string;
  trailerUrl?: string;
  rating: number;
  status: 'now-showing' | 'coming-soon' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const MovieSchema = new Schema<IMovie>(
  {
    title: {
      type: String,
      required: [true, 'Movie title is required'],
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Movie description is required'],
      trim: true,
    },
    genre: {
      type: [String],
      required: [true, 'At least one genre is required'],
      index: true,
    },
    language: {
      type: String,
      required: [true, 'Movie language is required'],
      trim: true,
      index: true,
    },
    durationMinutes: {
      type: Number,
      required: [true, 'Duration in minutes is required'],
      min: 1,
    },
    releaseDate: {
      type: String,
      required: [true, 'Release date is required'],
    },
    certification: {
      type: String,
      default: 'U/A',
      trim: true,
    },
    cast: {
      type: [String],
      default: [],
    },
    director: {
      type: String,
      default: '',
      trim: true,
    },
    posterUrl: {
      type: String,
      required: [true, 'Poster image URL is required'],
      trim: true,
    },
    backdropUrl: {
      type: String,
      default: '',
      trim: true,
    },
    trailerUrl: {
      type: String,
      default: '',
      trim: true,
    },
    rating: {
      type: Number,
      default: 4.5,
      min: 0,
      max: 5,
    },
    status: {
      type: String,
      enum: ['now-showing', 'coming-soon', 'inactive'],
      default: 'now-showing',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

MovieSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: Record<string, any>) => {
    ret.id = ret._id ? ret._id.toString() : ret.id;
    return ret;
  },
});

export const Movie: Model<IMovie> =
  mongoose.models.Movie || mongoose.model<IMovie>('Movie', MovieSchema);
