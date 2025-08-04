
import React, { useState, useEffect, useRef } from "react";
import { UserService, ProductService, FileUploadService } from "@/lib/firebaseServices";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Star, MapPin, Edit, Settings, LogOut, MoreVertical, Trash2, Camera } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import ProductCard from "../components/ProductCard";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Profile() {
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();
  const [user, setUser] = useState(null);
  const [userProducts, setUserProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [activeTab, setActiveTab] = useState("available");
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Filter products when activeTab or userProducts change
    const filtered = userProducts.filter(p => activeTab === 'sold' ? p.status === 'sold' : p.status !== 'sold');
    setFilteredProducts(filtered);
  }, [activeTab, userProducts]);

  useEffect(() => {
    // Load profile when component mounts or authUser changes
    loadProfile();
  }, [authUser]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      if (!authUser) {
        setLoading(false);
        return;
      }

      // Get user profile from Firestore
      const userData = await UserService.getProfile(authUser.uid);
      setUser(userData);
      setEditForm({
        full_name: userData.displayName || '',
        bio: userData.bio || '',
        university: userData.school || '',
        year: userData.year || ''
      });
      
      // Get user's school domain for consistent filtering
      const userSchoolDomain = authUser?.email?.split('@')[1]?.toLowerCase();
      const filter = { 
        seller_id: authUser.uid,
        ...(userSchoolDomain && { seller_school_domain: userSchoolDomain })
      };
      
      const products = await ProductService.list(filter, "-created_date");
      setUserProducts(products);
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      if (!authUser) return;
      
      await UserService.updateProfile(authUser.uid, {
        displayName: editForm.full_name,
        bio: editForm.bio,
        school: editForm.university,
        year: editForm.year
      });
      setUser(prev => ({ ...prev, ...editForm }));
      setEditing(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again.");
    }
  };

  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
        const { file_url } = await FileUploadService.upload(file);
        await UserService.updateProfile(authUser.uid, { profile_image: file_url });
        setUser(prev => ({ ...prev, profile_image: file_url }));
    } catch (error) {
        console.error("Error uploading profile picture:", error);
        alert("Failed to upload photo. Please try again.");
    } finally {
        setUploadingPhoto(false);
    }
  };
  
  const handleEditProduct = (productId) => {
    navigate(createPageUrl(`ListingForm?id=${productId}`));
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm("Are you sure you want to delete this listing? This action cannot be undone.")) {
      try {
        await ProductService.delete(productId);
        loadProfile(); 
      } catch (error) {
        console.error("Error deleting product:", error);
        alert("Failed to delete product. Please try again.");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate(createPageUrl("Home"));
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-6">
        <div className="bg-card p-6 rounded-xl shadow-md animate-pulse">
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
        <p className="text-gray-500">Could not load profile. Please log in.</p>
                    <Button onClick={() => navigate(createPageUrl("Login"))} className="mt-4">Login</Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Profile Header */}
      <div className="bg-card p-6 rounded-xl shadow-md">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="relative">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                    {user.profile_image ? (
                        <img src={user.profile_image} alt={user.full_name} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-2xl font-bold">{user.full_name?.charAt(0) || 'U'}</span>
                    )}
                </div>
                <input type="file" ref={fileInputRef} onChange={handleProfilePictureUpload} accept="image/*" className="hidden"/>
                <Button 
                    size="icon" 
                    className="absolute bottom-0 right-0 rounded-full h-7 w-7 bg-primary text-white"
                    onClick={() => fileInputRef.current.click()}
                    disabled={uploadingPhoto}
                >
                    {uploadingPhoto ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Camera className="w-4 h-4"/>}
                </Button>
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {user.displayName || user.full_name || 'Anonymous User'}
              </h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span>{user.rating?.toFixed(1) || '5.0'}</span>
                <span>•</span>
                <span>{user.total_sales || 0} sales</span>
              </div>
              {(user.school || user.university) && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <MapPin className="w-3 h-3" />
                  <span>{user.school || user.university}</span>
                  {user.year && <span>• {user.year}</span>}
                </div>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setEditing(!editing)}
          >
            <Edit className="w-4 h-4" />
          </Button>
        </div>

        {editing ? (
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-semibold">Edit Profile</h3>
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <Input
                value={editForm.full_name}
                onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                className="bg-gray-100 border-border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bio</label>
              <Textarea
                value={editForm.bio}
                onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                className="bg-gray-100 border-border"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">University</label>
              <Input
                value={editForm.university}
                onChange={(e) => setEditForm(prev => ({ ...prev, university: e.target.value }))}
                className="bg-gray-100 border-border"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSaveProfile}
                className="bg-primary text-white hover:bg-primary/90"
              >
                Save Changes
              </Button>
              <Button
                variant="outline"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div>
            {user.bio && (
              <p className="text-muted-foreground">{user.bio}</p>
            )}
          </div>
        )}
      </div>

      {/* Settings */}
      <div className="bg-card p-6 rounded-xl shadow-md">
        <h2 className="text-lg font-semibold mb-4">Settings</h2>
        <div className="space-y-2">
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl("AccountSettings"))}
            className="w-full justify-start"
          >
            <Settings className="w-4 h-4 mr-2" />
            Account Settings
          </Button>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full justify-start text-red-600 hover:text-red-600"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      {/* My Listings */}
      <div>
        <div className="border-b-2 border-primary/20 pb-2 mb-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-primary">My Listings</h2>
            <div className="bg-gray-100 p-1 rounded-lg flex text-sm">
                <Button onClick={() => setActiveTab('available')} size="sm" variant={activeTab === 'available' ? 'default' : 'ghost'} className={`rounded-md ${activeTab === 'available' ? 'bg-primary text-white' : ''}`}>Available</Button>
                <Button onClick={() => setActiveTab('sold')} size="sm" variant={activeTab === 'sold' ? 'default' : 'ghost'} className={`rounded-md ${activeTab === 'sold' ? 'bg-primary text-white' : ''}`}>Sold</Button>
            </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {filteredProducts.map((product) => (
            <div key={product.id} className="relative">
              <ProductCard product={product} seller={user} />
              <div className="absolute top-2 right-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 bg-black/10 backdrop-blur-sm hover:bg-black/20 rounded-full text-white"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-card rounded-lg shadow-lg border-border">
                    <DropdownMenuItem onClick={() => handleEditProduct(product.id)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Listing
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleDeleteProduct(product.id)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Listing
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
        {filteredProducts.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No {activeTab} listings found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
