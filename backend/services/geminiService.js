const { GoogleGenerativeAI } = require('@google/generative-ai');

const getModel = () => {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
};

/**
 * Generate phishing email content from an admin prompt.
 * Returns { email_subject, email_body }
 */
const generateEmailContent = async (prompt) => {
  try {
    const model = getModel();
    const systemPrompt = `You are an AI assistant for a cybersecurity training platform called FinShield. 
Your job is to generate realistic phishing simulation email content for security awareness training.
Based on the user's prompt, generate a phishing email that could be used in a training campaign.

IMPORTANT: Respond ONLY with valid JSON in this exact format:
{
  "email_subject": "the email subject line",
  "email_body": "<p>HTML formatted email body using {{name}}, {{department}}, {{link}} placeholders</p>"
}

Use {{name}} for the recipient's name, {{department}} for their department, and {{link}} for the tracking link.
Make the email realistic but with subtle red flags that trained users should be able to spot.
Do NOT include any text outside the JSON object.`;

    const result = await model.generateContent(`${systemPrompt}\n\nUser prompt: ${prompt}`);
    const text = result.response.text().trim();

    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Gemini Generation Error:', error);
    if (error.message.includes('429')) {
      throw new Error('AI Quota Exceeded. Please try again in a minute or check your Pro account settings.');
    }
    throw error;
  }
};

/**
 * Generate quiz questions from an admin prompt.
 * Returns array of { question, options, correct_answer, explanation }
 */
const generateQuizQuestions = async (prompt, count = 5) => {
  try {
    const model = getModel();
    const systemPrompt = `You are an AI assistant for a cybersecurity training platform called FinShield.
Generate ${count} multiple-choice quiz questions based on the user's prompt.
These questions are for cybersecurity awareness training.

IMPORTANT: Respond ONLY with valid JSON array in this exact format:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": 0,
    "explanation": "Brief explanation of why this answer is correct"
  }
]

Rules:
- Each question must have exactly 4 options
- correct_answer is the 0-based index of the correct option (0, 1, 2, or 3)
- Make questions educational and relevant to cybersecurity awareness
- Include varied difficulty levels
- Explanations should teach the user something useful
- Do NOT include any text outside the JSON array.`;

    const result = await model.generateContent(`${systemPrompt}\n\nUser prompt: ${prompt}`);
    const text = result.response.text().trim();

    // Extract JSON array from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }
    const questions = JSON.parse(jsonMatch[0]);

    // Validate structure
    for (const q of questions) {
      if (!q.question || !Array.isArray(q.options) || q.options.length !== 4 ||
        typeof q.correct_answer !== 'number' || q.correct_answer < 0 || q.correct_answer > 3) {
        throw new Error('Invalid question format from AI');
      }
    }

    return questions;
  } catch (error) {
    console.error('Gemini Quiz Generation Error:', error);
    if (error.message.includes('429')) {
      throw new Error('AI Quota Exceeded. Please try again in a minute.');
    }
    throw error;
  }
};

module.exports = { generateEmailContent, generateQuizQuestions };
