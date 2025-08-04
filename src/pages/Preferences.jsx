import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserService } from "@/lib/firebaseServices";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft } from "lucide-react";

export default function Preferences() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
  });

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await User.me();
        setPreferences(user.preferences || {
          emailNotifications: true,
          pushNotifications: true,
          marketingEmails: false,
        });
      } catch (error) {
        console.error("Error loading user preferences:", error);
      } finally {
        setLoading(false);
      }
    };
    loadUserData();
  }, []);

  const handlePrefChange = (key, value) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await User.updateMyUserData({ preferences });
      alert("Preferences saved successfully!");
      navigate(-1);
    } catch (error) {
      console.error("Error saving preferences:", error);
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
          <h1 className="text-lg font-semibold text-foreground">Preferences</h1>
        </div>
      </div>
      
      <div className="p-4">
        <div className="bg-card rounded-xl p-4 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-muted-foreground">For new messages, offers, and account activity.</p>
            </div>
            <Switch
              checked={preferences.emailNotifications}
              onCheckedChange={(checked) => handlePrefChange('emailNotifications', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Push Notifications</p>
              <p className="text-sm text-muted-foreground">For real-time updates on your device.</p>
            </div>
            <Switch
              checked={preferences.pushNotifications}
              onCheckedChange={(checked) => handlePrefChange('pushNotifications', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Marketing Communications</p>
              <p className="text-sm text-muted-foreground">Receive promotions, tips, and updates from Univo.</p>
            </div>
            <Switch
              checked={preferences.marketingEmails}
              onCheckedChange={(checked) => handlePrefChange('marketingEmails', checked)}
            />
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t">
        <Button onClick={handleSave} disabled={saving} className="w-full h-12">
          {saving ? "Saving..." : "Save Preferences"}
        </Button>
      </div>
    </div>
  );
}