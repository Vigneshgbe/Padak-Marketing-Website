// routes/admin/payment.routes.js

const express = require('express');
const multer = require('multer');
const firebase = require('firebase-admin');
const { authenticateToken, requireAdmin } = require('../../middleware/auth.middleware');
const db = firebase.firestore();

const app = express();

// ===================== ADMIN PAYMENTS MANAGEMENT ENDPOINT ======================

app.post('/api/payments/upload-proof', authenticateToken, paymentProofUpload.single('proof'), async (req, res) => {
  try {
    const { transaction_id, payment_method, resource_id, plan, amount, user_id } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Payment proof file is required' });
    }

    if (!transaction_id) {
      return res.status(400).json({ error: 'Transaction ID is required' });
    }

    // Save payment record to database
    const paymentRef = db.collection('payments').doc();
    await paymentRef.set({
      user_id,
      resource_id: resource_id || null,
      plan,
      amount,
      payment_method,
      transaction_id,
      proof_file: req.file.filename,
      status: 'pending'
    });

    res.json({ 
      message: 'Payment proof uploaded successfully', 
      paymentId: paymentRef.id 
    });
  } catch (error) {
    console.error('Error uploading payment proof:', error);
    res.status(500).json({ error: 'Failed to upload payment proof' });
  }
});

// Admin payment management endpoint
app.get('/api/admin/payments', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const paymentsSnap = await db.collection('payments').orderBy('created_at', 'desc').get();

    const payments = [];
    for (const doc of paymentsSnap.docs) {
      const p = doc.data();
      const userDoc = await db.collection('users').doc(p.user_id).get();
      const u = userDoc.data();
      let resourceTitle = null;
      if (p.resource_id) {
        const resourceDoc = await db.collection('resources').doc(p.resource_id).get();
        resourceTitle = resourceDoc.data().title;
      }
      payments.push({
        id: doc.id,
        user_id: p.user_id,
        resource_id: p.resource_id,
        plan: p.plan,
        amount: p.amount,
        payment_method: p.payment_method,
        transaction_id: p.transaction_id,
        proof_file: p.proof_file,
        status: p.status,
        created_at: p.created_at,
        first_name: u.first_name,
        last_name: u.last_name,
        email: u.email,
        resource_title: resourceTitle
      });
    }

    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Admin payment verification endpoint
app.put('/api/admin/payments/:id/verify', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await db.collection('payments').doc(id).update({
      status,
      verified_at: firebase.firestore.Timestamp.now()
    });

    // If payment is approved, grant access to the resource
    if (status === 'approved') {
      const paymentDoc = await db.collection('payments').doc(id).get();
      const payment = paymentDoc.data();
      
      if (payment.plan === 'individual' && payment.resource_id) {
        // Grant access to specific resource
        await db.collection('user_resources').add({
          user_id: payment.user_id,
          resource_id: payment.resource_id
        });
      } else if (payment.plan === 'premium') {
        // Upgrade user to premium
        await db.collection('users').doc(payment.user_id).update({
          subscription_plan: "premium"
        });
      }
    }

    res.json({ message: 'Payment status updated successfully' });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});