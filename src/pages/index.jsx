import Layout from "./Layout.jsx";

import BingoEvent from "./BingoEvent";

import Home from "./Home";

import CreateEvent from "./CreateEvent";

import AdminPanel from "./AdminPanel";

import UserProfile from "./UserProfile";

import PlayerStats from "./PlayerStats";

import TeamPage from "./TeamPage";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    BingoEvent: BingoEvent,
    
    Home: Home,
    
    CreateEvent: CreateEvent,
    
    AdminPanel: AdminPanel,
    
    UserProfile: UserProfile,
    
    PlayerStats: PlayerStats,
    
    TeamPage: TeamPage,
    
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
                
                    <Route path="/" element={<BingoEvent />} />
                
                
                <Route path="/BingoEvent" element={<BingoEvent />} />
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/CreateEvent" element={<CreateEvent />} />
                
                <Route path="/AdminPanel" element={<AdminPanel />} />
                
                <Route path="/UserProfile" element={<UserProfile />} />
                
                <Route path="/PlayerStats" element={<PlayerStats />} />
                
                <Route path="/TeamPage" element={<TeamPage />} />
                
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