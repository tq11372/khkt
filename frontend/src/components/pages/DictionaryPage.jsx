import React, { useState } from 'react';
import { aiService } from '../../services/aiService';
import { flashcardAPI } from '../../services/api'; // Import API lưu flashcard
import Pronunciation from '../Pronunciation';

const DictionaryPage = () => {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('translate'); // 'translate' | 'grammar'
  const [data, setData] = useState(null);        // Kết quả dịch
  const [grammar, setGrammar] = useState(null);  // Kết quả ngữ pháp
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleProcess = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setData(null);
    setGrammar(null);

    try {
      if (mode === 'translate') {
        const res = await aiService.translate(input);
        setData(res);
      } else {
        const res = await aiService.checkGrammar(input);
        setGrammar(res);
      }
    } catch (error) {
      alert("Lỗi kết nối AI. Hãy kiểm tra Backend.");
    }
    setLoading(false);
  };

  const handleSaveWord = async () => {
    if (!data) return;
    setSaving(true);
    try {
      await flashcardAPI.add({
        front: data.original,
        back: data.translated,
        example: data.example
      });
      alert("✅ Đã lưu vào bộ từ vựng!");
    } catch (error) {
      alert("❌ Lỗi lưu từ (Có thể Server chưa bật hoặc từ đã tồn tại)");
    }
    setSaving(false);
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* HEADER & TOGGLE */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-blue-700 mb-4">
          {mode === 'translate' ? 'Từ Điển Thông Minh' : 'Kiểm Tra Ngữ Pháp'}
        </h1>
        <div className="inline-flex bg-gray-200 rounded-full p-1">
          <button 
            onClick={() => setMode('translate')}
            className={`px-6 py-2 rounded-full font-bold transition-all ${mode === 'translate' ? 'bg-white text-blue-600 shadow' : 'text-gray-500'}`}
          >
            📖 Dịch Thuật
          </button>
          <button 
            onClick={() => setMode('grammar')}
            className={`px-6 py-2 rounded-full font-bold transition-all ${mode === 'grammar' ? 'bg-white text-green-600 shadow' : 'text-gray-500'}`}
          >
            ✍️ Ngữ Pháp
          </button>
        </div>
      </div>

      {/* INPUT AREA */}
      <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100 mb-6">
        <textarea
          className="w-full p-3 text-lg outline-none resize-none"
          rows="3"
          placeholder={mode === 'translate' ? "Nhập từ hoặc câu cần dịch..." : "Nhập câu tiếng Anh cần kiểm tra lỗi..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleProcess())}
        />
        <div className="flex justify-end mt-2">
          <button 
            onClick={handleProcess}
            disabled={loading}
            className={`px-8 py-2 rounded-lg font-bold text-white transition-all ${loading ? 'bg-gray-400' : (mode === 'translate' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700')}`}
          >
            {loading ? 'Đang xử lý...' : (mode === 'translate' ? 'Dịch Ngay' : 'Check Lỗi')}
          </button>
        </div>
      </div>

      {/* RESULT: TRANSLATE */}
      {data && mode === 'translate' && (
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-blue-500 animate-fade-in">
          <div className="flex justify-between items-start mb-4 border-b pb-3">
             <div>
                <h2 className="text-2xl font-bold text-gray-800">{data.translated}</h2>
                <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded ml-2">{data.type}</span>
             </div>
             <button 
               onClick={handleSaveWord}
               disabled={saving}
               className="btn btn-sm bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-none flex items-center gap-1"
             >
               {saving ? '⏳' : '⭐ Lưu từ'}
             </button>
          </div>
          <div className="space-y-2 text-gray-700">
            <p><strong>Định nghĩa:</strong> {data.definition}</p>
            <p className="italic bg-gray-50 p-2 rounded">" {data.example} "</p>
          </div>
          <Pronunciation targetText={data.original} />
        </div>
      )}

      {/* RESULT: GRAMMAR */}
      {grammar && mode === 'grammar' && (
        <div className={`p-6 rounded-xl shadow-lg border-l-4 animate-fade-in ${grammar.isCorrect ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">{grammar.isCorrect ? '🎉' : '⚠️'}</span>
            <h3 className={`text-xl font-bold ${grammar.isCorrect ? 'text-green-800' : 'text-red-800'}`}>
              {grammar.isCorrect ? "Câu Chính Xác!" : "Phát Hiện Lỗi"}
            </h3>
          </div>
          
          {!grammar.isCorrect && (
            <div className="mb-4 bg-white p-3 rounded border border-red-200">
              <p className="text-sm text-gray-500 mb-1">Câu sửa lại:</p>
              <p className="text-xl font-bold text-green-700">{grammar.corrected}</p>
            </div>
          )}
          
          <div className="text-gray-800">
            <span className="font-bold">Giải thích: </span>
            <span>{grammar.explanation}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DictionaryPage;