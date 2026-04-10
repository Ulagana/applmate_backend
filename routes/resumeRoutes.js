const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const auth = require('../middleware/auth');

// Setup multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB Limit
});

// @route   POST api/resume/extract
// @desc    Extract text from uploaded PDF resume
router.post('/extract', auth, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (req.file.mimetype === 'application/pdf') {
      const data = await pdfParse(req.file.buffer);
      res.json({ text: data.text });
    } else if (req.file.mimetype === 'text/plain') {
      const text = req.file.buffer.toString('utf8');
      res.json({ text });
    } else {
      res.status(400).json({ message: 'Only PDF or TXT files are allowed' });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Failed to process resume file' });
  }
});

module.exports = router;
