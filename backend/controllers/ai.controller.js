// controllers/ai.controller.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

dotenv.config();

// Khởi tạo Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export const processAI = async (req, res) => {
  try {
    const { type, text } = req.body; // type: 'translate', 'summarize', 'quiz'
    let prompt = "";

    // Cấu hình Prompt dựa trên loại yêu cầu
    switch (type) {
      case 'translate':
        prompt = `Translate the following text to Vietnamese: "${text}". Provide the definition and one example sentence.`;
        break;
      
      case 'summarize':
        prompt = `Summarize the following text in Vietnamese nicely and concisely: "${text}"`;
        break;

      case 'quiz':
        prompt = `Based on the following text: "${text}". 
        Generate 3 multiple-choice questions in Vietnamese to test reading comprehension.
        Strictly return ONLY a raw JSON string (no markdown, no code blocks) with this format:
        [
          {
            "question": "Question text here",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": "Option A"
          }
        ]`;
        break;

      default:
        return res.status(400).json({ message: "Invalid type" });
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let output = response.text();

    // Làm sạch chuỗi JSON nếu Gemini lỡ thêm dấu markdown
    if (type === 'quiz') {
      output = output.replace(/```json/g, "").replace(/```/g, "").trim();
    }

    res.json({ result: output });

  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ message: "AI processing failed", error: error.message });
  }
};