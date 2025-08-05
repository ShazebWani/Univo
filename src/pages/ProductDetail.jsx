
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ProductService, UserService, MessageService } from "@/lib/firebaseServices";
import { useAuth } from "@/contexts/AuthContext";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, MessageCircle, Share2 } from "lucide-react";

export default function ProductDetail() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    loadProductDetails();
  }, []);

  const loadProductDetails = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const productId = urlParams.get('id');
      
      if (!productId) {
        navigate(createPageUrl("Explore"));
        return;
      }

      const productData = await ProductService.get(productId);
      const sellerData = await UserService.get(productData.seller_id);
      
      console.log('ProductDetail - Seller data received:', sellerData);
      
      setProduct(productData);
      setSeller(sellerData);
    } catch (error) {
      console.error("Error loading product details:", error);
      navigate(createPageUrl("Explore"));
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const handleMessageSeller = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.uid === seller?.id) {
      alert("You cannot message yourself!");
      return;
    }

    try {
      // Create or get conversation
      const conversation = await MessageService.createOrGetConversation(
        product.id,
        user.uid,
        seller.id
      );
      
      // Navigate to messages with the conversation
      navigate('/messages', { 
        state: { 
          openConversation: {
            id: conversation.id,
            productId: product.id,
            productTitle: product.title,
            otherUserId: seller.id,
            otherUserName: seller.displayName || seller.full_name
          }
        }
      });
    } catch (error) {
      console.error("Error creating conversation:", error);
      alert("Failed to start conversation. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-6">
        <div className="bg-card p-4 rounded-xl shadow-md animate-pulse">
          <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
          <div className="space-y-2">
            <div className="h-6 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500">Product not found.</p>
      </div>
    );
  }

  return (
    <div className="pb-24"> {/* Added padding to prevent action bar from hiding content */}
      {/* Header is in Layout */}

      <div className="p-4 space-y-6">
        {/* Images */}
        <div className="bg-card p-4 rounded-xl shadow-md">
          <div className="aspect-square mb-4 rounded-lg overflow-hidden bg-gray-100">
            {product.images && product.images.length > 0 ? (
              <img 
                src={product.images[currentImageIndex]} 
                alt={product.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <span>No image available</span>
              </div>
            )}
          </div>
          
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 ${
                    index === currentImageIndex ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <img 
                    src={image} 
                    alt={`${product.title} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="bg-card p-6 rounded-xl shadow-md space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-foreground mb-2">
                {product.title}
              </h2>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl font-bold text-primary">
                  {formatPrice(product.price)}
                </span>
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {product.condition}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{product.location}</span>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-gray-700 leading-relaxed">
              {product.description}
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="bg-gray-100 px-2 py-1 rounded-full">
              {product.category}
            </span>
          </div>
        </div>

        {/* Seller Info */}
        {seller && (
          <div className="bg-card p-6 rounded-xl shadow-md">
            <h3 className="font-semibold mb-4">Seller Information</h3>
            <Link to={createPageUrl(`UserProfile?id=${seller.id}`)} className="block">
                <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                    {seller.profile_image ? (
                        <img src={seller.profile_image} alt={seller.displayName || seller.full_name} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-lg font-medium">
                        {(seller.displayName || seller.full_name)?.charAt(0) || 'U'}
                        </span>
                    )}
                </div>
                <div className="flex-1">
                    <p className="font-medium text-foreground hover:underline">
                    {seller.displayName || seller.full_name || 'Anonymous'}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>{seller.actual_sales || seller.total_sales || 0} sales</span>
                    </div>
                    {(seller.school || seller.university) && (
                    <p className="text-sm text-gray-500">{seller.school || seller.university}</p>
                    )}
                </div>
                </div>
            </Link>
          </div>
        )}

        {/* Action Buttons - Only show for non-sellers */}
        {user && product && user.uid !== product.seller_id && (
          <div className="fixed bottom-16 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t border-border z-40">
            <Button
              onClick={handleMessageSeller}
              className="w-full bg-primary hover:bg-primary/90 text-white"
              size="lg"
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Message Seller
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
