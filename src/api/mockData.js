// Mock data service to replace base44 API calls
import { differenceInDays } from 'date-fns';

// Sample users data
const mockUsers = {
  'user_1': {
    id: 'user_1',
    name: 'Alex Johnson',
    email: 'alex.johnson@university.edu',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    rating: 4.8,
    totalSales: 12
  },
  'user_2': {
    id: 'user_2',
    name: 'Sarah Chen',
    email: 'sarah.chen@university.edu',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
    rating: 4.9,
    totalSales: 8
  },
  'user_3': {
    id: 'user_3',
    name: 'Mike Rodriguez',
    email: 'mike.rodriguez@university.edu',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
    rating: 4.7,
    totalSales: 15
  }
};

// Sample products data
let mockProducts = [
  {
    id: 'prod_1',
    title: "Calculus Textbook - Like New",
    description: "Stewart's Calculus Early Transcendentals, 8th edition. No highlighting.",
    price: 180,
    condition: "like_new",
    category: "textbooks",
    location: "East Campus",
    images: ["https://images.unsplash.com/photo-1544716278-cb5e3f4abd8c?w=400&h=400&fit=crop"],
    seller_id: 'user_1',
    status: "available",
    created_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'prod_2',
    title: "MacBook Air M1 - Excellent",
    description: "13-inch MacBook Air with M1 chip, 8GB RAM, 256GB SSD. With charger.",
    price: 850,
    condition: "like_new",
    category: "electronics",
    location: "West Dorms",
    images: ["https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400&h=400&fit=crop"],
    seller_id: 'user_2',
    status: "available",
    created_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'prod_3',
    title: "Vintage Denim Jacket",
    description: "Classic 90s style denim jacket, size medium. Great condition.",
    price: 45,
    condition: "good",
    category: "clothing",
    location: "Central Campus",
    images: ["https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?w=400&h=400&fit=crop"],
    seller_id: 'user_3',
    status: "available",
    created_date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'prod_4',
    title: "Study Desk with Drawers",
    description: "Solid wood study desk with three drawers. Some minor scratches.",
    price: 120,
    condition: "good",
    category: "furniture",
    location: "North Campus",
    images: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop"],
    seller_id: 'user_1',
    status: "available",
    created_date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'prod_5',
    title: "Sony WH-1000XM4 Headphones",
    description: "Noise-cancelling headphones. Great for studying. Comes with case.",
    price: 220,
    condition: "like_new",
    category: "electronics",
    location: "Library",
    images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop"],
    seller_id: 'user_2',
    status: "available",
    created_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'prod_6',
    title: "Nike Air Force 1 - Size 10",
    description: "Classic white Nike Air Force 1 sneakers. Gently worn.",
    price: 75,
    condition: "good",
    category: "clothing",
    location: "Athletic Center",
    images: ["https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop"],
    seller_id: 'user_3',
    status: "available",
    created_date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'prod_7',
    title: "Physics Textbook - Halliday",
    description: "Fundamentals of Physics by Halliday, Resnick & Walker. 11th edition.",
    price: 95,
    condition: "good",
    category: "textbooks",
    location: "Science Building",
    images: ["https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=400&fit=crop"],
    seller_id: 'user_1',
    status: "available",
    created_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'prod_8',
    title: "Gaming Chair - Ergonomic",
    description: "Black and red gaming chair with lumbar support. Very comfortable.",
    price: 150,
    condition: "like_new",
    category: "furniture",
    location: "Student Housing",
    images: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop"],
    seller_id: 'user_2',
    status: "available",
    created_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'prod_9',
    title: "Winter Coat - North Face",
    description: "Warm winter jacket, size large. Perfect for cold campus walks.",
    price: 80,
    condition: "good",
    category: "clothing",
    location: "Dormitory",
    images: ["https://images.unsplash.com/photo-155102871900167b16eac5?w=400&h=400&fit=crop"],
    seller_id: 'user_3',
    status: "available",
    created_date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'prod_10',
    title: "iPad Pro 11-inch",
    description: "iPad Pro with Apple Pencil included. Great for digital note-taking.",
    price: 650,
    condition: "like_new",
    category: "electronics",
    location: "Library Area",
    images: ["https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=400&fit=crop"],
    seller_id: 'user_1',
    status: "available",
    created_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Mock authentication state
let currentUser = null;
let isAuthenticated = false;

// Mock API functions
export const Product = {
  list: async (filter = null, sort = null, limit = 20) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    let filteredProducts = [...mockProducts];
    
    if (filter) {
      if (filter.status) {
        filteredProducts = filteredProducts.filter(p => p.status === filter.status);
      }
      if (filter.category) {
        filteredProducts = filteredProducts.filter(p => p.category === filter.category);
      }
      if (filter.seller_id) {
        filteredProducts = filteredProducts.filter(p => p.seller_id === filter.seller_id);
      }
    }
    
    if (sort) {
      if (sort === '-created_date') {
        filteredProducts.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
      } else if (sort === 'price') {
        filteredProducts.sort((a, b) => a.price - b.price);
      } else if (sort === '-price') {
        filteredProducts.sort((a, b) => b.price - a.price);
      }
    }
    
    return filteredProducts.slice(0, limit);
  },
  
  filter: async (filter = {}, sort = null, limit = 20) => {
    return Product.list(filter, sort, limit);
  },
  
  get: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return mockProducts.find(p => p.id === id);
  },
  
  create: async (productData) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const newProduct = {
      id: `prod_${Date.now()}`,
      ...productData,
      created_date: new Date().toISOString(),
      status: "available"
    };
    mockProducts.unshift(newProduct);
    return newProduct;
  },
  
  update: async (id, updates) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    const index = mockProducts.findIndex(p => p.id === id);
    if (index !== -1) {
      mockProducts[index] = { ...mockProducts[index], ...updates };
      return mockProducts[index];
    }
    throw new Error('Product not found');
  },
  
  delete: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    const index = mockProducts.findIndex(p => p.id === id);
    if (index !== -1) {
      mockProducts.splice(index, 1);
      return true;
    }
    throw new Error('Product not found');
  }
};

