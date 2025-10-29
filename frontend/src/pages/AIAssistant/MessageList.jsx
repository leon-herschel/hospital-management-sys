// components/MessageList.jsx
import React from 'react';
import { Bot, User, Copy, Loader2 } from 'lucide-react';

const MessageList = ({
  messages,
  isLoading,
  isTyping,
  copyMessageToClipboard,
  messagesEndRef
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          {message.role === 'assistant' && (
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-white" />
            </div>
          )}
          
          <div
            className={`max-w-3xl px-6 py-4 rounded-2xl relative group ${
              message.role === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-white shadow-sm border text-gray-800'
            }`}
          >
            <div className="whitespace-pre-wrap break-words leading-relaxed">
              {message.content}
            </div>
            <div className={`text-xs mt-3 flex items-center justify-between ${
              message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
            }`}>
              <span>
                {new Date(message.timestamp).toLocaleString()}
                {message.cached && ' • Cached'}
              </span>
              {message.role === 'assistant' && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => copyMessageToClipboard(message.content)}
                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                    title="Copy message"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {message.role === 'user' && (
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-gray-600" />
            </div>
          )}
        </div>
      ))}
      
      {isLoading && (
        <div className="flex gap-4 justify-start max-w-4xl mx-auto">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div className="bg-white shadow-sm border px-6 py-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span className="text-gray-600">
                {isTyping ? 'Analyzing your request...' : 'Thinking...'}
              </span>
            </div>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;