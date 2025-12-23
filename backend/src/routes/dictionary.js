import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai'; // Import thêm thư viện AI

dotenv.config();

const router = express.Router();
const MW_API_KEY = process.env.MW_API_KEY;
const MW_URL = 'https://www.dictionaryapi.com/api/v3/references/learners/json';

// Khởi tạo Gemini để dịch
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.get('/:word', async (req, res) => {
  try {
    const { word } = req.params;

    if (!MW_API_KEY) {
      return res.status(500).json({ message: 'Chưa cấu hình Merriam-Webster API Key' });
    }

    // --- 1. GỌI TỪ ĐIỂN ANH-ANH (Merriam-Webster) ---
    const response = await axios.get(`${MW_URL}/${word}?key=${MW_API_KEY}`);
    const data = response.data;

    if (!data || data.length === 0 || typeof data[0] === 'string') {
      return res.status(404).json({ message: 'Không tìm thấy từ này trong từ điển.' });
    }

    const entry = data[0];
    const cleanWord = entry.hwi.hw.replace(/\*/g, '');
    const phonetic = entry.hwi.prs ? `/${entry.hwi.prs[0].ipa}/` : '';
    const definitions = entry.shortdef || [];

    // --- 2. GỌI AI ĐỂ DỊCH SANG TIẾNG VIỆT ---
    let vietnameseMeaning = "";
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
      const prompt = `Dịch từ tiếng Anh "${cleanWord}" sang tiếng Việt. Chỉ trả về 1-2 nghĩa thông dụng nhất, ngắn gọn, viết thường, cách nhau bởi dấu phẩy. Không giải thích thêm.`;
      
      const resultAI = await model.generateContent(prompt);
      vietnameseMeaning = resultAI.response.text().trim();
    } catch (err) {
      console.error("Lỗi dịch AI:", err.message);
      vietnameseMeaning = "Chưa dịch được"; // Fallback nếu AI lỗi
    }

    // --- 3. TRẢ VỀ KẾT QUẢ GỘP ---
    const result = {
      word: cleanWord,
      phonetic: phonetic,
      vietnamese: vietnameseMeaning, // <--- Trường mới chứa nghĩa Tiếng Việt
      meanings: [
        {
          partOfSpeech: entry.fl || 'unknown',
          definitions: definitions.slice(0, 3).map(def => ({
            definition: def,
            example: null
          }))
        }
      ]
    };

    res.json(result);

  } catch (error) {
    console.error('Lỗi Merriam-Webster:', error.message);
    res.status(500).json({ message: 'Lỗi server từ điển' });
  }
});

export default router;