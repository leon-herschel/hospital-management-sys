import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, Plus, Loader2, User, Bot, Stethoscope, FileText, Calendar, Pill, Trash2, Copy, RefreshCw } from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { ref, push, set, onValue, query, orderByChild, limitToLast, remove, get } from 'firebase/database';
import { auth, database, model } from '../../firebase/firebase';

// Import components
import Sidebar from './AISidebar';
import MessageList from './MessageList';
import InputArea from './InputArea';
import WelcomeScreen from './WelcomeScreen';
import { queryDatabaseContext } from './service/databaseQuery';
import { getCachedResponse, setCachedResponse } from './service/responseCache';

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
      title: "Common Diagnoses",
      prompt: "What are the most common diagnoses we have for this month?",
      category: "Analytics"
    },
    {
      icon: Calendar,
      title: "Inventory Check",
      prompt: "What is the current inventory status for our clinics?",
      category: "Inventory"
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

  // Load user profile
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

  // Load conversations
  const loadUserConversations = async (userToLoad = user) => {
    if (!userToLoad) {
      setConversations([]);
      return;
    }
    
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
            }
          });
          
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

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);
      
      if (authUser) {
        const profile = await loadUserProfile(authUser);
        await loadUserConversations(authUser);
      } else {
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
  }, []);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [inputMessage]);

  // Message listener
  useEffect(() => {
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
        messagesData.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
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

  // Cleanup
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

  const loadConversationHistory = async (conversationId) => {
    if (!user || !conversationId) return;
    setCurrentConversationId(conversationId);
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

      // Check cache first
      const cachedResponse = getCachedResponse(messageText);
      let aiResponseText;
      let usedCache = false;

      if (cachedResponse) {
        aiResponseText = cachedResponse;
        usedCache = true;
        console.log('Using cached response');
      } else {
        // Query database for context
        const dbContext = await queryDatabaseContext(messageText, database);
        
        // Get conversation history
        let contextHistory = '';
        if (messages.length > 0) {
          const recentMessages = messages.slice(-10);
          contextHistory = recentMessages
            .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
            .join('\n');
        }

        // Enhanced prompt with database context
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

${dbContext ? `\n=== RELEVANT DATABASE INFORMATION ===\n${dbContext}\n=== END DATABASE INFORMATION ===\n` : ''}

${contextHistory ? `Recent conversation context:\n${contextHistory}\n\n` : ''}

Current user message: ${messageText}

Please provide professional, accurate, and helpful responses while being mindful of medical ethics and the need for human oversight in medical decisions. If database information is provided above, use it to give specific, data-driven answers.`;
        
        // Generate AI response
        const result = await model.generateContent(medicalContext);
        aiResponseText = result.response.text();
        
        // Cache the response
        setCachedResponse(messageText, aiResponseText);
      }

      const aiMessage = {
        id: `ai_${timestamp + 1}`,
        role: 'assistant',
        content: aiResponseText,
        timestamp: timestamp + 1,
        cached: usedCache
      };

      setMessages(prev => [...prev, aiMessage]);

      // Save to database
      if (user && conversationId) {
        try {
          const messagesRef = ref(database, `conversations/${user.uid}/${conversationId}/messages`);
          
          await push(messagesRef, userMessage);
          await push(messagesRef, aiMessage);

          const title = messageText.length > 50 
            ? messageText.substring(0, 50) + '...' 
            : messageText;

          const metadataUpdate = {
            id: conversationId,
            title: title,
            lastMessage: aiResponseText.substring(0, 100) + (aiResponseText.length > 100 ? '...' : ''),
            lastUpdated: timestamp + 1,
            messageCount: messages.length + 2,
            userId: user.uid,
            createdAt: timestamp
          };

          await set(ref(database, `conversations/${user.uid}/${conversationId}/metadata`), metadataUpdate);
        } catch (dbError) {
          console.error('Error saving to database:', dbError);
        }
      }
      
    } catch (error) {
      console.error('Error generating AI response:', error);
      const errorMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: 'I apologize, but I encountered an error while processing your request. Please check your connection and try again.',
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

  const copyMessageToClipboard = async (content) => {
    try {
      await navigator.clipboard.writeText(content);
    } catch (error) {
      console.error('Failed to copy message:', error);
    }
  };

  const regenerateResponse = async () => {
    if (messages.length < 2) return;
    
    const lastUserMessage = [...messages].reverse().find(msg => msg.role === 'user');
    if (lastUserMessage) {
      const newMessages = messages.filter(msg => 
        !(msg.role === 'assistant' && msg.timestamp > lastUserMessage.timestamp)
      );
      setMessages(newMessages);
      
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
        <Sidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          createNewConversation={createNewConversation}
          user={user}
          userProfile={userProfile}
          conversations={conversations}
          currentConversationId={currentConversationId}
          loadConversationHistory={loadConversationHistory}
          deleteConversation={deleteConversation}
        />

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-gray-50">
          <div className="flex-1 overflow-y-auto p-6">
            {messages.length === 0 ? (
              <WelcomeScreen
                quickPrompts={quickPrompts}
                handleQuickPrompt={handleQuickPrompt}
              />
            ) : (
              <MessageList
                messages={messages}
                isLoading={isLoading}
                isTyping={isTyping}
                copyMessageToClipboard={copyMessageToClipboard}
                messagesEndRef={messagesEndRef}
              />
            )}
          </div>

          <InputArea
            inputMessage={inputMessage}
            setInputMessage={setInputMessage}
            handleSendMessage={handleSendMessage}
            isLoading={isLoading}
            messages={messages}
            regenerateResponse={regenerateResponse}
            textareaRef={textareaRef}
          />
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;