export const User = {
  me: async () => {
    await new Promise(resolve => setTimeout(resolve, 200));
    if (!isAuthenticated) {
      throw new Error('Not authenticated');
    }
    return currentUser;
  },
  
  get: async (id) => {
    await new Promise(resolve => setTimeout(resolve, 100));
    return mockUsers[id] || null;
  },
  
  login: async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Simulate login
    currentUser = {
      id: 'user_1',
      name: 'Alex Johnson',
      email: 'alex.johnson@university.edu',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face'
    };
    isAuthenticated = true;
    return currentUser;
  },
  
  logout: async () => {
    await new Promise(resolve => setTimeout(resolve, 200));
    currentUser = null;
    isAuthenticated = false;
  }
};

export const Message = {
  list: async (filter = null, sort = null, limit = 20) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return [];
  },
  
  create: async (messageData) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      id: `msg_${Date.now()}`,
      ...messageData,
      created_date: new Date().toISOString()
    };
  }
};

// Helper function to check if product is recently listed
export const isRecentlyListed = (productDate) => {
  if (!productDate) return false;
  return differenceInDays(new Date(), new Date(productDate)) <= 7;
};

// Mock integration functions
export const UploadFile = {
  upload: async (file) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Simulate file upload
    return {
      url: `https://images.unsplash.com/photo-${Math.random().toString(36).substring(7)}?w=400&h=400&fit=crop`,
      id: `file_${Date.now()}`,
      filename: file.name
    };
  }
};

export const SendEmail = {
  send: async (to, subject, body) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    // Simulate email sending
    console.log(`Email sent to ${to}: ${subject}`);
    return { success: true, messageId: `msg_${Date.now()}` };
  }
}; 