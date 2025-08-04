import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserService } from "@/lib/firebaseServices";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft } from "lucide-react";

const interestsList = [
  "Vintage", "Streetwear", "Y2K", "Minimalist", "Designer", "Handmade",
  "Techwear", "Goth", "Skater", "Academia", "Cottagecore", "Sportswear"
];

export default function InterestsAndSizes() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [sizes, setSizes] = useState({ tops: "", bottoms: "", shoes: "" });

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await User.me();
        setSelectedInterests(user.interests || []);
        setSizes(user.sizes || { tops: "", bottoms: "", shoes: "" });
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadUserData();
  }, []);

  const handleInterestToggle = (interest) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleSizeChange = (field, value) => {
    setSizes(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await User.updateMyUserData({ interests: selectedInterests, sizes: sizes });
      alert("Saved successfully!");
      navigate(-1);
    } catch (error) {
      console.error("Error saving data:", error);
      alert("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background z-40 p-4 border-b border-border">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Interests and sizes</h1>
        </div>
      </div>

      <div className="p-4 space-y-8">
        {/* Interests */}
        <div>
          <h2 className="text-base font-semibold mb-4">My Interests</h2>
          <div className="bg-card rounded-xl p-4">
            <p className="text-sm text-muted-foreground mb-4">Select a few things you're into to get a more personalized feed.</p>
            <div className="flex flex-wrap gap-3">
              {interestsList.map(interest => (
                <div
                  key={interest}
                  onClick={() => handleInterestToggle(interest)}
                  className={`px-4 py-2 rounded-full cursor-pointer transition-colors text-sm font-medium ${
                    selectedInterests.includes(interest)
                      ? 'bg-primary text-white'
                      : 'bg-gray-100'
                  }`}
                >
                  {interest}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sizes */}
        <div>
          <h2 className="text-base font-semibold mb-4">My Sizes</h2>
          <div className="bg-card rounded-xl p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tops</label>
              <Input
                placeholder="e.g. Medium, UK 12"
                value={sizes.tops}
                onChange={(e) => handleSizeChange('tops', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bottoms</label>
              <Input
                placeholder="e.g. 32W 32L, UK 12"
                value={sizes.bottoms}
                onChange={(e) => handleSizeChange('bottoms', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Shoes</label>
              <Input
                placeholder="e.g. UK 9, EU 43"
                value={sizes.shoes}
                onChange={(e) => handleSizeChange('shoes', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t">
        <Button onClick={handleSave} disabled={saving} className="w-full h-12">
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}