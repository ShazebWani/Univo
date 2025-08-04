import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserService, ProductService } from "@/lib/firebaseServices";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";

const boostOptions = [
  { duration: 3, price: 2.99, label: "3 Days" },
  { duration: 7, price: 5.99, label: "7 Days" },
  { duration: 14, price: 9.99, label: "14 Days" },
];

export default function BoostItem() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userProducts, setUserProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedBoost, setSelectedBoost] = useState(boostOptions[0]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const user = await User.me();
        const products = await Product.filter({ seller_id: user.id, status: "available" });
        setUserProducts(products);
      } catch (error) {
        console.error("Error loading products:", error);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  const handleBoost = () => {
    if (!selectedProductId) {
      alert("Please select an item to boost.");
      return;
    }
    alert(`Boosting item ID ${selectedProductId} for ${selectedBoost.label} at $${selectedBoost.price}. (This is a placeholder)`);
    navigate(-1);
  };
  
  const selectedProduct = userProducts.find(p => p.id === selectedProductId);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background z-40 p-4 border-b border-border">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Boost Item</h1>
        </div>
      </div>
      
      {loading ? (
        <div className="p-4 text-center">Loading your items...</div>
      ) : (
        <div className="p-4 space-y-8">
          {/* Select Item */}
          <div className="bg-card rounded-xl p-4">
            <h2 className="text-base font-semibold mb-4">1. Choose an item</h2>
            <Select onValueChange={setSelectedProductId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an item to boost" />
              </SelectTrigger>
              <SelectContent>
                {userProducts.length > 0 ? (
                  userProducts.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.title}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-muted-foreground">No available items to boost.</div>
                )}
              </SelectContent>
            </Select>
            {selectedProduct && (
              <div className="mt-4 flex gap-3 items-center bg-gray-50 p-2 rounded-lg">
                <img src={selectedProduct.images?.[0]} className="w-12 h-12 rounded-md object-cover" />
                <div>
                    <p className="font-medium">{selectedProduct.title}</p>
                    <p className="text-sm text-primary">${selectedProduct.price}</p>
                </div>
              </div>
            )}
          </div>

          {/* Select Duration */}
          <div className="bg-card rounded-xl p-4">
            <h2 className="text-base font-semibold mb-4">2. Select duration</h2>
            <RadioGroup
              defaultValue={selectedBoost.duration.toString()}
              onValueChange={(value) => {
                  const newBoost = boostOptions.find(b => b.duration === parseInt(value));
                  setSelectedBoost(newBoost);
              }}
            >
              {boostOptions.map(option => (
                <Label key={option.duration} className="flex items-center justify-between p-4 border rounded-lg has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                  <span>{option.label}</span>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold">${option.price}</span>
                    <RadioGroupItem value={option.duration.toString()} />
                  </div>
                </Label>
              ))}
            </RadioGroup>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t">
        <div className="flex justify-between items-center mb-4">
            <span className="text-muted-foreground">Total</span>
            <span className="text-xl font-bold">${selectedBoost.price.toFixed(2)}</span>
        </div>
        <Button onClick={handleBoost} className="w-full h-12" disabled={!selectedProductId}>
          Boost Item
        </Button>
      </div>
    </div>
  );
}