// components/WelcomeScreen.jsx
import React from 'react';
import { Bot } from 'lucide-react';

const WelcomeScreen = ({ quickPrompts, handleQuickPrompt }) => {
  return (
    <div className="text-center mt-20">
      <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center mx-auto mb-6">
        <Bot className="w-10 h-10 text-white" />
      </div>
      <h3 className="text-xl font-semibold text-gray-800 mb-3">
        Welcome to Odyssey AI Assistant
      </h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        I'm here to help you with medical consultations, patient management, 
        inventory tracking, and other healthcare administrative tasks.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
        {quickPrompts.map((prompt, index) => {
          const IconComponent = prompt.icon;
          return (
            <button
              key={index}
              onClick={() => handleQuickPrompt(prompt.prompt)}
              className="p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 hover:border-blue-300"
            >
              <IconComponent className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="font-medium text-gray-800">{prompt.title}</div>
              <div className="text-xs text-gray-500 mt-1">{prompt.category}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default WelcomeScreen;