import React, { useState, useEffect, useRef } from "react";
import { MessageService, ProductService, UserService } from "@/lib/firebaseServices";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, LogIn, MessageCircle, MoreVertical, Pin, Trash2, Tag as TagIcon, PlusCircle, Circle, X, DollarSign, Edit } from "lucide-react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import PaymentWidget from "@/components/PaymentWidget";
import PaymentMessage from "@/components/PaymentMessage";

export default function Messages() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messageContainerRef = useRef(null);
  
  // State for user's custom tags and metadata
  const [customTags, setCustomTags] = useState([]);
  const [conversationMetadata, setConversationMetadata] = useState({});
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [showEditTagDialog, setShowEditTagDialog] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#3B82F6");
  const [editingTag, setEditingTag] = useState(null);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [showPaymentWidget, setShowPaymentWidget] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [conversationsCache, setConversationsCache] = useState(new Map());



  const colorOptions = [
    { name: "Blue", value: "#3B82F6" },
    { name: "Green", value: "#10B981" },
    { name: "Red", value: "#EF4444" },
    { name: "Yellow", value: "#F59E0B" },
    { name: "Purple", value: "#8B5CF6" },
    { name: "Pink", value: "#EC4899" },
  ];

  useEffect(() => {
    const loadUserData = async () => {
      if (user) {
        try {
          // Load conversations and custom tags in parallel
          const [conversationsResult, tagsResult] = await Promise.allSettled([
            loadConversations(user.uid),
            loadCustomTags(user.uid)
          ]);
          
          // Handle any errors individually
          if (conversationsResult.status === 'rejected') {
            console.error("Error loading conversations:", conversationsResult.reason);
          }
          if (tagsResult.status === 'rejected') {
            console.error("Error loading custom tags:", tagsResult.reason);
          }
        } catch (error) {
          console.error("Error loading user data:", error);
        }
      }
      setLoading(false);
    };

    loadUserData();
  }, [user]);

  // Handle navigation state for direct conversation opening
  useEffect(() => {
    if (location.state?.openConversation && user) {
      setActiveConversation(location.state.openConversation);
      loadMessages(location.state.openConversation.id);
      // Clear the state to prevent reopening on refresh
      navigate(location.pathname, { replace: true });
    }
  }, [user, location.state]);

  useEffect(() => {
    if (messageContainerRef.current) {
      setTimeout(() => {
        messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
      }, 100);
    }
  }, [messages]);

  const loadConversations = async (userId) => {
    try {
      setConversationsLoading(true);
      
      // Check cache first
      const cacheKey = `conversations_${userId}`;
      const cached = conversationsCache.get(cacheKey);
      const cacheAge = cached ? Date.now() - cached.timestamp : Infinity;
      
      // Use cache if it's less than 30 seconds old
      if (cached && cacheAge < 30000) {
        setConversations(cached.data);
        setConversationsLoading(false);
        return;
      }
      
      const convos = await MessageService.getConversations(userId);
      
      // Transform Firebase data to component format
      const formattedConversations = convos.map(convo => ({
        id: convo.id,
        productId: convo.product_id,
        productTitle: convo.product?.title || 'Unknown Product',
        productImage: convo.product?.images?.[0] || null,
        product: convo.product, // Include full product data for seller check
        otherUserId: convo.otherUser?.id,
        otherUserName: convo.otherUser?.displayName || 'Unknown User',
        otherUserImage: convo.otherUser?.profile_image || null,
        otherUserProfile: convo.otherUser, // Include full user profile
        lastMessage: convo.last_message || '',
        lastMessageTime: convo.last_message_at?.toDate() || new Date(),
        unreadCount: convo.unread_count?.[userId] || 0,
        isPinned: convo.is_pinned || false
      }));
      
      // Cache the results
      setConversationsCache(prev => new Map(prev).set(cacheKey, {
        data: formattedConversations,
        timestamp: Date.now()
      }));
      
      setConversations(formattedConversations);
    } catch (error) {
      console.error("Error loading conversations:", error);
      // Fallback to empty array on error
      setConversations([]);
    } finally {
      setConversationsLoading(false);
    }
  };

  const loadCustomTags = async (userId) => {
    try {
      const userProfile = await UserService.getProfile(userId);
      setCustomTags(userProfile?.custom_tags || []);
      setConversationMetadata(userProfile?.conversation_metadata || {});
    } catch (error) {
      console.error("Error loading custom tags:", error);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      setMessagesLoading(true);
      const messages = await MessageService.getConversation(conversationId);
      
      // Transform Firebase data to component format
      const formattedMessages = messages.map(msg => ({
        id: msg.id,
        sender_id: msg.sender_id,
        content: msg.content,
        timestamp: msg.created_at?.toDate() || new Date(),
        message_type: msg.message_type, // Preserve message type
        payment_data: msg.payment_data, // Preserve payment data
        system_data: msg.system_data // Preserve system data for termination messages
      }));
      
      setMessages(formattedMessages);
      
      // Mark messages as read
      await MessageService.markAsRead(conversationId, user.uid);
    } catch (error) {
      console.error("Error loading messages:", error);
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending || !activeConversation) return;
    
    // Check if conversation is terminated
    if (isConversationTerminated(activeConversation.id)) {
      alert("Cannot send messages in a terminated conversation.");
      return;
    }
    
    setSending(true);
    try {
      const messageData = {
        conversation_id: activeConversation.id,
        sender_id: user.uid,
        receiver_id: activeConversation.otherUserId,
        content: newMessage.trim(),
        message_type: 'text'
      };
      
      // Send message to Firebase
      const sentMessage = await MessageService.send(messageData);
      
      // Update local messages immediately
      const formattedMessage = {
        id: sentMessage.id,
        sender_id: user.uid,
        content: newMessage.trim(),
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, formattedMessage]);
      setNewMessage("");
      
      // Update conversation with last message
      await MessageService.updateConversation(activeConversation.id, {
        last_message: newMessage.trim(),
        last_message_type: 'text',
        [`unread_count.${activeConversation.otherUserId}`]: (activeConversation.unreadCount || 0) + 1
      });
      
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  const openConversation = async (conversation) => {
    setActiveConversation(conversation);
    await loadMessages(conversation.id);
  };

  const handleBackToConversations = () => {
    setActiveConversation(null);
    setMessages([]);
  };

  const handleLogin = () => {
    navigate('/login');
  };
  
  const getTagColor = (tagName) => {
    const tag = customTags.find(t => t.name === tagName);
    return tag ? tag.color : null;
  };

  const isConversationTerminated = (conversationId) => {
    const metadata = conversationMetadata[conversationId];
    return metadata?.isTerminated === true;
  };

  const handleLongPress = (conversation, event) => {
    // Remove preventDefault to avoid passive event listener error
    setSelectedConversation(conversation);
    setLongPressTimer(setTimeout(() => {
      // Show context menu or tag options
    }, 500));
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const addCustomTag = async () => {
    if (!newTagName.trim() || customTags.length >= 3) return;
    
    const newTag = {
      id: `tag_${Date.now()}`,
      name: newTagName.trim(),
      color: newTagColor
    };
    
    const updatedTags = [...customTags, newTag];
    setCustomTags(updatedTags);
    
    // Save to Firebase
    try {
      await UserService.updateProfile(user.uid, { custom_tags: updatedTags });
    } catch (error) {
      console.error("Error saving custom tag:", error);
    }
    
    setNewTagName("");
    setNewTagColor("#3B82F6");
    setShowTagDialog(false);
  };

  const editCustomTag = async () => {
    if (!editingTag || !editingTag.name.trim()) return;
    
    const updatedTags = customTags.map(tag => 
      tag.id === editingTag.id 
        ? { ...tag, name: editingTag.name.trim(), color: editingTag.color }
        : tag
    );
    
    setCustomTags(updatedTags);
    
    // Save to Firebase
    try {
      await UserService.updateProfile(user.uid, { custom_tags: updatedTags });
    } catch (error) {
      console.error("Error updating custom tag:", error);
    }
    
    setEditingTag(null);
    setShowEditTagDialog(false);
  };

  const deleteCustomTag = async (tagId) => {
    const updatedTags = customTags.filter(tag => tag.id !== tagId);
    setCustomTags(updatedTags);
    
    // Remove tag from all conversations that use it
    const updatedMetadata = { ...conversationMetadata };
    Object.keys(updatedMetadata).forEach(conversationId => {
      if (updatedMetadata[conversationId]?.tagId === tagId) {
        delete updatedMetadata[conversationId].tagId;
      }
    });
    setConversationMetadata(updatedMetadata);
    
    // Save to Firebase
    try {
      await UserService.updateProfile(user.uid, { 
        custom_tags: updatedTags,
        conversation_metadata: updatedMetadata
      });
    } catch (error) {
      console.error("Error deleting custom tag:", error);
    }
  };

  const applyTagToConversation = async (conversationId, tagId) => {
    const updatedMetadata = {
      ...conversationMetadata,
      [conversationId]: {
        ...conversationMetadata[conversationId],
        tagId: tagId || null
      }
    };
    
    // If tagId is null, remove the tagId property entirely
    if (!tagId) {
      delete updatedMetadata[conversationId].tagId;
    }
    
    setConversationMetadata(updatedMetadata);
    
    try {
      await UserService.updateProfile(user.uid, { conversation_metadata: updatedMetadata });
    } catch (error) {
      console.error("Error applying tag:", error);
    }
  };

  const togglePinConversation = async (conversationId) => {
    const updatedMetadata = {
      ...conversationMetadata,
      [conversationId]: {
        ...conversationMetadata[conversationId],
        isPinned: !conversationMetadata[conversationId]?.isPinned
      }
    };
    
    setConversationMetadata(updatedMetadata);
    
    try {
      await UserService.updateProfile(user.uid, { conversation_metadata: updatedMetadata });
    } catch (error) {
      console.error("Error toggling pin:", error);
    }
  };

  const deleteConversation = async (conversationId) => {
    const updatedMetadata = {
      ...conversationMetadata,
      [conversationId]: {
        ...conversationMetadata[conversationId],
        isDeleted: true,
        deletedAt: new Date().toISOString()
      }
    };
    
    setConversationMetadata(updatedMetadata);
    
    try {
      await UserService.updateProfile(user.uid, { conversation_metadata: updatedMetadata });
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  };

  const terminateConversation = async (conversationId) => {
    try {
      // Check if conversation is already terminated
      if (isConversationTerminated(conversationId)) {
        alert("This conversation is already terminated.");
        return;
      }

      // Find the conversation to get the other user ID
      const conversation = conversations.find(c => c.id === conversationId);
      if (!conversation) return;

      // Send termination message to notify the other user
      const terminationMessageData = {
        conversation_id: conversationId,
        sender_id: user.uid,
        receiver_id: conversation.otherUserId,
        content: `This conversation was terminated by ${user.displayName || user.email}`,
        message_type: 'system_terminated',
        system_data: {
          terminatedBy: user.displayName || user.email,
          timestamp: new Date().toISOString()
        }
      };
      
      await MessageService.send(terminationMessageData);
      
      // Mark as terminated in metadata
      const updatedMetadata = {
        ...conversationMetadata,
        [conversationId]: {
          ...conversationMetadata[conversationId],
          isTerminated: true,
          terminatedAt: new Date().toISOString(),
          terminatedBy: user.uid
        }
      };
      
      setConversationMetadata(updatedMetadata);
      await UserService.updateProfile(user.uid, { conversation_metadata: updatedMetadata });
    } catch (error) {
      console.error("Error terminating conversation:", error);
    }
  };

  const handlePaymentRequest = async (paymentData) => {
    try {
      // Check if there's already an active payment request in this conversation
      const hasActivePayment = messages.some(msg => 
        msg.message_type === 'payment_request' && 
        msg.payment_data?.status !== 'failed' && 
        msg.payment_data?.status !== 'verified'
      );

      if (hasActivePayment) {
        alert('There is already an active payment request in this conversation. Please complete or cancel the existing payment first.');
        return;
      }

      // Send payment request as a special message type
      const paymentMessageData = {
        conversation_id: activeConversation.id,
        sender_id: user.uid,
        receiver_id: activeConversation.otherUserId,
        content: `Payment request for $${paymentData.amount}`,
        message_type: 'payment_request',
        payment_data: paymentData
      };

      const sentMessage = await MessageService.send(paymentMessageData);
      
      // Add to local messages
      const formattedMessage = {
        id: sentMessage.id,
        sender_id: user.uid,
        content: paymentMessageData.content,
        message_type: 'payment_request',
        payment_data: paymentData,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, formattedMessage]);
      setShowPaymentWidget(false);

      // Update conversation with payment request as last message
      await MessageService.updateConversation(activeConversation.id, {
        last_message: `💳 Payment request: $${paymentData.amount}`,
        last_message_type: 'payment_request',
        [`unread_count.${activeConversation.otherUserId}`]: (activeConversation.unreadCount || 0) + 1
      });
      
    } catch (error) {
      console.error("Error sending payment request:", error);
    }
  };

  const handlePaymentComplete = async (paymentData) => {
    try {
      // Filter out undefined values to avoid Firebase errors
      const cleanPaymentData = Object.fromEntries(
        Object.entries(paymentData).filter(([_, value]) => value !== undefined)
      );

      // Send payment completion message
      const completionMessageData = {
        conversation_id: activeConversation.id,
        sender_id: user.uid,
        receiver_id: activeConversation.otherUserId,
        content: `Payment completed for $${paymentData.amount}`,
        message_type: 'payment_completed',
        payment_data: cleanPaymentData
      };

      await MessageService.send(completionMessageData);

      // Update conversation with payment completion as last message
      const lastMessageText = paymentData.status === 'verified' 
        ? `✅ Transaction completed: $${paymentData.amount}`
        : `💳 Payment completed: $${paymentData.amount}`;
        
      await MessageService.updateConversation(activeConversation.id, {
        last_message: lastMessageText,
        last_message_type: 'payment_completed',
        [`unread_count.${activeConversation.otherUserId}`]: (activeConversation.unreadCount || 0) + 1
      });
    } catch (error) {
      console.error("Error sending payment completion:", error);
    }
  };

  const openPaymentWidget = async () => {
    // Open modal immediately
    setShowPaymentWidget(true);
    
    // Set product data
    if (activeConversation?.product) {
      setCurrentProduct(activeConversation.product);
    } else if (activeConversation?.productId) {
      try {
        const product = await ProductService.get(activeConversation.productId);
        setCurrentProduct(product);
      } catch (error) {
        console.error("Error loading product:", error);
        setCurrentProduct({ title: 'Unknown Product', id: activeConversation.productId });
      }
    } else {
      setCurrentProduct({ title: 'Product', id: 'unknown' });
    }
  };



  const formatTime = (timestamp) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInHours = (now - messageTime) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return `${Math.floor(diffInHours * 60)}m`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h`;
    } else {
      return messageTime.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 bg-card rounded-lg animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <div className="max-w-md w-full space-y-8">
          <div>
            <MessageCircle className="w-16 h-16 text-primary mx-auto mb-6"/>
            <h1 className="text-3xl font-bold text-foreground mb-2">Your Messages</h1>
            <p className="text-gray-600 mb-8">Sign in to see your conversations with buyers and sellers.</p>
          </div>
          <Button onClick={handleLogin} className="w-full bg-primary hover:bg-primary/90 text-white py-3 text-lg">
            <LogIn className="w-5 h-5 mr-2" />
            Sign In to View Messages
          </Button>
        </div>
      </div>
    );
  }

  if (activeConversation) {
    return (
      <div className="fixed inset-0 bg-background z-[60] flex flex-col">
        <div className="flex-shrink-0 bg-card z-10 p-4 border-b border-border shadow-sm">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleBackToConversations} className="bg-gray-100 hover:bg-gray-200 rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <Link to={createPageUrl(`UserProfile?id=${activeConversation.otherUserId}`)} className="font-semibold text-foreground hover:text-primary">
                {activeConversation.otherUserName}
              </Link>
              <Link to={createPageUrl(`ProductDetail?id=${activeConversation.productId}`)} className="text-sm text-gray-500 block hover:text-primary">
                {activeConversation.productTitle}
              </Link>
            </div>
          </div>
        </div>

        <div ref={messageContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          <p className="text-gray-500 text-sm mb-4">You're chatting about "{activeConversation.productTitle}"</p>
          
          {messagesLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-xs px-4 py-3 rounded-2xl shadow-sm animate-pulse ${
                    i % 2 === 0 ? 'bg-gray-200' : 'bg-gray-300'
                  }`}>
                    <div className="h-4 bg-gray-300 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
          messages.map((message) => {
            // Handle system messages differently
            if (message.message_type === 'system_terminated') {
              return (
                <div key={message.id} className="flex justify-center">
                  <div className="bg-red-50 border border-red-200 px-4 py-2 rounded-lg max-w-sm">
                    <p className="text-sm text-red-800 text-center">{message.content}</p>
                    <p className="text-xs text-red-600 text-center mt-1">
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              );
            }

             // Handle payment messages
             if (message.message_type === 'payment_request' || message.message_type === 'payment_completed') {
               return (
                 <div key={message.id} className="flex justify-center">
                   <div className="max-w-sm">
                     <PaymentMessage
                       paymentData={message.payment_data}
                       isCurrentUser={message.sender_id === user.uid}
                       currentUserId={user.uid}
                       onPaymentComplete={handlePaymentComplete}
                       buyerProfile={activeConversation?.otherUserProfile}
                     />
                     <p className="text-xs text-gray-500 text-center mt-2">
                       {formatTime(message.timestamp)}
                     </p>
                   </div>
                 </div>
               );
             }
            
            // Regular messages
            return (
              <div key={message.id} className={`flex ${message.sender_id === user.uid ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs px-4 py-3 rounded-2xl shadow-sm ${message.sender_id === user.uid ? 'bg-primary text-white' : 'bg-card text-foreground border border-border'}`}>
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-2 ${message.sender_id === user.uid ? 'text-white/70' : 'text-gray-500'}`}>
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            );
          }))}
        </div>

        <div className="flex-shrink-0 p-4 border-t border-border bg-card">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={isConversationTerminated(activeConversation?.id) ? "This conversation has been terminated" : "Type a message..."}
              className="flex-1"
              disabled={isConversationTerminated(activeConversation?.id)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
                         {/* Payment button - only show for sellers and if not terminated */}
             {activeConversation && activeConversation.product && user.uid === activeConversation.product.seller_id && !isConversationTerminated(activeConversation.id) && (
               <Button 
                 onClick={openPaymentWidget}
                 variant="outline"
                 size="icon"
                 className="text-green-600 hover:text-green-700 hover:bg-green-50"
                 title="Send Payment Request"
               >
                 <DollarSign className="w-4 h-4" />
               </Button>
             )}
            
            <Button 
              onClick={sendMessage} 
              disabled={sending || !newMessage.trim() || isConversationTerminated(activeConversation?.id)} 
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Payment Widget Modal */}
        {showPaymentWidget && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/50" 
              onClick={() => setShowPaymentWidget(false)}
            />
            
            {/* Modal Content */}
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 z-[10000]">
              {/* Header */}
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Send Payment Request</h2>
                <p className="text-sm text-gray-600">Create a secure payment request for this transaction.</p>
              </div>
              
              {/* Close Button */}
              <button 
                onClick={() => setShowPaymentWidget(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
              
              {/* Content */}
              {currentProduct ? (
                <PaymentWidget
                  product={currentProduct}
                  sellerId={user.uid}
                  buyerId={activeConversation?.otherUserId}
                  onPaymentSent={handlePaymentRequest}
                  isDigital={currentProduct.category === 'digital'}
                />
              ) : (
                <div className="flex items-center justify-center p-8">
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">Loading product details...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}


      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Messages</h1>
        <Dialog open={showTagDialog} onOpenChange={setShowTagDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" disabled={customTags.length >= 3}>
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Tag ({customTags.length}/3)
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Custom Tag</DialogTitle>
              <DialogDescription>
                Create a color-coded tag to organize your conversations.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="tagName">Tag Name</Label>
                <Input
                  id="tagName"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="e.g., Interested Seller"
                  maxLength={20}
                />
              </div>
              <div>
                <Label>Color</Label>
                <div className="flex gap-2 mt-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setNewTagColor(color.value)}
                      className={`w-8 h-8 rounded-full border-2 ${newTagColor === color.value ? 'border-gray-800' : 'border-gray-300'}`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTagDialog(false)}>
                Cancel
              </Button>
              <Button onClick={addCustomTag} disabled={!newTagName.trim()}>
                Create Tag
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Tag Dialog */}
        <Dialog open={showEditTagDialog} onOpenChange={setShowEditTagDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Custom Tag</DialogTitle>
              <DialogDescription>
                Update your custom tag name and color.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="editTagName">Tag Name</Label>
                <Input
                  id="editTagName"
                  value={editingTag?.name || ""}
                  onChange={(e) => setEditingTag(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Interested Seller"
                  maxLength={20}
                />
              </div>
              <div>
                <Label>Color</Label>
                <div className="flex gap-2 mt-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setEditingTag(prev => ({ ...prev, color: color.value }))}
                      className={`w-8 h-8 rounded-full border-2 ${editingTag?.color === color.value ? 'border-gray-800' : 'border-gray-300'}`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete the tag "${editingTag?.name}"? This will remove it from all conversations.`)) {
                    deleteCustomTag(editingTag?.id);
                    setShowEditTagDialog(false);
                  }
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Tag
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowEditTagDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={editCustomTag} disabled={!editingTag?.name?.trim()}>
                  Update Tag
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {customTags.length > 0 && (
        <div className="flex gap-2 mb-4">
          {customTags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center gap-1 px-3 py-1 rounded-full text-sm text-white cursor-pointer hover:opacity-80 transition-opacity"
              style={{ backgroundColor: tag.color }}
              onClick={() => {
                setEditingTag(tag);
                setShowEditTagDialog(true);
              }}
            >
              <Circle className="w-3 h-3 fill-current" />
              {tag.name}
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {conversationsLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center p-4 bg-card rounded-lg border border-border animate-pulse">
                <div className="w-12 h-12 rounded-full bg-gray-200 mr-4"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
            <p className="text-gray-500">Start a conversation by messaging someone about their listing!</p>
          </div>
        ) : (
          conversations
            .filter(conversation => !conversationMetadata[conversation.id]?.isDeleted)
            .sort((a, b) => {
              // Pin priority: pinned conversations first
              const aPinned = conversationMetadata[a.id]?.isPinned || false;
              const bPinned = conversationMetadata[b.id]?.isPinned || false;
              if (aPinned && !bPinned) return -1;
              if (!aPinned && bPinned) return 1;
              // Then sort by last message time
              return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
            })
            .map((conversation) => {
            const conversationTag = conversationMetadata[conversation.id]?.tagId;
            const tag = conversationTag ? customTags.find(t => t.id === conversationTag) : null;
            const isPinned = conversationMetadata[conversation.id]?.isPinned || false;
            const isTerminated = isConversationTerminated(conversation.id);
            
            return (
              <div
                key={conversation.id}
                className={`flex items-center p-4 bg-card rounded-lg border border-border hover:bg-gray-50 cursor-pointer transition-colors relative group ${
                  isTerminated ? 'opacity-60 bg-gray-50' : ''
                }`}
                onClick={() => openConversation(conversation)}
                onTouchStart={(e) => handleLongPress(conversation, e)}
                onTouchEnd={handleTouchEnd}
                onMouseDown={(e) => handleLongPress(conversation, e)}
                onMouseUp={handleTouchEnd}
              >
                {isPinned && (
                  <Pin className="w-4 h-4 text-primary absolute top-2 right-2" />
                )}
                
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mr-4 overflow-hidden">
                  {conversation.otherUserImage ? (
                    <img src={conversation.otherUserImage} alt={conversation.otherUserName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-medium text-gray-600">{conversation.otherUserName?.charAt(0) || 'U'}</span>
                  )}
                  </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-semibold truncate ${isTerminated ? 'text-gray-500' : 'text-foreground'}`}>
                        {conversation.otherUserName}
                      </h3>
                      {isTerminated && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                          Terminated
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {tag && (
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: tag.color }}
                          title={tag.name}
                        />
                      )}
                      <span className="text-xs text-gray-500">{formatTime(conversation.lastMessageTime)}</span>
                    </div>
                  </div>
                  <p className={`text-sm truncate font-medium ${isTerminated ? 'text-gray-400' : 'text-primary'}`}>
                    {conversation.productTitle}
                  </p>
                  <p className={`text-sm truncate ${isTerminated ? 'text-gray-400' : 'text-gray-600'}`}>
                    {conversation.lastMessage}
                  </p>
                </div>
                
                {conversation.unreadCount > 0 && (
                  <div className="w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center ml-2">
                    {conversation.unreadCount}
                  </div>
                )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-2 opacity-60 hover:opacity-100 active:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      togglePinConversation(conversation.id);
                    }}>
                      <Pin className="w-4 h-4 mr-2" />
                      {conversationMetadata[conversation.id]?.isPinned ? 'Unpin' : 'Pin'} Conversation
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                    {conversationTag ? (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          applyTagToConversation(conversation.id, null);
                        }}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Remove Tag
                      </DropdownMenuItem>
                    ) : (
                      customTags.map((tag) => (
                        <DropdownMenuItem
                          key={tag.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            applyTagToConversation(conversation.id, tag.id);
                          }}
                        >
                          <div
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: tag.color }}
                          />
                          Tag as {tag.name}
                        </DropdownMenuItem>
                      ))
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-orange-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conversation.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Conversation
                        </DropdownMenuItem>
                    {!isConversationTerminated(conversation.id) && (
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Are you sure you want to terminate this conversation? The other user will be notified and this action cannot be undone.')) {
                            terminateConversation(conversation.id);
                          }
                        }}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Terminate Conversation
                          </DropdownMenuItem>
                    )}
                      </DropdownMenuContent>
                    </DropdownMenu>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}