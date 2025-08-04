import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserService, ProductService } from "@/lib/firebaseServices";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Star, MapPin, ShoppingBag } from "lucide-react";
import ProductCard from "../components/ProductCard";
import { useAuth } from "@/contexts/AuthContext";

export default function UserProfile() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState(null);
  const [userProducts, setUserProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadProfile();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const loadProfile = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const userId = urlParams.get('id');

      if (!userId) {
        navigate(createPageUrl("Home"));
        return;
      }

      // Get the profile user's data
      const userData = await UserService.get(userId);
      
      // Check if the profile user is from the same school as current user
      const currentUserSchoolDomain = currentUser?.email?.split('@')[1]?.toLowerCase();
      const profileUserSchoolDomain = userData?.schoolDomain || userData?.email?.split('@')[1]?.toLowerCase();
      
      if (currentUserSchoolDomain && profileUserSchoolDomain && currentUserSchoolDomain !== profileUserSchoolDomain) {
        // User is from a different school, redirect or show not found
        navigate(createPageUrl("Home"));
        return;
      }
      
      setUser(userData);
      
      // Only show available products for public profiles, filtered by school
      const filter = { 
        seller_id: userId, 
        status: "available",
        ...(currentUserSchoolDomain && { seller_school_domain: currentUserSchoolDomain })
      };
      const products = await ProductService.list(filter, "-created_date");
      setUserProducts(products);
    } catch (error) {
      console.error("Error loading user profile:", error);
      navigate(createPageUrl("Home"));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-6">
        <div className="neumorphic-card p-6 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-6 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500">User not found.</p>
        <Button onClick={() => navigate(createPageUrl("Home"))} className="mt-4">Go Home</Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
       <div className="flex items-center gap-4 sticky top-16 bg-background z-10 py-2 -mx-4 px-4 border-b">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="neumorphic-button"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">
            Seller Profile
          </h1>
        </div>
      
      {/* Profile Header */}
      <div className="neumorphic-card p-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
            {user.profile_image ? (
                <img src={user.profile_image} alt={user.full_name} className="w-full h-full object-cover" />
            ) : (
                <span className="text-2xl font-bold">{user.full_name?.charAt(0) || 'U'}</span>
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {user.full_name || 'Anonymous User'}
            </h1>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span>{user.rating?.toFixed(1) || '5.0'}</span>
              <span>•</span>
              <ShoppingBag className="w-4 h-4"/>
              <span>{user.total_sales || 0} sales</span>
            </div>
            {user.university && (
              <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                <MapPin className="w-3 h-3" />
                <span>{user.university}</span>
                {user.year && <span>• {user.year}</span>}
              </div>
            )}
          </div>
        </div>
        {user.bio && (
            <p className="text-gray-700 mt-4 pt-4 border-t">{user.bio}</p>
        )}
      </div>

      {/* User's Listings */}
      <div>
        <h2 className="text-lg font-semibold mb-4">{user.full_name}'s Listings ({userProducts.length})</h2>
        <div className="grid grid-cols-2 gap-4">
          {userProducts.map((product) => (
            <ProductCard key={product.id} product={product} seller={user} />
          ))}
        </div>
        {userProducts.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">This user has no active listings.</p>
          </div>
        )}
      </div>
    </div>
  );
}