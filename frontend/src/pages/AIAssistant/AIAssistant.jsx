// Add refs for listener cleanup
import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, Plus, Loader2, User, Bot, Stethoscope, FileText, Calendar, Pill, Trash2, Copy, RefreshCw } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, push, set, onValue, query, orderByChild, limitToLast, remove, get } from 'firebase/database';

import { auth, database, model } from '../../firebase/firebase';

const AIAssistant = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const conversationListenerRef = useRef(null);
  const messagesListenerRef = useRef(null);
  
  const [quickPrompts] = useState([
    {
      icon: Stethoscope,
      title: "Medical Consultation",
      prompt: "I need help with a medical consultation. Can you assist me with differential diagnosis and treatment recommendations?",
      category: "Clinical"
    },
    {
      icon: FileText,
      title: "Patient Documentation",
      prompt: "Help me with patient documentation, medical records formatting, and clinical note templates.",
      category: "Documentation"
    },
    {
      icon: Calendar,
      title: "Appointment Management",
      prompt: "I need assistance with appointment scheduling, patient flow optimization, and clinic management.",
      category: "Administrative"
    },
    {
      icon: Pill,
      title: "Medication Information",
      prompt: "I need information about medications, drug interactions, dosages, and pharmaceutical guidelines.",
      category: "Pharmacy"
    }
  ]);
  
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Load user profile from users node
  const loadUserProfile = async (authUser) => {
    if (!authUser) {
      setUserProfile(null);
      return null;
    }

    try {
      const userRef = ref(database, `users/${authUser.uid}`);
      const snapshot = await get(userRef);
      
      if (snapshot.exists()) {
        const profile = snapshot.val();
        setUserProfile(profile);
        return profile;
      } else {
        // Fallback to auth user data
        const fallbackProfile = {
          uid: authUser.uid,
          email: authUser.email,
          displayName: authUser.displayName
        };
        setUserProfile(fallbackProfile);
        return fallbackProfile;
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      return null;
    }
  };

  // Fixed loadUserConversations function - now uses the current user state
  const loadUserConversations = async (userToLoad = user) => {
    if (!userToLoad) {
      setConversations([]);
      return;
    }
    
    // Clean up previous conversations listener to prevent duplicates
    if (conversationListenerRef.current) {
      conversationListenerRef.current();
      conversationListenerRef.current = null;
    }
    
    try {
      const conversationsRef = ref(database, `conversations/${userToLoad.uid}`);
      
      const unsubscribe = onValue(conversationsRef, (snapshot) => {
        if (snapshot.exists()) {
          const conversationsData = [];
          snapshot.forEach((child) => {
            const conversationKey = child.key;
            const conversationData = child.val();
            
            // Check if this conversation has metadata
            if (conversationData && conversationData.metadata) {
              const metadata = conversationData.metadata;
              
              const conversation = {
                id: conversationKey,
                title: metadata.title || 'Untitled Conversation',
                lastUpdated: metadata.lastUpdated || metadata.createdAt || Date.now(),
                createdAt: metadata.createdAt || Date.now(),
                messageCount: metadata.messageCount || 0,
                lastMessage: metadata.lastMessage || '',
                userId: metadata.userId
              };
              
              conversationsData.push(conversation);
            } else {
              // Fallback for conversations without metadata
              const fallbackConversation = {
                id: conversationKey,
                title: 'Untitled Conversation',
                lastUpdated: Date.now(),
                createdAt: Date.now(),
                messageCount: 0,
                lastMessage: '',
                userId: userToLoad.uid
              };
              conversationsData.push(fallbackConversation);
            }
          });
          
          // Sort by last updated (most recent first)
          conversationsData.sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));
          
          setConversations(conversationsData);
        } else {
          setConversations([]);
        }
      }, (error) => {
        console.error('Error in conversations listener:', error);
        setConversations([]);
      });

      conversationListenerRef.current = unsubscribe;
      
    } catch (error) {
      console.error('Error setting up conversations listener:', error);
      setConversations([]);
    }
  };

  // Auth state listener with user profile loading - FIXED
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);
      
      if (authUser) {
        // First load user profile from users node
        const profile = await loadUserProfile(authUser);
        
        // Then load conversations using the authenticated user
        await loadUserConversations(authUser); // Pass the authUser directly
      } else {
        // Clean up when user signs out
        setUserProfile(null);
        if (conversationListenerRef.current) {
          conversationListenerRef.current();
          conversationListenerRef.current = null;
        }
        if (messagesListenerRef.current) {
          messagesListenerRef.current();
          messagesListenerRef.current = null;
        }
        setMessages([]);
        setConversations([]);
        setCurrentConversationId(null);
      }
    });
    return () => unsubscribe();
  }, []); // Remove the dependency array to prevent infinite loops

  // Auto scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [inputMessage]);

  // Message listener for current conversation - optimized for real-time
  useEffect(() => {
    // Clean up previous message listener
    if (messagesListenerRef.current) {
      messagesListenerRef.current();
      messagesListenerRef.current = null;
    }

    if (user && currentConversationId) {
      const messagesRef = query(
        ref(database, `conversations/${user.uid}/${currentConversationId}/messages`),
        orderByChild('timestamp'),
        limitToLast(100)
      );
      
      const unsubscribe = onValue(messagesRef, (snapshot) => {
        const messagesData = [];
        if (snapshot.exists()) {
          snapshot.forEach((child) => {
            messagesData.push({
              id: child.key,
              ...child.val()
            });
          });
        }
        // Sort by timestamp
        messagesData.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        
        // Always update messages in real-time
        setMessages(messagesData);
      }, (error) => {
        console.error('Error listening to messages:', error);
      });

      messagesListenerRef.current = unsubscribe;
    }

    return () => {
      if (messagesListenerRef.current) {
        messagesListenerRef.current();
        messagesListenerRef.current = null;
      }
    };
  }, [user, currentConversationId]);

  // Cleanup listeners on unmount
  useEffect(() => {
    return () => {
      if (conversationListenerRef.current) {
        conversationListenerRef.current();
      }
      if (messagesListenerRef.current) {
        messagesListenerRef.current();
      }
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversationHistory = async (conversationId) => {
    if (!user || !conversationId) return;

    try {
      setCurrentConversationId(conversationId);
    } catch (error) {
      console.error('Error loading conversation history:', error);
    }
  };

  const createNewConversation = async () => {
    if (!user) {
      setMessages([]);
      setCurrentConversationId(null);
      return;
    }

    try {
      const conversationsRef = ref(database, `conversations/${user.uid}`);
      const newConversationRef = push(conversationsRef);
      const conversationId = newConversationRef.key;
      const timestamp = Date.now();

      const conversationData = {
        id: conversationId,
        title: `New Medical Consultation`,
        createdAt: timestamp,
        lastUpdated: timestamp,
        messageCount: 0,
        userId: user.uid
      };

      await set(ref(database, `conversations/${user.uid}/${conversationId}/metadata`), conversationData);
      
      setCurrentConversationId(conversationId);
      setMessages([]);
      
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const deleteConversation = async (conversationId, event) => {
    event.stopPropagation();
    if (!user || !conversationId) return;

    if (window.confirm('Are you sure you want to delete this conversation?')) {
      try {
        await remove(ref(database, `conversations/${user.uid}/${conversationId}`));
        if (currentConversationId === conversationId) {
          setCurrentConversationId(null);
          setMessages([]);
        }
      } catch (error) {
        console.error('Error deleting conversation:', error);
      }
    }
  };

  const handleSendMessage = async (messageText = inputMessage) => {
    if (!messageText.trim() || isLoading) return;

    const timestamp = Date.now();
    const userMessage = {
      id: `user_${timestamp}`,
      role: 'user',
      content: messageText,
      timestamp: timestamp
    };

    // Always update local state first for immediate UI response
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      let conversationId = currentConversationId;
      
      // Create new conversation if needed
      if (!conversationId && user) {
        const conversationsRef = ref(database, `conversations/${user.uid}`);
        const newConversationRef = push(conversationsRef);
        conversationId = newConversationRef.key;
        
        const title = messageText.length > 50 
          ? messageText.substring(0, 50) + '...' 
          : messageText;
        
        const conversationData = {
          id: conversationId,
          title: title || 'New Medical Consultation',
          createdAt: timestamp,
          lastUpdated: timestamp,
          messageCount: 0,
          userId: user.uid
        };

        await set(ref(database, `conversations/${user.uid}/${conversationId}/metadata`), conversationData);
        setCurrentConversationId(conversationId);
      }

      // Get conversation history for context (last 10 messages)
      let contextHistory = '';
      if (messages.length > 0) {
        const recentMessages = messages.slice(-10);
        contextHistory = recentMessages
          .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
          .join('\n');
      }

      // Enhanced prompt for medical context with conversation history
      const medicalContext = `You are an AI assistant for Odyssey Healthcare Management System. You help healthcare professionals with:

- Medical consultations and differential diagnosis
- Patient management and clinical workflows  
- Medical documentation and record keeping
- Medication information and drug interactions
- Appointment scheduling and clinic management
- Healthcare inventory and supply management
- Medical billing and insurance processes
- Laboratory test interpretation
- Clinical decision support

Please provide professional, accurate, and helpful responses while being mindful of medical ethics and the need for human oversight in medical decisions.

${contextHistory ? `Recent conversation context:\n${contextHistory}\n\n` : ''}

Current user message: ${messageText}

Please respond in a professional manner suitable for healthcare professionals.`;
      
      // Generate AI response using Firebase AI
      const result = await model.generateContent(medicalContext);
      const aiResponse = result.response.text();

      const aiMessage = {
        id: `ai_${timestamp + 1}`,
        role: 'assistant',
        content: aiResponse,
        timestamp: timestamp + 1
      };

      // Update local state immediately for UI responsiveness
      setMessages(prev => {
        const updatedMessages = [...prev, aiMessage];
        return updatedMessages;
      });

      // Then save to database if user is authenticated (in background)
      if (user && conversationId) {
        try {
          const messagesRef = ref(database, `conversations/${user.uid}/${conversationId}/messages`);
          
          // Save user message
          await push(messagesRef, userMessage);
          
          // Save AI message
          await push(messagesRef, aiMessage);

          // Update conversation metadata
          const title = messageText.length > 50 
            ? messageText.substring(0, 50) + '...' 
            : messageText;

          const metadataUpdate = {
            id: conversationId,
            title: title,
            lastMessage: aiResponse.substring(0, 100) + (aiResponse.length > 100 ? '...' : ''),
            lastUpdated: timestamp + 1,
            messageCount: messages.length + 2,
            userId: user.uid,
            createdAt: timestamp
          };

          await set(ref(database, `conversations/${user.uid}/${conversationId}/metadata`), metadataUpdate);
        } catch (dbError) {
          console.error('Error saving to database:', dbError);
          // Message is already in local state, so user sees it regardless of database errors
        }
      }
      
    } catch (error) {
      console.error('Error generating AI response:', error);
      const errorMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: 'I apologize, but I encountered an error while processing your request. Please check your connection and try again. If the issue persists, please contact your system administrator.',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const handleQuickPrompt = (prompt) => {
    setInputMessage(prompt);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyMessageToClipboard = async (content) => {
    try {
      await navigator.clipboard.writeText(content);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  const regenerateResponse = async () => {
    if (messages.length < 2) return;
    
    // Get the last user message
    const lastUserMessage = [...messages].reverse().find(msg => msg.role === 'user');
    if (lastUserMessage) {
      // Remove the last AI response
      const newMessages = messages.filter(msg => 
        !(msg.role === 'assistant' && msg.timestamp > lastUserMessage.timestamp)
      );
      setMessages(newMessages);
      
      // Resend the last user message
      setTimeout(() => {
        handleSendMessage(lastUserMessage.content);
      }, 500);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              Odyssey AI Assistant
            </h1>
            <p className="text-gray-600 mt-1">
              Your intelligent healthcare management assistant
            </p>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MessageCircle className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Sidebar */}
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
              {/* Conversation History */}
              <div className="flex-1 overflow-y-auto p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  {user ? 'Recent Conversations' : 'Sign in to save conversations'}
                </h3>
                
                {/* Debug info - showing user profile */}
                {process.env.NODE_ENV === 'development' && user && userProfile && (
                  <div className="text-xs text-gray-400 mb-2 p-2 bg-gray-50 rounded">
                    User: {userProfile.email || userProfile.displayName || userProfile.uid}
                  </div>
                )}
                
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

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6">
            {messages.length === 0 ? (
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
                
                {/* Welcome Quick Actions */}
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
            ) : (
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
                        <span>{new Date(message.timestamp).toLocaleString()}</span>
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
            )}
          </div>

          {/* Input Area */}
          <div className="bg-white border-t shadow-sm p-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <textarea
                    ref={textareaRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me about medical consultations, patient management, inventory, or any healthcare related questions..."
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
              
              {/* Disclaimer */}
              <p className="text-xs text-gray-500 mt-3 text-center">
                AI responses are for informational purposes only and should not replace professional medical judgment.
                Always consult with qualified healthcare professionals for medical decisions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;