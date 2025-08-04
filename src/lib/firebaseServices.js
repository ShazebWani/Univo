import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  setDoc,
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';

// Utility function to handle Firebase offline errors gracefully
const handleFirebaseError = (error, operation = 'operation') => {
  console.error(`Firebase ${operation} error:`, error);
  
  if (error.code === 'unavailable' || error.message.includes('offline')) {
    console.log(`Firebase is offline during ${operation}, returning fallback`);
    return { isOffline: true, error };
  }
  
  throw new Error(`${operation} failed: ${error.message}`);
};

// Product services
export const ProductService = {

  // Get all products with optional filtering and sorting
  list: async (filter = null, sort = null, limitCount = 20) => {
    try {
      let q = collection(db, 'products');
      
      // Apply filters
      if (filter) {
        if (filter.status) {
          q = query(q, where('status', '==', filter.status));
        }
        if (filter.category) {
          q = query(q, where('category', '==', filter.category));
        }
        if (filter.seller_id) {
          q = query(q, where('seller_id', '==', filter.seller_id));
        }
        if (filter.seller_school_domain) {
          q = query(q, where('seller_school_domain', '==', filter.seller_school_domain));
        }
      }
      
      // Apply sorting
      if (sort) {
        if (sort === '-created_date') {
          q = query(q, orderBy('created_date', 'desc'));
        } else if (sort === 'price') {
          q = query(q, orderBy('price', 'asc'));
        } else if (sort === '-price') {
          q = query(q, orderBy('price', 'desc'));
        }
      }
      
      // Apply limit
      q = query(q, limit(limitCount));
      
      const querySnapshot = await getDocs(q);
      const products = [];
      querySnapshot.forEach((doc) => {
        products.push({ id: doc.id, ...doc.data() });
      });
      
      return products;
    } catch (error) {
      const result = handleFirebaseError(error, 'product list');
      if (result.isOffline) {
        // Return empty array when offline instead of crashing
        return [];
      }
      // Re-throw if not an offline error
      throw result;
    }
  },
  
  // Get a single product by ID
  get: async (id) => {
    try {
      const docRef = doc(db, 'products', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        throw new Error('Product not found');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  },
  
  // Create a new product
  create: async (productData) => {
    try {
      const docRef = await addDoc(collection(db, 'products'), {
        ...productData,
        created_date: serverTimestamp(),
        status: 'available'
      });
      
      return { id: docRef.id, ...productData };
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },
  
  // Update a product
  update: async (id, updates) => {
    try {
      const docRef = doc(db, 'products', id);
      await updateDoc(docRef, updates);
      
      const updatedDoc = await getDoc(docRef);
      return { id: updatedDoc.id, ...updatedDoc.data() };
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },
  
  // Delete a product
  delete: async (id) => {
    try {
      const docRef = doc(db, 'products', id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }
};

// User services
export const UserService = {
  // Create user profile (called during signup)
  create: async (userId, profileData) => {
    try {
      const docRef = doc(db, 'users', userId);
      const userData = {
        ...profileData,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      };
      
      await setDoc(docRef, userData);
      return { id: userId, ...userData };
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  },

  // Get current user profile with offline support
  getProfile: async (userId) => {
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        // Return null instead of throwing error for missing users
        return null;
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      
      // Handle offline errors gracefully
      if (error.code === 'unavailable' || error.message.includes('offline')) {
        console.log('Firebase is offline, returning null for user profile');
        return null; // Return null when offline instead of throwing
      }
      
      // For other errors, still throw but with better messaging
      throw new Error(`Failed to load user profile: ${error.message}`);
    }
  },
  
  // Create or update user profile
  updateProfile: async (userId, profileData) => {
    try {
      const docRef = doc(db, 'users', userId);
      await updateDoc(docRef, {
        ...profileData,
        updated_at: serverTimestamp()
      });
      
      return { id: userId, ...profileData };
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },
  
  // Get user by ID
  get: async (userId) => {
    try {
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }
};

// Message services
export const MessageService = {
  // Get messages for a conversation
  getConversation: async (conversationId) => {
    try {
      const q = query(
        collection(db, 'messages'),
        where('conversation_id', '==', conversationId),
        orderBy('created_at', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const messages = [];
      querySnapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() });
      });
      
      return messages;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },
  
  // Send a message
  send: async (messageData) => {
    try {
      const docRef = await addDoc(collection(db, 'messages'), {
        ...messageData,
        created_at: serverTimestamp()
      });
      
      return { id: docRef.id, ...messageData };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },
  
  // Get user conversations with enhanced data
  getConversations: async (userId) => {
    try {
      const q = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', userId),
        orderBy('last_message_at', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const conversations = [];
      
      for (const docSnap of querySnapshot.docs) {
        const conversationData = { id: docSnap.id, ...docSnap.data() };
        
        // Get the other participant's info
        const otherUserId = conversationData.participants.find(id => id !== userId);
        if (otherUserId) {
          try {
            const otherUser = await UserService.get(otherUserId);
            conversationData.otherUser = otherUser;
          } catch (error) {
            console.error('Error fetching other user:', error);
            conversationData.otherUser = { displayName: 'Unknown User' };
          }
        }
        
        // Get product info if available
        if (conversationData.product_id) {
          try {
            const product = await ProductService.get(conversationData.product_id);
            conversationData.product = product;
          } catch (error) {
            console.error('Error fetching product:', error);
            conversationData.product = { title: 'Unknown Product' };
          }
        }
        
        conversations.push(conversationData);
      }
      
      return conversations;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  },
  
  // Create or get conversation between two users for a product
  createOrGetConversation: async (productId, buyerId, sellerId) => {
    try {
      const participants = [buyerId, sellerId].sort();
      const conversationId = `${productId}_${participants.join('_')}`;
      
      // Check if conversation exists
      const docRef = doc(db, 'conversations', conversationId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      
      // Create new conversation
      const conversationData = {
        id: conversationId,
        product_id: productId,
        participants: participants,
        created_at: serverTimestamp(),
        last_message_at: serverTimestamp(),
        last_message: '',
        unread_count: { [buyerId]: 0, [sellerId]: 0 }
      };
      
      await setDoc(docRef, conversationData);
      return conversationData;
    } catch (error) {
      console.error('Error creating/getting conversation:', error);
      throw error;
    }
  },
  
  // Update conversation metadata (last message, timestamp, etc.)
  updateConversation: async (conversationId, updateData) => {
    try {
      const docRef = doc(db, 'conversations', conversationId);
      await updateDoc(docRef, {
        ...updateData,
        last_message_at: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating conversation:', error);
      throw error;
    }
  },
  
  // Mark messages as read
  markAsRead: async (conversationId, userId) => {
    try {
      const docRef = doc(db, 'conversations', conversationId);
      await updateDoc(docRef, {
        [`unread_count.${userId}`]: 0
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  }
};

// File upload service
export const FileUploadService = {
  upload: async (file) => {
    try {
      // Create a unique filename
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const filename = `products/${timestamp}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
      
      // Create a storage reference
      const storageRef = ref(storage, filename);
      
      // Upload the file
      const snapshot = await uploadBytes(storageRef, file);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return {
        url: downloadURL,
        file_url: downloadURL, // For compatibility with existing code
        id: `file_${timestamp}`,
        filename: file.name,
        path: filename
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }
}; 