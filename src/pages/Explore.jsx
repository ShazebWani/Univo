import React, { useState, useEffect } from "react";
import { ProductService, UserService } from "@/lib/firebaseServices";
import ProductCard from "../components/ProductCard";
import SearchBar from "../components/SearchBar";
import { useAuth } from "@/contexts/AuthContext";

export default function Explore() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [sellers, setSellers] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    const loadData = async () => {
      try {
        // Check if category is passed from URL params
        const urlParams = new URLSearchParams(window.location.search);
        const categoryFromUrl = urlParams.get('category');
        if (categoryFromUrl) {
          setSelectedCategory(categoryFromUrl);
        }
        
        await loadProducts();
      } catch (error) {
        console.error("Error loading data:", error);
        setLoading(false);
      }
    };
    
    // Only load data if user is available
    if (user) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, selectedCategory]);

  const loadProducts = async () => {
    try {
      // Get current user's school domain for filtering
      const userSchoolDomain = user?.email?.split('@')[1]?.toLowerCase();
      const filter = { 
        status: "available",
        ...(userSchoolDomain && { seller_school_domain: userSchoolDomain })
      };
      
      const productData = await ProductService.list(filter, "-created_date", 100);
      
      const sellerIds = [...new Set(productData.map(p => p.seller_id).filter(id => id))];
      const sellersData = {};
      
      if (sellerIds.length > 0) {
        try {
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
      setProducts(productData);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];

    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    setFilteredProducts(filtered);
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleFilter = (category) => {
    setSelectedCategory(category);
  };



  if (loading) {
    return (
      <div className="p-4 space-y-6">
        <div className="bg-card p-4 rounded-xl shadow-md animate-pulse">
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[...Array(8)].map((_, i) => (
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
    <div className="space-y-6">
      <div className="bg-card p-4 sticky top-16 z-30 shadow-sm">
        <h1 className="text-xl font-bold text-foreground mb-4">Find Your Next Deal</h1>
        <div className="bg-background p-4 rounded-lg">
          <SearchBar 
            onSearch={handleSearch} 
            onFilter={handleFilter}
            initialCategory={selectedCategory}
          />
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {filteredProducts.length} items found
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          {filteredProducts.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              seller={sellers[product.seller_id]}
            />
          ))}
        </div>

        {filteredProducts.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">No items found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}