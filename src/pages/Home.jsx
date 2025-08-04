
import React, { useState, useEffect } from "react";
import { ProductService, UserService } from "@/lib/firebaseServices";
import ProductCard from "../components/ProductCard";
import CategoryGrid from "../components/home/CategoryGrid";
import { Sparkles, TrendingUp, ShoppingCart } from "lucide-react";
import { isRecentlyListed } from "@/utils/dateUtils";
import { useSchoolTheme } from "@/contexts/SchoolThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import bannerImage from "@/assets/banner.jpg";



export default function Home() {
  const { currentTheme } = useSchoolTheme();
  const { user } = useAuth();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);
  const [sellers, setSellers] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      try {
        await runSetup();
      } catch (error) {
        console.error("Error during setup:", error);
      }
    };
    
    // Only load data if user is available
    if (user) {
      checkAuthAndLoadData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const runSetup = async () => {
    setLoading(true);
    try {
      await loadHomeData();
    } catch (error) {
      console.error("Error during setup:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadHomeData = async () => {
    try {
      // Get current user's school domain for filtering
      const userSchoolDomain = user?.email?.split('@')[1]?.toLowerCase();
      const filter = { 
        status: "available",
        ...(userSchoolDomain && { seller_school_domain: userSchoolDomain })
      };
      
      const products = await ProductService.list(filter, "-created_date", 20);

      const sellerIds = [...new Set(products.map(p => p.seller_id).filter(id => id))];
      const sellersData = {};
      
      if (sellerIds.length > 0) {
        try {
          // Fetch sellers one by one
          const sellerPromises = sellerIds.map(id => UserService.get(id));
          const fetchedSellers = await Promise.all(sellerPromises);
          
          fetchedSellers.forEach(seller => {
            if (seller) {
              sellersData[seller.id] = seller;
            }
          });
        } catch (error) {
          console.error(`Error loading sellers:`, error);
        }
      }
      
      setSellers(sellersData);
      
      // Featured products: First 6 products
      setFeaturedProducts(products.slice(0, 6));
      
      // Recently listed: Only products posted within the last week
      const recentlyListedProducts = products.filter(product => 
        isRecentlyListed(product.created_date)
      ).slice(0, 6);
      
      setRecentProducts(recentlyListedProducts);
    } catch (error) {
      console.error("Error loading home data:", error);
    }
  };



  if (loading) {
    return (
      <div className="p-4 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card p-4 rounded-xl shadow-md animate-pulse">
              <div className="aspect-square bg-gray-200 rounded-lg mb-3"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner */}
      <div className="relative overflow-hidden" style={{ backgroundImage: `url(${bannerImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
              <span className="block">Univo</span>
              <span className="block" style={{ color: currentTheme.primaryColor }}>
                Your Campus Marketplace
              </span>
            </h1>
            <p className="mt-6 max-w-lg mx-auto text-xl text-white/90 sm:max-w-3xl">
              Buy and sell with fellow students at {currentTheme.name}. From textbooks to electronics, find what you need or sell what you don't.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5" style={{ color: currentTheme.primaryColor }} />
              <h2 className="text-lg font-semibold text-foreground">Featured Items</h2>
              <div className="flex-1 h-px bg-secondary/20 ml-4"></div>
            </div>
            <div className="flex overflow-x-auto gap-4 pb-4">
              {featuredProducts.map((product) => (
                <div key={product.id} className="w-48 flex-shrink-0">
                  <ProductCard 
                    product={product} 
                    seller={sellers[product.seller_id]}
                  />
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5" style={{ color: currentTheme.primaryColor }} />
              <h2 className="text-lg font-semibold text-foreground">Recently Listed</h2>
              <div className="flex-1 h-px bg-secondary/20 ml-4"></div>
            </div>
            <div className="flex overflow-x-auto gap-4 pb-4">
              {recentProducts.length > 0 ? recentProducts.map((product) => (
                <div key={product.id} className="w-48 flex-shrink-0">
                  <ProductCard 
                    product={product} 
                    seller={sellers[product.seller_id]}
                  />
                </div>
              )) : (
                <div className="text-sm text-gray-500">No recent listings found.</div>
              )}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart className="w-5 h-5" style={{ color: currentTheme.primaryColor }} />
              <h2 className="text-lg font-semibold text-foreground">Categories</h2>
            </div>
            <CategoryGrid />
          </section>
        </div>
      </div>
    </div>
  );
}
