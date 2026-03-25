import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import bgImage from '../assets/cockpit-bg.png'; // Ensuring the image import is kept
import logo from '../assets/logo.svg';

const HeroSection = () => {
  const [icao, setIcao] = useState('');
  const navigate = useNavigate();

  const handleSearch = (code) => {
    const targetIcao = code || icao;
    if (targetIcao && targetIcao.length === 4) {
      navigate(`/airport/${targetIcao.toUpperCase()}`);
    }
  };

  const popularAirports = [
    { code: 'EDDF', name: 'Frankfurt Intl' },
    { code: 'EGLL', name: 'London Heathrow' },
    { code: 'OMDB', name: 'Dubai Intl' },
    { code: 'KJFK', name: 'New York JFK' }
  ];

  return (
    <div className="hero-container">
      {/* Background Image */}
      <div 
        className="hero-bg" 
        style={{ backgroundImage: `url(${bgImage})` }}
      ></div>
      
      <div className="hero-overlay"></div>

      <div className="hero-content">
        {/* Branding */}
        <div className="hero-brand">
            <img src={logo} alt="NotamLens Logo" style={{ height: '60px', width: 'auto' }} />
        </div>

        {/* Main Headline */}
        <h1 className="hero-title">
          AVIATION INTELLIGENCE, <br />
          <span className="highlight">SIMPLIFIED.</span>
        </h1>
        <p className="hero-subtitle">
          Transforming raw NOTAMs into actionable operational briefings with advanced AI.
        </p>

        {/* Search Box */}
        <div className="hero-search-box">
          <i className="fa-solid fa-magnifying-glass search-icon"></i>
          <input
            type="text"
            placeholder="Enter ICAO Code (e.g., EDDF)..."
            value={icao}
            onChange={(e) => setIcao(e.target.value.toUpperCase())}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            maxLength={4}
          />
          <button className="hero-search-btn" onClick={() => handleSearch()}>
            GENERATE BRIEF
          </button>
        </div>

        {/* Popular Airports */}
        <div className="popular-airports-label">POPULAR DESTINATIONS</div>
        <div className="hero-popular-grid">
          {popularAirports.map((apt) => (
            <button key={apt.code} className="popular-btn" onClick={() => handleSearch(apt.code)}>
              <span className="code">{apt.code}</span>
              <span className="name">{apt.name}</span>
            </button>
          ))}
        </div>

        {/* --- NEW SAFETY FOOTER --- */}
        <div className="hero-footer">
            <div className="disclaimer-badge">
                <i className="fa-solid fa-triangle-exclamation"></i>
                <span>NOT FOR FLIGHT USE</span>
            </div>
            <p className="disclaimer-text">
                This is a <strong>Student Demonstration Project (PFE)</strong>. 
                Data is processed by AI and may contain errors. 
                Always consult official sources (AIS/EASA/FAA) for flight planning.
            </p>
        </div>

      </div>
    </div>
  );
};

export default HeroSection;