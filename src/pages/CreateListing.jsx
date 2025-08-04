
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom"; // Added useParams and useEffect
import { ProductService, UserService, FileUploadService } from "@/lib/firebaseServices";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, X, Trash2 } from "lucide-react"; // Added Trash2 icon
import { createPageUrl } from "@/utils";

// Renamed component from CreateListing to ManageListing to reflect edit/delete functionality
export default function ManageListing() {
  const navigate = useNavigate();
  const { product_id } = useParams(); // Get product_id from URL for edit mode
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "", // Stored as string for input field
    condition: "",
    category: "",
    location: "",
    images: []
  });
  const [uploading, setUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // General state for form submission (create/update/delete)
  const [isLoading, setIsLoading] = useState(!!product_id); // True if product_id exists (meaning we need to load data)

  const conditions = [
    { value: "new", label: "New" },
    { value: "like_new", label: "Like New" },
    { value: "good", label: "Good" },
    { value: "fair", label: "Fair" },
    { value: "poor", label: "Poor" }
  ];

  const categories = [
    { value: "textbooks", label: "Textbooks" },
    { value: "electronics", label: "Electronics" },
    { value: "clothing", label: "Clothing" },
    { value: "furniture", "label": "Furniture" },
    { value: "supplies", label: "Supplies" },
    { value: "events", label: "Events" },
    { value: "other", label: "Other" }
  ];

  // Effect to load product data if product_id is present (edit mode)
  useEffect(() => {
    if (product_id) {
      const fetchProduct = async () => {
        try {
          const product = await ProductService.get(product_id);
          if (product) {
            setFormData({
              title: product.title || "",
              description: product.description || "",
              price: product.price ? String(product.price) : "", // Convert number to string for input
              condition: product.condition || "",
              category: product.category || "",
              location: product.location || "", // Ensure location is a string, even if null/undefined from backend
              images: product.images || []
            });
          } else {
            // Product not found, navigate away
            console.warn(`Product with ID ${product_id} not found.`);
            navigate(createPageUrl("Profile")); // Redirect to profile or a 404 page
          }
        } catch (error) {
          console.error("Error fetching product for editing:", error);
          alert("Error loading listing details. Please try again.");
          navigate(createPageUrl("Profile")); // Redirect on error
        } finally {
          setIsLoading(false);
        }
      };
      fetchProduct();
    }
  }, [product_id, navigate]); // Dependencies: re-run if product_id changes or navigate function changes

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    // Limit to 5 images total
    if (formData.images.length + files.length > 5) {
      alert(`You can upload a maximum of 5 images. You already have ${formData.images.length} images.`);
      return;
    }

    setUploading(true);
    try {
      // Use Promise.allSettled to handle individual file upload failures gracefully
      const uploadResults = await Promise.allSettled(files.map(file => FileUploadService.upload(file)));

      const newImageUrls = uploadResults
        .filter(result => result.status === "fulfilled" && result.value && result.value.file_url)
        .map(result => result.value.file_url);

      if (newImageUrls.length < files.length) {
          alert("Some images failed to upload. Please try again for those specific images.");
      }
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...newImageUrls].slice(0, 5) // Ensure we don't exceed 5
      }));
    } catch (error) {
      console.error("Error uploading images:", error);
      alert("Error uploading images. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.description || !formData.price || !formData.condition || !formData.category) {
      alert("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (!user) {
        alert("Please log in to create a listing");
        return;
      }

      const productData = {
        ...formData,
        price: parseFloat(formData.price), // Convert price string to number for storage
        seller_id: user.id,
        seller_school_domain: user.email?.split('@')[1]?.toLowerCase(),
        status: "available"
      };

      if (product_id) {
        // Update existing product
        await ProductService.update(product_id, productData);
        alert("Listing updated successfully!");
      } else {
        // Create new product
        await ProductService.create(productData);
        alert("Listing created successfully!");
      }
      navigate(createPageUrl("Profile")); // Redirect to profile page after success
    } catch (error) {
      console.error(`Error ${product_id ? "updating" : "creating"} listing:`, error);
      alert(`Error ${product_id ? "updating" : "creating"} listing. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!product_id) return; // Only allow delete in edit mode

    if (window.confirm("Are you sure you want to delete this listing? This action cannot be undone.")) {
      setIsSubmitting(true);
      try {
        await ProductService.delete(product_id);
        alert("Listing deleted successfully!");
        navigate(createPageUrl("Profile")); // Redirect after deletion
      } catch (error) {
        console.error("Error deleting listing:", error);
        alert("Error deleting listing. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Show loading spinner while fetching product data in edit mode
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-lg text-gray-600">Loading listing details...</p>
      </div>
    );
  }

  return (
    <div className="pb-24"> {/* Added padding to prevent action bar from hiding content */}
      {/* Header */}
      <div className="sticky top-16 bg-background z-40 p-4 border-b border-border">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="neumorphic-button"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">
            {product_id ? "Edit Listing" : "Create Listing"}
          </h1>
          {product_id && ( // Show delete button only when editing an existing listing
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="ml-auto text-red-500 hover:text-red-600 neumorphic-button"
              disabled={isSubmitting} // Disable delete button during submission
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        {/* Images Section */}
        <div className="neumorphic-card p-6">
          <h2 className="text-lg font-semibold mb-4">Photos</h2>

          <div className="grid grid-cols-3 gap-4 mb-4">
            {formData.images.map((image, index) => (
              <div key={index} className="relative aspect-square">
                <img
                  src={image}
                  alt={`Product ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 z-10" // Added z-index to ensure button is clickable
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            {/* Add photo button/input, limited to 5 images */}
            {formData.images.length < 5 && (
              <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading || isSubmitting} // Disable while uploading or submitting form
                />
                <div className="text-center">
                  {uploading ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  ) : (
                    <Plus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  )}
                  <span className="text-sm text-gray-500">Add Photo</span>
                </div>
              </label>
            )}
          </div>
        </div>

        {/* Basic Info Section */}
        <div className="neumorphic-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Basic Information</h2>

          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">Title *</label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="What are you selling?"
              className="neumorphic-inset border-0 bg-transparent"
              required
              disabled={isSubmitting} // Disable input during submission
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2">Description *</label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Describe your item in detail..."
              className="neumorphic-inset border-0 bg-transparent"
              rows={4}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className="block text-sm font-medium mb-2">Price *</label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
                placeholder="0.00"
                className="neumorphic-inset border-0 bg-transparent"
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Condition *</label>
              <Select
                value={formData.condition}
                onValueChange={(value) => handleInputChange("condition", value)}
                disabled={isSubmitting} // Disable select during submission
              >
                <SelectTrigger className="neumorphic-inset border-0 bg-transparent">
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent className="neumorphic-card border-0">
                  {conditions.map((condition) => (
                    <SelectItem key={condition.value} value={condition.value}>
                      {condition.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Category *</label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange("category", value)}
                disabled={isSubmitting}
              >
                <SelectTrigger className="neumorphic-inset border-0 bg-transparent">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="neumorphic-card border-0">
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label htmlFor="location" className="block text-sm font-medium mb-2">Location</label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
                placeholder="Campus location"
                className="neumorphic-inset border-0 bg-transparent"
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        {/* Submit Button (fixed at bottom) */}
        <div className="fixed bottom-16 left-0 right-0 p-4 bg-background border-t border-border">
          <Button
            type="submit"
            disabled={isSubmitting || uploading} // Disable if any async operation is in progress
            className="w-full bg-primary hover:bg-primary/90 text-white neumorphic-button"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                {product_id ? "Saving Changes..." : "Creating Listing..."}
              </>
            ) : (
              product_id ? "Save Changes" : "Create Listing"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
