import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITheatre extends Document {
  name: string;
  location: string;
  address: string;
  city: string;
  screens: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TheatreSchema = new Schema<ITheatre>(
  {
    name: {
      type: String,
      required: [true, 'Theatre name is required'],
      trim: true,
      index: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    address: {
      type: String,
      default: '',
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      index: true,
    },
    screens: {
      type: Number,
      default: 4,
      min: 1,
      max: 30,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

TheatreSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret: Record<string, any>) => {
    ret.id = ret._id ? ret._id.toString() : ret.id;
    return ret;
  },
});

export const Theatre: Model<ITheatre> =
  mongoose.models.Theatre || mongoose.model<ITheatre>('Theatre', TheatreSchema);
