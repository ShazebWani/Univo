import { useState, useEffect } from 'react';
import { MessageService } from '@/lib/firebaseServices';
import { useAuth } from '@/contexts/AuthContext';

export const useUnreadMessages = () => {
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setTotalUnreadCount(0);
      return;
    }

    const loadUnreadCount = async () => {
      try {
        const conversations = await MessageService.getConversations(user.uid);
        const total = conversations.reduce((sum, convo) => {
          return sum + (convo.unread_count?.[user.uid] || 0);
        }, 0);
        setTotalUnreadCount(total);
      } catch (error) {
        console.error('Error loading unread count:', error);
        setTotalUnreadCount(0);
      }
    };

    loadUnreadCount();

    // Refresh unread count every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);

    return () => clearInterval(interval);
  }, [user]);

  return { totalUnreadCount };
};