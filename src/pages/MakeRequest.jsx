import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ProductService } from "@/lib/firebaseServices";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function MakeRequest() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [issue, setIssue] = useState("");
  const [details, setDetails] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const productId = params.get('id');
    if (productId) {
      const loadProduct = async () => {
        try {
          const fetchedProduct = await ProductService.get(productId);
          setProduct(fetchedProduct);
        } catch (error) {
          console.error("Error loading product:", error);
        } finally {
          setLoading(false);
        }
      };
      loadProduct();
    } else {
      setLoading(false);
    }
  }, [location]);

  const handleSubmit = () => {
    if (!issue) {
      alert("Please select an issue.");
      return;
    }
    alert(`Request submitted for '${product.title}' with issue: '${issue}'. Details: ${details || 'N/A'}`);
    navigate('/AccountSettings');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background z-40 p-4 border-b border-border">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Make a request</h1>
        </div>
      </div>
      
      {loading ? (
        <p className="p-4">Loading...</p>
      ) : !product ? (
        <p className="p-4">Product not found.</p>
      ) : (
        <div className="p-4 space-y-6">
          <div className="bg-card p-3 rounded-lg flex items-center gap-4">
            <img src={product.images?.[0]} className="w-16 h-16 rounded-md object-cover" />
            <div>
              <p className="font-medium line-clamp-2">{product.title}</p>
              <p className="text-sm text-muted-foreground">Purchase date: {new Date(product.updated_date).toLocaleDateString()}</p>
            </div>
          </div>

          <div>
            <h2 className="text-base font-semibold mb-2">What's the issue?</h2>
            <div className="bg-card rounded-xl p-2 space-y-1">
              <div 
                onClick={() => setIssue("Item isn't as described")} 
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${issue === "Item isn't as described" ? "bg-primary/10" : ""}`}
              >
                <span>My item isn't as described</span>
                <ChevronRight className="w-5 h-5" />
              </div>
              <div 
                onClick={() => setIssue("Something else")} 
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${issue === "Something else" ? "bg-primary/10" : ""}`}
              >
                <span>Something else</span>
                <ChevronRight className="w-5 h-5" />
              </div>
            </div>
          </div>

          {issue && (
            <div>
              <h2 className="text-base font-semibold mb-2">Provide more details</h2>
              <Textarea 
                placeholder="Help us understand what happened..." 
                rows={5}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
              />
            </div>
          )}
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t">
        <Button onClick={handleSubmit} className="w-full h-12" disabled={!issue || loading}>
          Submit Request
        </Button>
      </div>
    </div>
  );
}