const groq = require('../config/groq');
const { SYSTEM_PROMPT, buildUserPrompt } = require('../config/prompts');

const VALID_TONES = ['casual', 'professional', 'energetic', 'educational'];

exports.generateScript = async (req, res) => {
  try {
    const { topic, tone = 'casual', duration = 5 } = req.body;

    // ---- validation ----
    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
      return res.status(400).json({ message: 'Topic is required' });
    }
    if (topic.trim().length > 200) {
      return res.status(400).json({ message: 'Topic must be under 200 characters' });
    }
    if (!VALID_TONES.includes(tone)) {
      return res.status(400).json({
        message: `Tone must be one of: ${VALID_TONES.join(', ')}`,
      });
    }
    const mins = Number(duration);
    if (!Number.isFinite(mins) || mins < 1 || mins > 30) {
      return res.status(400).json({ message: 'Duration must be between 1 and 30 minutes' });
    }

    // ---- the LLM call ----
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt({ topic: topic.trim(), tone, duration: mins }) },
      ],
      temperature: 0.7,
      max_tokens: 2048,
    });

    const script = completion.choices[0]?.message?.content;

    if (!script || script.trim().length === 0) {
      return res.status(502).json({ message: 'The model returned an empty response' });
    }

    res.json({
      topic: topic.trim(),
      tone,
      duration: mins,
      script: script.trim(),
      usage: {
        promptTokens: completion.usage?.prompt_tokens,
        completionTokens: completion.usage?.completion_tokens,
        totalTokens: completion.usage?.total_tokens,
      },
    });
  } catch (error) {
    console.error('Groq API error:', error.message);

    if (error.status === 429) {
      return res.status(429).json({
        message: 'Rate limit reached. Please wait a moment and try again.',
      });
    }
    if (error.status === 401) {
      return res.status(500).json({ message: 'API authentication failed' });
    }
    if (error.status >= 500) {
      return res.status(503).json({
        message: 'The AI service is temporarily unavailable. Please try again.',
      });
    }

    res.status(500).json({ message: 'Could not generate script' });
  }
};