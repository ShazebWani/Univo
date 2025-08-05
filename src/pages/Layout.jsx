
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, Search, MessageCircle, User, Plus, LogOut, Settings } from "lucide-react";
import { useMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { useSchoolTheme } from "@/contexts/SchoolThemeContext";
import { UserService } from "@/lib/firebaseServices";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import EmailVerificationBanner from "@/components/EmailVerificationBanner";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const { isMobile } = useMobile();
  const { user, logout } = useAuth();
  const { refreshTheme } = useSchoolTheme();
  const { totalUnreadCount } = useUnreadMessages();
  const [userProfile, setUserProfile] = useState(null);
  
  useEffect(() => {
    const loadUserProfile = async () => {
      if (user) {
        try {
          const profile = await UserService.getProfile(user.uid);
          setUserProfile(profile);
        } catch (error) {
          console.error("Error loading user profile:", error);
          // Set null profile on error to prevent crashes
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
    };

    loadUserProfile();
  }, [user]);

  // Force theme refresh when layout loads
  useEffect(() => {
    if (refreshTheme) {
      refreshTheme();
    }
  }, [refreshTheme, location.pathname]);
  
  const isActivePage = (pageName) => {
    if (pageName === "CreateListing" && location.pathname === createPageUrl("ListingForm")) {
      return true;
    }
    return location.pathname === createPageUrl(pageName);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Debug: Show current theme colors in console */}
      {process.env.NODE_ENV === 'development' && (
        <script dangerouslySetInnerHTML={{
          __html: `
            console.log('Current CSS Variables:');
            console.log('--school-primary:', getComputedStyle(document.documentElement).getPropertyValue('--school-primary'));
            console.log('--primary:', getComputedStyle(document.documentElement).getPropertyValue('--primary'));
          `
        }} />
      )}
      
      {/* Header */}
      <header className="bg-primary text-white sticky top-0 z-50 shadow-md">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between h-12">
            <Link to={createPageUrl("Home")} className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center overflow-hidden p-1">
                <img 
                  src="/src/assets/Univo-Logo.png" 
                  alt="Univo Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xl font-bold text-white">Univo</span>
            </Link>
            
            <div className="flex items-center gap-3">
              <Link to={createPageUrl("ListingForm")}>
                <div className="bg-secondary hover:bg-secondary/80 rounded-lg p-2 w-10 h-10 flex items-center justify-center shadow-sm transition-all">
                  <Plus className="w-5 h-5 text-white" />
                </div>
              </Link>
              
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="bg-white/20 hover:bg-white/30 rounded-lg p-2 w-10 h-10 flex items-center justify-center shadow-sm transition-all cursor-pointer">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user.displayName || 'User'}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl("Profile")}>
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl("AccountSettings")}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-24 safe-area-inset-bottom">
        <EmailVerificationBanner />
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-area-inset-bottom">
        <div className="flex justify-around items-center py-2 h-16 px-4">
          <Link 
            to={createPageUrl("Home")} 
            className="flex flex-col items-center justify-center p-2 w-1/4 h-full text-muted-foreground hover:text-primary transition-colors active:scale-95"
          >
            <div className="relative">
              <Home className={`w-6 h-6 ${isActivePage("Home") ? "text-primary" : ""}`} />
            </div>
            <span className={`text-xs mt-1 ${isActivePage("Home") ? "text-primary font-semibold" : ""}`}>Home</span>
          </Link>
          
          <Link 
            to={createPageUrl("Explore")} 
            className="flex flex-col items-center justify-center p-2 w-1/4 h-full text-muted-foreground hover:text-primary transition-colors active:scale-95"
          >
            <div className="relative">
              <Search className={`w-6 h-6 ${isActivePage("Explore") ? "text-primary" : ""}`} />
            </div>
            <span className={`text-xs mt-1 ${isActivePage("Explore") ? "text-primary font-semibold" : ""}`}>Explore</span>
          </Link>
          
          <Link 
            to={createPageUrl("Messages")} 
            className="flex flex-col items-center justify-center p-2 w-1/4 h-full text-muted-foreground hover:text-primary transition-colors active:scale-95 relative"
          >
            <div className="relative">
              <MessageCircle className={`w-6 h-6 ${isActivePage("Messages") ? "text-primary" : ""}`} />
              {totalUnreadCount > 0 && (
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center min-w-[16px]">
                  {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
                </div>
              )}
            </div>
            <span className={`text-xs mt-1 ${isActivePage("Messages") ? "text-primary font-semibold" : ""}`}>Messages</span>
          </Link>
          
          <Link 
            to={createPageUrl("Profile")} 
            className="flex flex-col items-center justify-center p-2 w-1/4 h-full text-muted-foreground hover:text-primary transition-colors active:scale-95"
          >
            <div className="relative">
              <User className={`w-6 h-6 ${isActivePage("Profile") ? "text-primary" : ""}`} />
            </div>
            <span className={`text-xs mt-1 ${isActivePage("Profile") ? "text-primary font-semibold" : ""}`}>Profile</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
