import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HeroSection from './components/HeroSection';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          {/* Route 1: The Landing Page (Home) */}
          <Route path="/" element={<HeroSection />} />
          
          {/* Route 2: The Dashboard (Dynamic ICAO code) */}
          <Route path="/airport/:icao" element={<Dashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;