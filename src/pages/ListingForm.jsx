import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ProductService, UserService, FileUploadService } from "@/lib/firebaseServices";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, X, Plus, Upload, Ticket, Code, Calendar } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function ListingForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [productId, setProductId] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    condition: "",
    category: "",
    subcategory: "",
    location: "",
    images: [],
    // Digital-specific fields
    digitalDelivery: "",
    accessInstructions: "",
    // Ticket-specific fields
    eventDate: "",
    eventTime: "",
    venue: "",
    ticketType: ""
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('id');
    if (id) {
      setProductId(id);
      setIsEditMode(true);
      loadProduct(id);
    } else {
      setLoading(false);
    }
  }, [location]);

  const loadProduct = async (id) => {
    try {
      const product = await ProductService.get(id);
      
      setFormData({
        title: product.title || "",
        description: product.description || "",
        price: product.price?.toString() || "",
        condition: product.condition || "",
        category: product.category || "",
        subcategory: product.subcategory || "",
        location: product.location || "",
        images: product.images || [],
        digitalDelivery: product.digitalDelivery || "",
        accessInstructions: product.accessInstructions || "",
        eventDate: product.eventDate || "",
        eventTime: product.eventTime || "",
        venue: product.venue || "",
        ticketType: product.ticketType || ""
      });
    } catch (error) {
      console.error("Error loading product:", error);
      navigate(createPageUrl("Profile"));
    } finally {
      setLoading(false);
    }
  };
  
  const conditions = [
    { value: "new", label: "✨ New" },
    { value: "like_new", label: "🌟 Like New" },
    { value: "good", label: "👍 Good" },
    { value: "fair", label: "👌 Fair" },
    { value: "poor", label: "⚠️ Poor" }
  ];

  const categories = [
    { value: "textbooks", label: "📚 Textbooks", type: "physical" },
    { value: "electronics", label: "📱 Electronics", type: "physical" },
    { value: "clothing", label: "👕 Clothing", type: "physical" },
    { value: "furniture", label: "🪑 Furniture", type: "physical" },
    { value: "supplies", label: "📝 Supplies", type: "physical" },
    { value: "digital", label: "💾 Digital Items", type: "digital" },
    { value: "tickets", label: "🎫 Event Tickets", type: "digital" },
    { value: "other", label: "🔗 Other", type: "physical" }
  ];

  const digitalSubcategories = [
    { value: "software", label: "💻 Software & Apps" },
    { value: "ebooks", label: "📖 E-books & PDFs" },
    { value: "courses", label: "🎓 Online Courses" },
    { value: "templates", label: "📄 Templates & Documents" },
    { value: "game_items", label: "🎮 Game Items/Accounts" },
    { value: "subscriptions", label: "🔐 Subscription Access" }
  ];

  const ticketTypes = [
    { value: "sports", label: "🏈 Sports Events" },
    { value: "concerts", label: "🎵 Concerts & Music" },
    { value: "theater", label: "🎭 Theater & Shows" },
    { value: "academic", label: "📚 Academic Events" },
    { value: "social", label: "🎉 Social Events" }
  ];

  const getSelectedCategory = () => {
    return categories.find(cat => cat.value === formData.category);
  };

  const isDigitalCategory = () => {
    const category = getSelectedCategory();
    return category?.type === "digital";
  };

  const isTicketCategory = () => {
    return formData.category === "tickets";
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Reset subcategory when category changes
      if (field === "category") {
        newData.subcategory = "";
      }
      
      return newData;
    });
  };

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = files.map(file => FileUploadService.upload(file));
      const uploadResults = await Promise.all(uploadPromises);
      const newImageUrls = uploadResults.map(result => result.url);
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...newImageUrls].slice(0, 5)
      }));
    } catch (error) {
      console.error("Error uploading images:", error);
      alert("Failed to upload images. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.title || !formData.description || !formData.price || !formData.category) {
      alert("Please fill in all required fields");
      return;
    }

    // Condition is only required for physical items
    if (!isDigitalCategory() && !formData.condition) {
      alert("Please select a condition for physical items");
      return;
    }

    // Digital category requires subcategory
    if (formData.category === "digital" && !formData.subcategory) {
      alert("Please select a subcategory for digital items");
      return;
    }

    // Ticket validation
    if (isTicketCategory()) {
      if (!formData.eventDate || !formData.venue) {
        alert("Please fill in event date and venue for tickets");
        return;
      }
    }

    setSaving(true);
    try {
      if (!user) {
        alert("Please log in to create a listing");
        return;
      }
      
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        seller_id: user.uid,
        seller_school_domain: user.email?.split('@')[1]?.toLowerCase(),
        status: "available"
      };

      if (isEditMode) {
        await ProductService.update(productId, productData);
        alert("Listing updated successfully!");
      } else {
        await ProductService.create(productData);
        alert("Listing created successfully!");
      }
      
      navigate(createPageUrl("Profile"));
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Failed to save listing. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this listing?")) return;
    
    try {
      await ProductService.delete(productId);
      alert("Listing deleted successfully!");
      navigate(createPageUrl("Profile"));
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete listing. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(createPageUrl("Profile"))}
              className="rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isEditMode ? "Edit Listing" : "Create Listing"}
              </h1>
              <p className="text-sm text-gray-600">
                {isEditMode ? "Update your item details" : "Share what you're selling with your campus"}
              </p>
            </div>
          </div>
          {isEditMode && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="rounded-xl"
            >
              Delete
            </Button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-4 space-y-8 pb-20">
        {/* Photos Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-orange-500 rounded-xl flex items-center justify-center">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Photos</h2>
              <p className="text-sm text-gray-600">Add up to 5 photos to showcase your item</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {formData.images.map((image, index) => (
              <div key={index} className="relative aspect-square group">
                <img 
                  src={image} 
                  alt={`Product ${index + 1}`}
                  className="w-full h-full object-cover rounded-xl border-2 border-gray-200"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            
            {formData.images.length < 5 && (
              <label className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors group">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <div className="text-center">
                  {uploading ? (
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  ) : (
                    <Plus className="w-8 h-8 text-gray-400 group-hover:text-blue-500 mx-auto mb-2 transition-colors" />
                  )}
                  <span className="text-sm text-gray-500 group-hover:text-blue-600 font-medium">
                    {uploading ? "Uploading..." : "Add Photo"}
                  </span>
                </div>
              </label>
            )}
          </div>
        </div>

        {/* Basic Information */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-semibold">1</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Basic Information</h2>
              <p className="text-sm text-gray-600">Tell us about your item</p>
            </div>
          </div>
          
          <div className="grid gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">What are you selling? *</label>
              <Input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="e.g., MacBook Pro 2021, Chemistry Textbook, Concert Ticket"
                className="w-full h-12 text-lg border-2 border-gray-200 focus:border-blue-500 rounded-xl transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Category *</label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)} required>
                <SelectTrigger className="w-full h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl text-lg">
                  <SelectValue placeholder="Choose a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value} className="text-lg py-3">
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Digital Subcategory */}
            {formData.category === "digital" && (
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <label className="block text-sm font-semibold text-blue-800 mb-3">Digital Item Type *</label>
                <Select value={formData.subcategory} onValueChange={(value) => handleInputChange("subcategory", value)} required>
                  <SelectTrigger className="w-full h-12 border-2 border-blue-200 focus:border-blue-500 rounded-xl bg-white">
                    <SelectValue placeholder="What type of digital item?" />
                  </SelectTrigger>
                  <SelectContent>
                    {digitalSubcategories.map((sub) => (
                      <SelectItem key={sub.value} value={sub.value}>
                        {sub.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Ticket Type */}
            {isTicketCategory() && (
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                <label className="block text-sm font-semibold text-purple-800 mb-3">Ticket Type</label>
                <Select value={formData.ticketType} onValueChange={(value) => handleInputChange("ticketType", value)}>
                  <SelectTrigger className="w-full h-12 border-2 border-purple-200 focus:border-purple-500 rounded-xl bg-white">
                    <SelectValue placeholder="What type of event?" />
                  </SelectTrigger>
                  <SelectContent>
                    {ticketTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Description *</label>
              <Textarea
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder={isTicketCategory() 
                  ? "Describe the event, seating section, any special details..." 
                  : isDigitalCategory() 
                  ? "Describe what's included, system requirements, access details..."
                  : "Describe the condition, features, what's included..."
                }
                rows={4}
                className="w-full border-2 border-gray-200 focus:border-blue-500 rounded-xl text-base transition-colors resize-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Price *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold text-lg">$</span>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full h-12 pl-8 text-lg border-2 border-gray-200 focus:border-green-500 rounded-xl transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Condition only for physical items */}
              {!isDigitalCategory() && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Condition *</label>
                  <Select value={formData.condition} onValueChange={(value) => handleInputChange("condition", value)} required>
                    <SelectTrigger className="w-full h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl">
                      <SelectValue placeholder="Item condition" />
                    </SelectTrigger>
                    <SelectContent>
                      {conditions.map((condition) => (
                        <SelectItem key={condition.value} value={condition.value}>
                          {condition.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Location for physical items */}
            {!isDigitalCategory() && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Pickup Location</label>
                <Input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  placeholder="e.g., Student Center, Dorm Name, Campus Library"
                  className="w-full h-12 text-base border-2 border-gray-200 focus:border-blue-500 rounded-xl transition-colors"
                />
              </div>
            )}
          </div>
        </div>

        {/* Event Details for Tickets */}
        {isTicketCategory() && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <Ticket className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Event Details</h2>
                <p className="text-sm text-gray-600">When and where is the event?</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Event Date *</label>
                <Input
                  type="date"
                  value={formData.eventDate}
                  onChange={(e) => handleInputChange("eventDate", e.target.value)}
                  className="w-full h-12 border-2 border-gray-200 focus:border-purple-500 rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Event Time</label>
                <Input
                  type="time"
                  value={formData.eventTime}
                  onChange={(e) => handleInputChange("eventTime", e.target.value)}
                  className="w-full h-12 border-2 border-gray-200 focus:border-purple-500 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Venue *</label>
              <Input
                type="text"
                value={formData.venue}
                onChange={(e) => handleInputChange("venue", e.target.value)}
                placeholder="e.g., Bobby Dodd Stadium, Fox Theatre, Campus Auditorium"
                className="w-full h-12 border-2 border-gray-200 focus:border-purple-500 rounded-xl"
                required
              />
            </div>
          </div>
        )}

        {/* Digital Delivery for Digital Items */}
        {isDigitalCategory() && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center">
                <Code className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Digital Delivery</h2>
                <p className="text-sm text-gray-600">How will buyers access this item?</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">How will you deliver this item?</label>
              <Select value={formData.digitalDelivery} onValueChange={(value) => handleInputChange("digitalDelivery", value)}>
                <SelectTrigger className="w-full h-12 border-2 border-gray-200 focus:border-green-500 rounded-xl">
                  <SelectValue placeholder="Choose delivery method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">📧 Email attachment</SelectItem>
                  <SelectItem value="link">🔗 Download link</SelectItem>
                  <SelectItem value="cloud">☁️ Cloud sharing (Google Drive, Dropbox)</SelectItem>
                  <SelectItem value="code">🔑 Access code/key</SelectItem>
                  <SelectItem value="account">👤 Account credentials</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Access Instructions</label>
              <Textarea
                value={formData.accessInstructions}
                onChange={(e) => handleInputChange("accessInstructions", e.target.value)}
                placeholder="Explain how the buyer will receive and access the digital item..."
                rows={3}
                className="w-full border-2 border-gray-200 focus:border-green-500 rounded-xl resize-none"
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <Button
            type="submit"
            disabled={saving}
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
          >
            {saving ? (
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                {isEditMode ? "Updating..." : "Creating..."}
              </div>
            ) : (
              isEditMode ? "Update Listing" : "Create Listing"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}