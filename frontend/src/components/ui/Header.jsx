import React from 'react';

const Header = ({ airport, setAirport, handleSearch, loading, popularAirports }) => {
  return (
    <div className="hero-section">
      <h1>NotamLens</h1>
      <p className="subtitle">Next-Gen Aeronautical Intelligence Engine</p>
      <div className="search-container">
        <div className="search-box">
          <input 
            type="text" 
            placeholder="ENTER ICAO (e.g. EDDF)" 
            value={airport} 
            onChange={(e) => setAirport(e.target.value.toUpperCase())} 
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()} 
          />
          <button className="search-btn" onClick={() => handleSearch()} disabled={loading}>
            {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-magnifying-glass"></i>}
          </button>
        </div>
        
        <div className="popular-airports">
          {popularAirports && popularAirports.slice(0, 6).map(code => ( 
            <div key={code} className="suggestion-card" onClick={() => handleSearch(code)}>
              <span className="icao-code">{code}</span>
              <i className="fa-solid fa-plane-up right-icon"></i>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Header;