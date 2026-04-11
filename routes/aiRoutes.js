const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.GROK_API_KEY,
  baseURL: 'https://api.x.ai/v1',
});

// @route   POST api/ai/job-search
// @desc    Get AI job search suggestions and links
router.post('/job-search', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (user.aiCredits <= 0) {
      return res.status(403).json({ message: 'You have exhausted your 5 free AI tokens.' });
    }

    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ message: 'Missing search query' });
    }

    const completion = await openai.chat.completions.create({
      model: "grok-2-latest",
      messages: [
        { 
          role: "system", 
          content: "You are an expert tech recruiter and job search assistant. The user wants job postings. Provide a clean, Markdown-formatted list of personalized job search strategies, boolean strings, and direct URL templates for LinkedIn and other job boards based exclusively on their query. Provide example job titles and companies hiring for exactly this. Format nicely." 
        },
        { role: "user", content: `Find me jobs based on: ${query}` }
      ],
      temperature: 0.5
    });

    const outputText = completion.choices[0].message.content;

    user.aiCredits -= 1;
    await user.save();

    res.json({ result: outputText, remainingCredits: user.aiCredits });
  } catch (err) {
    console.error('AI Error:', err.message);
    const errorMessage = err.response?.data?.error?.message || err.message;
    res.status(500).json({ message: `AI API Error: ${errorMessage}` });
  }
});

module.exports = router;
