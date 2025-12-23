import React, { useState } from 'react';
import { aiService } from '../../services/aiService';
import { flashcardAPI } from '../../services/api';

const StudyPage = () => {
  const [inputText, setInputText] = useState('');
  const [analyzedText, setAnalyzedText] = useState(''); // Text để hiển thị và bôi đen
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Popup dịch nhanh
  const [popup, setPopup] = useState({ show: false, x: 0, y: 0, text: '', translation: null, loading: false });

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setAnalyzedText(inputText); // Chuyển text sang chế độ đọc
    setSummary('');
    
    try {
      const summaryRes = await aiService.summarize(inputText);
      setSummary(summaryRes);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  // --- XỬ LÝ BÔI ĐEN (HIGHLIGHT) ---
  const handleMouseUp = async () => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (!selectedText) {
      // Nếu click ra ngoài thì đóng popup
      if (popup.show) setPopup({ ...popup, show: false });
      return;
    }

    // Lấy vị trí bôi đen để hiện popup ngay đó
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    // Hiện popup loading trước
    setPopup({
      show: true,
      x: rect.left + window.scrollX,
      y: rect.bottom + window.scrollY + 10,
      text: selectedText,
      translation: null,
      loading: true
    });

    // Gọi API dịch ngay lập tức
    try {
      const res = await aiService.translate(selectedText);
      setPopup(prev => ({ ...prev, translation: res, loading: false }));
    } catch (error) {
      setPopup(prev => ({ ...prev, loading: false }));
    }
  };

  const handleSaveFromPopup = async () => {
    if (!popup.translation) return;
    try {
      await flashcardAPI.add({
        front: popup.translation.original,
        back: popup.translation.translated,
        example: popup.translation.example
      });
      alert("✅ Đã lưu!");
      setPopup({ ...popup, show: false });
      window.getSelection().removeAllRanges(); // Bỏ bôi đen
    } catch (error) {
      alert("Lỗi lưu từ.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 min-h-screen" onMouseUp={handleMouseUp}>
      <h1 className="text-3xl font-bold text-center mb-6 text-purple-700">Trợ Lý Đọc Hiểu & Ôn Tập</h1>

      {/* INPUT AREA */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <textarea
          className="w-full h-32 p-4 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none mb-3"
          placeholder="Dán bài báo, đoạn văn tiếng Anh vào đây..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        ></textarea>
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="bg-purple-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-purple-700 w-full"
        >
          {loading ? 'Đang phân tích...' : 'Bắt đầu học'}
        </button>
      </div>

      {/* KẾT QUẢ PHÂN TÍCH */}
      {analyzedText && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
          
          {/* CỘT TRÁI: VĂN BẢN GỐC (ĐỂ BÔI ĐEN) */}
          <div className="md:col-span-2">
            <h2 className="text-xl font-bold text-gray-800 mb-3 border-l-4 border-purple-500 pl-3">
              Văn bản gốc (Bôi đen để tra từ)
            </h2>
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200 text-lg leading-relaxed text-gray-800 whitespace-pre-wrap">
              {analyzedText}
            </div>
          </div>

          {/* CỘT PHẢI: TÓM TẮT AI */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-3 border-l-4 border-blue-500 pl-3">
              Tóm tắt AI
            </h2>
            <div className="bg-blue-50 p-4 rounded-lg text-gray-700 text-sm leading-relaxed border border-blue-100">
              {summary || "Đang tạo tóm tắt..."}
            </div>
          </div>
        </div>
      )}

      {/* --- POPUP DỊCH NHANH (HIỆN KHI BÔI ĐEN) --- */}
      {popup.show && (
        <div 
          className="absolute z-50 bg-white rounded-xl shadow-2xl border border-gray-200 p-4 w-72 animate-scale-in"
          style={{ top: popup.y, left: popup.x }}
          onMouseUp={(e) => e.stopPropagation()} // Chặn sự kiện để không đóng popup khi click vào nó
        >
          {popup.loading ? (
            <div className="text-center text-gray-500 text-sm">🔄 Đang dịch...</div>
          ) : popup.translation ? (
            <div>
              <div className="mb-2">
                <span className="text-xs font-bold text-gray-400 uppercase">Tiếng Anh</span>
                <p className="font-bold text-gray-800">{popup.translation.original}</p>
              </div>
              <div className="mb-3">
                <span className="text-xs font-bold text-gray-400 uppercase">Tiếng Việt</span>
                <p className="text-xl font-bold text-blue-600">{popup.translation.translated}</p>
                <p className="text-xs text-gray-500 italic mt-1">({popup.translation.type})</p>
              </div>
              <button 
                onClick={handleSaveFromPopup}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold py-1 rounded text-sm transition"
              >
                ⭐ Lưu vào Flashcard
              </button>
            </div>
          ) : (
             <p className="text-red-500 text-sm">Lỗi dịch.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default StudyPage;