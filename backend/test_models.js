const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const testList = [
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-pro'
];

const listModels = async () => {
  for (const modelName of testList) {
    try {
      console.log(`Testing ${modelName} with v1...`);
      // SDK might not support passing apiVersion in constructor and have it used everywhere easily 
      // but let's see if we can just try another model name or if gemini-pro works
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      // NOTE: Standard SDK usually defaults to v1beta for many things.
      // Let's try gemini-pro which is the name for 1.0 Pro
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent("test");
      console.log(`✅ ${modelName} worked!`);
    } catch (err) {
      console.error(`❌ ${modelName} failed: ${err.message}`);
    }
  }
};

listModels();
