import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { UserService } from "@/lib/firebaseServices";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight, CreditCard, UserCircle, Heart, CheckSquare, Shield, Zap, AlertTriangle, LifeBuoy, HelpCircle, Globe, LogOut, LogIn, Tag } from "lucide-react";

const SettingsItem = ({ icon: Icon, text, subtext, to, onClick }) => {
  const content = (
    <div className="flex items-center gap-4 py-3 px-2">
      <Icon className="w-6 h-6 text-muted-foreground" />
      <div className="flex-1">
        <p className="font-medium text-foreground">{text}</p>
        {subtext && <p className="text-sm text-muted-foreground">{subtext}</p>}
      </div>
      <ChevronRight className="w-5 h-5 text-muted-foreground" />
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block hover:bg-gray-50 rounded-lg">
        {content}
      </Link>
    );
  }
  return (
    <div onClick={onClick} className="block hover:bg-gray-50 rounded-lg cursor-pointer">
      {content}
    </div>
  );
};

const SectionTitle = ({ children }) => (
  <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 pt-6 pb-2">
    {children}
  </h2>
);

export default function AccountSettings() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate(createPageUrl("Home"));
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-background">
        <div className="max-w-md w-full space-y-8">
          <div>
            <Shield className="w-16 h-16 text-primary mx-auto mb-6"/>
            <h1 className="text-3xl font-bold text-foreground mb-2">Account Settings</h1>
            <p className="text-gray-600 mb-8">
              You need to be logged in to access your settings.
            </p>
          </div>
          <Button
            onClick={() => navigate(createPageUrl("Login"))}
            className="w-full bg-primary hover:bg-primary/90 text-white py-3 text-lg"
          >
            <LogIn className="w-5 h-5 mr-2" />
            Sign In
          </Button>
          <Button variant="ghost" onClick={() => navigate(createPageUrl("Home"))}>
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background z-40 p-4 border-b border-border">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Settings</h1>
        </div>
      </div>

      <div className="p-4 space-y-2">
        {/* Payouts */}
        <SectionTitle>Payouts</SectionTitle>
        <div className="bg-card rounded-xl p-2">
          <SettingsItem icon={CreditCard} text="Univo balance" subtext="$0.00" to={createPageUrl("Payouts")} />
        </div>

        {/* My Account */}
        <SectionTitle>My account</SectionTitle>
        <div className="bg-card rounded-xl p-2">
          <SettingsItem icon={UserCircle} text="Profile" to={createPageUrl("Profile")} />
          <SettingsItem icon={Heart} text="Interests and sizes" to={createPageUrl("InterestsAndSizes")} />
          <SettingsItem icon={Tag} text="Conversation Tags" to={createPageUrl("ManageTags")} />
          <SettingsItem icon={CheckSquare} text="Preferences" to={createPageUrl("Preferences")} />
          <SettingsItem icon={Shield} text="Privacy" subtext="Coming Later" onClick={() => {}} />
        </div>

        {/* Selling */}
        <SectionTitle>Selling</SectionTitle>
        <div className="bg-card rounded-xl p-2">
          <SettingsItem icon={Zap} text="Boost item" to={createPageUrl("BoostItem")} />
          <SettingsItem icon={AlertTriangle} text="Sold item issues" to={createPageUrl("SoldItemIssues")} />
        </div>
        
        {/* Support */}
        <SectionTitle>Support</SectionTitle>
        <div className="bg-card rounded-xl p-2">
          <SettingsItem icon={LifeBuoy} text="Disputes Center" onClick={() => alert("Link to Disputes Center")} />
          <SettingsItem icon={HelpCircle} text="Help Center" onClick={() => alert("Link to Help Center")} />
          <SettingsItem icon={Globe} text="Univo Website" onClick={() => window.open("https://tryunivo.com", "_blank")} />
        </div>

        {/* Logout */}
        <div className="pt-8">
          <Button 
            variant="outline" 
            className="w-full justify-center h-12"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}