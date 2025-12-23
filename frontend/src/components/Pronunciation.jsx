import React, { useState, useRef, useEffect } from 'react';
import stringSimilarity from 'string-similarity';

const Pronunciation = ({ targetText }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [score, setScore] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Dùng useRef để lưu trữ object nhận diện giọng nói
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Khởi tạo SpeechRecognition (Hỗ trợ Chrome, Edge, Safari...)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false; // Tự động dừng khi ngưng nói
      recognition.interimResults = true; // Hiện kết quả ngay khi đang nói

      recognition.onstart = () => setIsListening(true);
      
      recognition.onresult = (event) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript;
        setTranscript(transcriptText);
      };

      recognition.onend = () => setIsListening(false);
      
      recognitionRef.current = recognition;
    }
  }, []);

  const handleStart = () => {
    if (!recognitionRef.current) {
      alert("Trình duyệt này không hỗ trợ nhận diện giọng nói. Hãy dùng Chrome hoặc Edge.");
      return;
    }
    setScore(null);
    setTranscript('');
    recognitionRef.current.start();
  };

  const handleStopAndGrade = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      
      // Chấm điểm (đợi một chút để text cập nhật xong)
      setTimeout(() => {
        if (!transcript) return;
        const similarity = stringSimilarity.compareTwoStrings(
          transcript.toLowerCase().trim(), 
          targetText.toLowerCase().trim()
        );
        setScore(Math.round(similarity * 100));
      }, 500);
    }
  };

  const playSample = () => {
    const utterance = new SpeechSynthesisUtterance(targetText);
    utterance.lang = 'en-US';
    utterance.rate = 0.8;
    setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="mt-6 p-5 bg-white border-2 border-indigo-100 rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="font-bold text-gray-700 text-lg">Luyện nói</h4>
          <p className="text-sm text-gray-500">Từ mẫu: <span className="text-blue-600 font-bold text-lg">"{targetText}"</span></p>
        </div>
        <button 
          onClick={playSample} 
          disabled={isPlaying}
          className="btn btn-sm bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-none"
        >
          {isPlaying ? '🔊 Đang đọc...' : '🔊 Nghe mẫu'}
        </button>
      </div>
      
      <div className="min-h-[60px] bg-gray-50 p-4 rounded-lg mb-4 text-gray-700 border border-gray-200">
        {transcript ? (
          <span className="font-medium">{transcript}</span>
        ) : (
          <span className="italic text-gray-400">Nhấn micro và đọc to từ vựng...</span>
        )}
      </div>

      <div className="flex gap-3 items-center">
        {!isListening ? (
          <button 
            onClick={handleStart}
            className="btn bg-blue-600 text-white hover:bg-blue-700 border-none flex items-center gap-2"
          >
            🎙️ Bắt đầu nói
          </button>
        ) : (
          <button 
            onClick={handleStopAndGrade}
            className="btn bg-red-500 text-white hover:bg-red-600 border-none flex items-center gap-2 animate-pulse"
          >
            ⏹️ Dừng & Chấm điểm
          </button>
        )}

        {score !== null && (
          <div className="ml-auto flex items-center gap-3 animate-fade-in-up">
            <span className="text-sm font-semibold text-gray-600">Kết quả:</span>
            <div className={`text-2xl font-black ${score >= 80 ? 'text-green-500' : score >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
              {score}/100
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Pronunciation;