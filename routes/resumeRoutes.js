const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const auth = require('../middleware/auth');
const User = require('../models/User');
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.GROK_API_KEY || 'missing_api_key_configure_in_render',
  baseURL: 'https://api.x.ai/v1',
});

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

// @route   POST api/resume/analyze
// @desc    Analyze resume match against job description using AI
router.post('/analyze', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (user.aiCredits <= 0) {
      return res.status(403).json({ message: 'You have exhausted your 5 free AI analysis tokens.' });
    }

    const { resumeText, jobDesc } = req.body;
    if (!resumeText || !jobDesc) {
      return res.status(400).json({ message: 'Missing resume text or job description' });
    }

    const completion = await openai.chat.completions.create({
      model: "grok-2-latest",
      messages: [
        { role: "system", content: "You are an expert ATS tracking parser. You assess a resume against a job description. Return STRICTLY valid JSON ONLY without markdown blocks. Schema: { \"percentage\": 75, \"matched\": [\"React\"], \"missing\": [\"AWS\"], \"suggestions\": [\"Details...\"] }" },
        { role: "user", content: `Job Desc: ${jobDesc.substring(0, 3000)}\n\nResume: ${resumeText.substring(0, 3000)}` }
      ],
      temperature: 0.2
    });

    let outputText = completion.choices[0].message.content;
    const jsonMatch = outputText.match(/\{[\s\S]*\}/);
    if (jsonMatch) outputText = jsonMatch[0];
    
    const output = JSON.parse(outputText);

    user.aiCredits -= 1;
    await user.save();

    res.json({ result: output, remainingCredits: user.aiCredits });
  } catch (err) {
    console.error('AI Error:', err.message);
    const errorMessage = err.response?.data?.error?.message || err.message;
    res.status(500).json({ message: `AI API Error: ${errorMessage}` });
  }
});

module.exports = router;
