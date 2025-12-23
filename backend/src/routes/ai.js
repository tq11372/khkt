import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const router = express.Router();

// Khởi tạo Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- HELPER: Cấu hình Gemini ---
const getGeminiModel = (jsonMode = false) => {
  const config = jsonMode ? { responseMimeType: "application/json" } : {};
  return genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash-exp", 
    generationConfig: config 
  });
};

// ==========================================
// 1. API DỊCH THUẬT & TỪ ĐIỂN (MỚI THÊM)
// ==========================================
// Đáp ứng yêu cầu: "Trang có thanh ghi chữ để điền từ và có thể dịch"
router.post('/translate', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Thiếu từ cần dịch' });

    const model = getGeminiModel(true); // Dùng JSON mode để frontend dễ hiển thị
    const prompt = `
      Act as a smart bilingual dictionary (English <-> Vietnamese).
      Input text: "${text}"
      
      Tasks:
      1. Detect the language of the input.
      2. If English -> Translate to Vietnamese.
      3. If Vietnamese -> Translate to English.
      4. Provide the definition, word type (noun/verb/adj...), and one example sentence.
      
      Output strictly a JSON Object with this schema:
      {
        "original": "${text}",
        "translated": "String (The translation)",
        "type": "String (e.g., Noun, Verb)",
        "definition": "String (Short definition in the target language)",
        "example": "String (Example sentence using the word)"
      }
    `;

    const result = await model.generateContent(prompt);
    const translation = JSON.parse(result.response.text());
    
    res.json({ result: translation });

  } catch (error) {
    console.error("Translate Error:", error);
    res.status(500).json({ message: 'Lỗi dịch thuật.' });
  }
});

// ==========================================
// 2. API TÓM TẮT (SUMMARIZE)
// ==========================================
router.post('/summarize', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'Thiếu nội dung' });

    const model = getGeminiModel(false);
    const prompt = `
      Act as an English teacher. Summarize the following article for an A2-B1 English learner.
      Requirements:
      - Simple vocabulary.
      - Under 150 words.
      - Output in Vietnamese if the input is too hard, otherwise simple English.
      Article: "${content.substring(0, 8000)}"
    `;

    const result = await model.generateContent(prompt);
    res.json({ summary: result.response.text() });

  } catch (error) {
    console.error("Summarize Error:", error);
    res.status(503).json({ message: 'AI đang bận, thử lại sau.' });
  }
});

// ==========================================
// 3. API TẠO QUIZ (JSON MODE)
// ==========================================
router.post('/quiz', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: 'Thiếu nội dung' });

    const model = getGeminiModel(true); 
    const prompt = `
      Generate 3 multiple-choice questions based on this article to check comprehension.
      Output strictly a JSON Array.
      Schema:
      [
        {
          "question": "String (The question text)",
          "options": ["String", "String", "String", "String"],
          "answer": "String (Must match exactly one option content)"
        }
      ]
      Article: "${content.substring(0, 8000)}"
    `;

    const result = await model.generateContent(prompt);
    const quiz = JSON.parse(result.response.text());
    
    res.json({ quiz });

  } catch (error) {
    console.error("Quiz Error:", error);
    res.status(500).json({ message: 'Lỗi tạo câu hỏi.' });
  }
});

// ==========================================
// 4. API GIẢI THÍCH TỪ VỰNG (CONTEXT)
// ==========================================
router.post('/explain', async (req, res) => {
  try {
    const { text, context } = req.body;
    const model = getGeminiModel(false);

    const prompt = `
      Explain the word/phrase "${text}" in the specific context of this sentence: "${context}".
      Explain in Vietnamese nicely and briefly.
    `;

    const result = await model.generateContent(prompt);
    res.json({ explanation: result.response.text() });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi giải thích.' });
  }
});
// ==========================================
// 6. API KIỂM TRA NGỮ PHÁP (GRAMMAR)
// ==========================================
router.post('/grammar', async (req, res) => {
  try {
    const { text } = req.body;
    const model = getGeminiModel(true); // Dùng JSON mode
    
    const prompt = `
      Act as an English Grammar Checker.
      Input text: "${text}"
      
      Task:
      1. Check for grammatical errors.
      2. If correct, return "isCorrect": true.
      3. If incorrect, return "isCorrect": false, provide the corrected version, and explain the error in Vietnamese.
      
      Output strictly JSON:
      {
        "isCorrect": boolean,
        "corrected": "String (Corrected sentence or empty if correct)",
        "explanation": "String (Explain error in Vietnamese or Compliment if correct)"
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
    res.json(JSON.parse(responseText));
  } catch (error) {
    console.error("Grammar Error:", error);
    res.status(500).json({ message: 'Lỗi kiểm tra ngữ pháp' });
  }
});
// ==========================================
// 5. API TEXT TO SPEECH (HUGGING FACE)
// ==========================================
router.post('/text-to-speech', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Text is required' });

    // Giới hạn độ dài để tránh lỗi API free
    const safeText = text.substring(0, 300);

    // Gọi Hugging Face TTS API
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/espnet/kan-bayashi_ljspeech_fastspeech2_raw',
      { inputs: safeText },
      {
        headers: { 
          'Content-Type': 'application/json',
           // Nếu bạn có token HuggingFace thì bỏ comment dòng dưới để ổn định hơn
           // 'Authorization': `Bearer ${process.env.HF_TOKEN}` 
        },
        timeout: 30000,
        responseType: 'arraybuffer'
      }
    );

    const audioBuffer = Buffer.from(response.data);
    const audioBase64 = audioBuffer.toString('base64');

    res.json({
      success: true,
      audioBase64: audioBase64,
      format: 'wav'
    });

  } catch (error) {
    console.error('TTS error (using fallback):', error.message);
    // Báo cho Client biết để tự dùng Web Speech API của trình duyệt
    res.json({
      success: true,
      useWebSpeech: true,
      message: 'Server TTS failed, switching to Browser TTS'
    });
  }
});

export default router;