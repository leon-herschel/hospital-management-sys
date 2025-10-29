// components/Sidebar.jsx
import React from 'react';
import { MessageCircle, Plus, Trash2 } from 'lucide-react';

const AiSidebar = ({
  sidebarOpen,
  setSidebarOpen,
  createNewConversation,
  user,
  userProfile,
  conversations,
  currentConversationId,
  loadConversationHistory,
  deleteConversation
}) => {
  return (
    <div className={`${sidebarOpen ? 'w-80' : 'w-0 lg:w-16'} bg-white shadow-lg transition-all duration-300 flex flex-col overflow-hidden border-r`}>
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MessageCircle className="w-6 h-6 text-blue-600" />
          </button>
          {sidebarOpen && (
            <button
              onClick={createNewConversation}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </button>
          )}
        </div>
      </div>

      {sidebarOpen && (
        <>
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              {user ? 'Recent Conversations' : 'Sign in to save conversations'}
            </h3>
            
           
            
            {user && conversations.length === 0 && (
              <div className="text-xs text-gray-500 italic mb-3 p-2 bg-gray-50 rounded">
                No conversations yet. Start chatting to see them here!
              </div>
            )}
            
            {user && conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group relative mb-2 rounded-lg transition-colors ${
                  currentConversationId === conv.id 
                    ? 'bg-blue-50 border border-blue-200' 
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                <button
                  onClick={() => loadConversationHistory(conv.id)}
                  className="w-full text-left p-3"
                >
                  <div className="font-medium text-gray-900 truncate text-sm pr-8">
                    {conv.title || 'Untitled Conversation'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {conv.messageCount || 0} messages • {new Date(conv.lastUpdated || conv.createdAt).toLocaleDateString()}
                  </div>
                  {conv.lastMessage && (
                    <div className="text-xs text-gray-400 mt-1 truncate pr-8">
                      {conv.lastMessage}
                    </div>
                  )}
                </button>
                <button
                  onClick={(e) => deleteConversation(conv.id, e)}
                  className="absolute top-3 right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all"
                >
                  <Trash2 className="w-3 h-3 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AiSidebar;