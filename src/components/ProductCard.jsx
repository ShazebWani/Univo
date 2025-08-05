
import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MapPin } from "lucide-react";

export default function ProductCard({ product, seller }) {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  };

  // Function to check if product is high value (expensive electronics or premium items)
  const isHighValue = () => {
    const highValueKeywords = ['macbook', 'iphone', 'ipad', 'sony', 'bose', 'nintendo', 'ps5', 'xbox'];
    const titleLower = product.title.toLowerCase();
    
    // Check if it's an expensive electronic item or contains premium brand keywords
    const hasHighValueKeyword = highValueKeywords.some(keyword => titleLower.includes(keyword));
    const isExpensiveElectronic = product.category === 'electronics' && product.price >= 200;
    
    return hasHighValueKeyword || isExpensiveElectronic;
  };

  return (
    <Link to={product.status === 'sold' ? '#' : createPageUrl(`ProductDetail?id=${product.id}`)} 
          onClick={product.status === 'sold' ? (e) => e.preventDefault() : undefined}>
      <div className={`bg-card p-2 rounded-xl shadow-md transition-all duration-300 h-full flex flex-col ${product.status !== 'sold' ? 'hover:shadow-lg' : 'opacity-75'}`}>
        <div className="aspect-square mb-2 rounded-lg overflow-hidden bg-gray-100 relative">
          {product.status === 'sold' && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20">
              <div className="bg-red-500 text-white text-sm font-semibold px-3 py-1 rounded-full shadow-md">
                SOLD
              </div>
            </div>
          )}
          {isHighValue() && product.status !== 'sold' && (
            <div className="absolute top-2 left-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-md z-10">
              High Value
            </div>
          )}
          {product.images && product.images.length > 0 ? (
            <img 
              src={product.images[0]} 
              alt={product.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <span className="text-sm">No image</span>
            </div>
          )}
        </div>
        
        <div className="space-y-1 flex-grow flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-foreground line-clamp-2 text-sm mb-1">
              {product.title}
            </h3>
            
            <div className="flex items-center justify-between">
              <span className={`text-base font-bold ${product.status === 'sold' ? 'text-red-500' : 'text-primary'}`}>
                {product.status === 'sold' ? 'SOLD' : formatPrice(product.price)}
              </span>
              <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                {product.condition}
              </span>
            </div>
            
            {product.location && (
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                <MapPin className="w-3 h-3" />
                {product.location}
              </div>
            )}
          </div>
          
          {seller && (
            <div className="flex items-center gap-2 pt-1 border-t border-gray-100 mt-1">
              <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                {seller.profile_image ? (
                  <img src={seller.profile_image} alt={seller.full_name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs font-medium">
                    {(seller.displayName || seller.full_name)?.charAt(0) || 'U'}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-600 font-medium">
                {seller.displayName || seller.full_name || 'Anonymous'}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
