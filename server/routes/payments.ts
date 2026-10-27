import express from 'express';
import mongoose from 'mongoose';
import { Payment } from '../models/index.ts';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.ts';

export const paymentsRouter = express.Router();

// GET /api/payments
paymentsRouter.get('/', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!._id;
    const query = req.user!.role === 'admin' ? {} : { userId };

    const payments = await Payment.find(query)
      .populate('bookingId')
      .sort({ createdAt: -1 });

    res.json({ payments });
  } catch (err: any) {
    console.error('Error fetching payments:', err);
    res.status(500).json({ message: err.message || 'Error fetching payments' });
  }
});

// GET /api/payments/:id
paymentsRouter.get('/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    let payment = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      payment = await Payment.findById(id).populate('bookingId');
    }
    if (!payment) {
      payment = await Payment.findOne({ transactionRef: id }).populate('bookingId');
    }

    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found.' });
    }

    if (payment.userId.toString() !== req.user!._id.toString() && req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    res.json({ payment });
  } catch (err: any) {
    console.error('Error fetching payment details:', err);
    res.status(500).json({ message: err.message || 'Error fetching payment details' });
  }
});

// POST /api/payments/verify
paymentsRouter.post('/verify', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { transactionRef } = req.body;
    if (!transactionRef) {
      return res.status(400).json({ message: 'transactionRef is required.' });
    }

    const payment = await Payment.findOne({ transactionRef });
    if (!payment) {
      return res.status(404).json({ message: 'Transaction not found.' });
    }

    res.json({
      verified: payment.status === 'successful',
      payment,
      note: 'Simulated Demo Payment Verification - Academic Capstone',
    });
  } catch (err: any) {
    console.error('Error verifying payment:', err);
    res.status(500).json({ message: err.message || 'Error verifying payment' });
  }
});
