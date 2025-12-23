// src/components/services/aiService.js
import axios from 'axios';

// Đổi port 5000 nếu server backend của bạn chạy port khác
const API_URL = 'https://khkt-1-7l7b.onrender.com/api/ai';

export const aiService = {
  translate: async (text) => {
    const response = await axios.post(`${API_URL}/translate`, { text });
    return response.data.result;
  },
  summarize: async (content) => {
    const response = await axios.post(`${API_URL}/summarize`, { content });
    return response.data.summary;
  },
  generateQuiz: async (content) => {
    const response = await axios.post(`${API_URL}/quiz`, { content });
    return response.data.quiz;
  },
  textToSpeech: async (text) => {
      const response = await axios.post(`${API_URL}/text-to-speech`, { text });
      return response.data;
  },
  // Thêm hàm analyzeSentiment nếu thiếu
  analyzeSentiment: async (text) => {
      // Logic gọi API sentiment (nếu có)
  },
  checkGrammar: async (text) => {
    const response = await axios.post(`${API_URL}/grammar`, { text });
    return response.data;
  }
};