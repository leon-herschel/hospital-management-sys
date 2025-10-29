// components/InputArea.jsx
import React from 'react';
import { Send, RefreshCw, Loader2 } from 'lucide-react';

const InputArea = ({
  inputMessage,
  setInputMessage,
  handleSendMessage,
  isLoading,
  messages,
  regenerateResponse,
  textareaRef
}) => {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="bg-white border-t shadow-sm p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about diagnoses, inventory, appointments, or any healthcare questions..."
              className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none min-h-[52px] max-h-32 bg-gray-50"
              rows={1}
              disabled={isLoading}
            />
          </div>
          <div className="flex gap-2">
            {messages.length > 0 && (
              <button
                onClick={regenerateResponse}
                disabled={isLoading}
                className="p-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-2xl transition-colors disabled:opacity-50"
                title="Regenerate response"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isLoading}
              className="p-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
        
        <p className="text-xs text-gray-500 mt-3 text-center">
          AI responses are for informational purposes only and should not replace professional medical judgment.
          Always consult with qualified healthcare professionals for medical decisions.
        </p>
      </div>
    </div>
  );
};

export default InputArea;