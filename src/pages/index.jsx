import Layout from "./Layout.jsx";

import Home from "./Home";

import Explore from "./Explore";

import ProductDetail from "./ProductDetail";

import Messages from "./Messages";

import Profile from "./Profile";

import CreateListing from "./CreateListing";

import ListingForm from "./ListingForm";

import UserProfile from "./UserProfile";

import AccountSettings from "./AccountSettings";

import InterestsAndSizes from "./InterestsAndSizes";

import Preferences from "./Preferences";

import BoostItem from "./BoostItem";

import SoldItemIssues from "./SoldItemIssues";

import MakeRequest from "./MakeRequest";

import Payouts from "./Payouts";

import ManageTags from "./ManageTags";

import Login from "./Login";

import Signup from "./Signup";

import ForgotPassword from "./ForgotPassword";

import ProtectedRoute from "@/components/ProtectedRoute";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Home: Home,
    
    Explore: Explore,
    
    ProductDetail: ProductDetail,
    
    Messages: Messages,
    
    Profile: Profile,
    
    CreateListing: CreateListing,
    
    ListingForm: ListingForm,
    
    UserProfile: UserProfile,
    
    AccountSettings: AccountSettings,
    
    InterestsAndSizes: InterestsAndSizes,
    
    Preferences: Preferences,
    
    BoostItem: BoostItem,
    
    SoldItemIssues: SoldItemIssues,
    
    MakeRequest: MakeRequest,
    
    Payouts: Payouts,
    
    ManageTags: ManageTags,
    
    Login: Login,
    
    Signup: Signup,
    
    ForgotPassword: ForgotPassword,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                {/* Public routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                
                {/* Protected routes */}
                <Route path="/" element={
                    <ProtectedRoute>
                        <Home />
                    </ProtectedRoute>
                } />
                
                <Route path="/Home" element={
                    <ProtectedRoute>
                        <Home />
                    </ProtectedRoute>
                } />
                
                <Route path="/Explore" element={
                    <ProtectedRoute>
                        <Explore />
                    </ProtectedRoute>
                } />
                
                <Route path="/ProductDetail" element={
                    <ProtectedRoute>
                        <ProductDetail />
                    </ProtectedRoute>
                } />
                
                <Route path="/Messages" element={
                    <ProtectedRoute>
                        <Messages />
                    </ProtectedRoute>
                } />
                
                <Route path="/Profile" element={
                    <ProtectedRoute>
                        <Profile />
                    </ProtectedRoute>
                } />
                
                <Route path="/CreateListing" element={
                    <ProtectedRoute>
                        <CreateListing />
                    </ProtectedRoute>
                } />
                
                <Route path="/ListingForm" element={
                    <ProtectedRoute>
                        <ListingForm />
                    </ProtectedRoute>
                } />
                
                <Route path="/UserProfile" element={
                    <ProtectedRoute>
                        <UserProfile />
                    </ProtectedRoute>
                } />
                
                <Route path="/AccountSettings" element={
                    <ProtectedRoute>
                        <AccountSettings />
                    </ProtectedRoute>
                } />
                
                <Route path="/InterestsAndSizes" element={
                    <ProtectedRoute>
                        <InterestsAndSizes />
                    </ProtectedRoute>
                } />
                
                <Route path="/Preferences" element={
                    <ProtectedRoute>
                        <Preferences />
                    </ProtectedRoute>
                } />
                
                <Route path="/BoostItem" element={
                    <ProtectedRoute>
                        <BoostItem />
                    </ProtectedRoute>
                } />
                
                <Route path="/SoldItemIssues" element={
                    <ProtectedRoute>
                        <SoldItemIssues />
                    </ProtectedRoute>
                } />
                
                <Route path="/MakeRequest" element={
                    <ProtectedRoute>
                        <MakeRequest />
                    </ProtectedRoute>
                } />
                
                <Route path="/Payouts" element={
                    <ProtectedRoute>
                        <Payouts />
                    </ProtectedRoute>
                } />
                
                <Route path="/ManageTags" element={
                    <ProtectedRoute>
                        <ManageTags />
                    </ProtectedRoute>
                } />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}