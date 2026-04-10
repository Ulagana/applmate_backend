const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  company: {
    type: String,
    required: true,
    trim: true,
  },
  role: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ['Applied', 'Interview', 'Rejected', 'Offer'],
    default: 'Applied',
  },
  dateApplied: {
    type: Date,
    default: Date.now,
  },
  location: {
    type: String,
    trim: true,
    default: '',
  },
  salary: {
    type: String,
    trim: true,
    default: '',
  },
  notes: {
    type: String,
    default: '',
  },
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);
