const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const auth = require('../middleware/auth');

// @route   GET api/jobs
// @desc    Get all user jobs
router.get('/', auth, async (req, res) => {
  try {
    const jobs = await Job.find({ user: req.user.id }).sort({ dateApplied: -1 });
    res.json({ jobs });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/jobs
// @desc    Add new job application
router.post('/', auth, async (req, res) => {
  try {
    const newJob = new Job({
      ...req.body,
      user: req.user.id,
    });
    const job = await newJob.save();
    res.json({ job });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/jobs/:id
// @desc    Update a job application
router.put('/:id', auth, async (req, res) => {
  try {
    let job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    job = await Job.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    res.json({ job });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/jobs/:id
// @desc    Delete a job application
router.delete('/:id', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    await Job.findByIdAndDelete(req.params.id);
    res.json({ message: 'Job removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
