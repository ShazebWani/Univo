import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserService, ProductService } from "@/lib/firebaseServices";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/contexts/AuthContext";

export default function SoldItemIssues() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [soldProducts, setSoldProducts] = useState([]);

  useEffect(() => {
    const loadSoldProducts = async () => {
      try {
        if (!user) {
          setLoading(false);
          return;
        }

        // Get user's school domain for consistent filtering
        const userSchoolDomain = user?.email?.split('@')[1]?.toLowerCase();
        const filter = { 
          seller_id: user.uid, 
          status: "sold",
          ...(userSchoolDomain && { seller_school_domain: userSchoolDomain })
        };
        
        const products = await ProductService.list(filter, "-created_date");
        setSoldProducts(products);
      } catch (error) {
        console.error("Error loading sold products:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      loadSoldProducts();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleSelectProduct = (productId) => {
    navigate(createPageUrl(`MakeRequest?id=${productId}`));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background z-40 p-4 border-b border-border">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Get help with an item</h1>
        </div>
      </div>

      <div className="p-4">
        <h2 className="text-base font-semibold mb-4">Select the item you need help with</h2>
        <div className="space-y-3">
          {loading ? (
            <p>Loading sold items...</p>
          ) : soldProducts.length > 0 ? (
            soldProducts.map(product => (
              <div
                key={product.id}
                onClick={() => handleSelectProduct(product.id)}
                className="bg-card p-3 rounded-lg flex items-center gap-4 cursor-pointer hover:bg-gray-50"
              >
                <img src={product.images?.[0]} className="w-16 h-16 rounded-md object-cover" />
                <div className="flex-1">
                  <p className="font-medium line-clamp-2">{product.title}</p>
                  <p className="text-sm text-muted-foreground">Sold on: {new Date(product.updated_date).toLocaleDateString()}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              You have no sold items.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}