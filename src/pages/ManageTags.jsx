
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserService } from "@/lib/firebaseServices";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft } from "lucide-react";

const initialTagColors = ["red", "blue", "green"];

export default function ManageTags() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tags, setTags] = useState([]);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        if (!authUser) {
          setLoading(false);
          return;
        }

        const userData = await UserService.getProfile(authUser.uid);
        const existingTags = userData?.custom_tags || [];
        
        // Create a full list of 3 tags, using existing ones and padding with defaults
        const displayTags = Array(3).fill(null).map((_, index) => {
          if (existingTags[index]) {
            return existingTags[index];
          }
          return { 
            id: `tag_${Date.now()}_${index}`,
            name: "", 
            color: `#${['EF4444', '3B82F6', '10B981'][index]}` // Red, Blue, Green
          };
        });

        setTags(displayTags);
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadUserData();
  }, [authUser]);

  const handleTagNameChange = (index, newName) => {
    setTags(prev => 
      prev.map((tag, i) => (i === index ? { ...tag, name: newName } : tag))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (!authUser) return;
      
      const tagsToSave = tags.filter(t => t.name && t.name.trim() !== "").map(tag => ({
        ...tag,
        name: tag.name.trim()
      }));
      
      await UserService.updateProfile(authUser.uid, { custom_tags: tagsToSave });
      alert("Tags saved successfully!");
      navigate(-1);
    } catch (error) {
      console.error("Error saving tags:", error);
      alert("Failed to save tags. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 bg-background z-40 p-4 border-b border-border">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Conversation Tags</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        <div className="bg-card rounded-xl p-4">
          <p className="text-sm text-muted-foreground mb-4">
            Create custom tags to organize your inbox. Tag names will appear in the conversation options.
          </p>
          <div className="space-y-4">
            {tags.map((tag, index) => (
              <div key={index} className="flex items-center gap-3">
                <div 
                  className="w-6 h-6 rounded-full flex-shrink-0"
                  style={{ backgroundColor: tag.color }}
                ></div>
                <Input
                  placeholder={`Tag ${index + 1} Name (e.g., Urgent)`}
                  value={tag.name}
                  onChange={(e) => handleTagNameChange(index, e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t">
        <Button onClick={handleSave} disabled={saving} className="w-full h-12">
          {saving ? "Saving..." : "Save Tags"}
        </Button>
      </div>
    </div>
  );
}
