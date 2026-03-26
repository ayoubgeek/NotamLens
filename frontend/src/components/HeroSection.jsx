import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import bgImage from '../assets/cockpit-bg.png';
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
    <div className="hero-container relative min-h-[100dvh] flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="hero-bg absolute inset-0 bg-no-repeat bg-center bg-cover z-10" 
        style={{ backgroundImage: `url(${bgImage})` }}
      ></div>
      
      <div className="hero-overlay absolute inset-0 bg-gradient-to-b from-slate-900/80 to-slate-900/95 backdrop-blur-sm z-20"></div>

      <div className="hero-content relative z-30 w-full max-w-5xl mx-auto px-4 py-8 md:py-12 flex flex-col items-center justify-center gap-6 animate-[fadeInUp_0.8s_ease-out]">
        {/* Branding */}
        <div className="hero-brand flex items-center justify-center gap-3 mb-4 md:mb-8">
            <img src={logo} alt="NotamLens Logo" className="h-[48px] md:h-[60px] w-auto drop-shadow-lg" />
        </div>

        {/* Main Headline */}
        <h1 className="hero-title text-4xl md:text-5xl lg:text-6xl font-black text-center text-white leading-[1.15] tracking-tight drop-shadow-2xl">
          AVIATION INTELLIGENCE, <br className="hidden md:block"/>
          <span className="highlight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-blue-300"> SIMPLIFIED.</span>
        </h1>
        <p className="hero-subtitle text-base md:text-lg lg:text-xl text-slate-300 text-center max-w-2xl mx-auto leading-relaxed mt-2 mb-6 md:mb-10 px-2">
          Transforming raw NOTAMs into actionable operational briefings with advanced AI.
        </p>

        {/* Search Box - 2️⃣ CTA SECTION FIX */}
        <div className="hero-search-box flex flex-col md:flex-row w-full max-w-3xl mx-auto gap-3 md:gap-0 bg-slate-800/60 backdrop-blur-xl md:rounded-2xl rounded-xl p-3 md:p-2 border border-blue-500/30 shadow-2xl transition-all focus-within:border-blue-500 focus-within:shadow-[0_20px_50px_-10px_rgba(59,130,246,0.2)]">
          <div className="relative w-full flex items-center bg-slate-900/50 md:bg-transparent rounded-xl md:rounded-none">
              <i className="fa-solid fa-magnifying-glass absolute left-[24px] text-slate-400 text-[20px]"></i>
              <input
                type="text"
                className="w-full bg-transparent text-white text-lg md:text-xl font-semibold pl-[64px] pr-4 py-4 md:py-5 min-h-[56px] outline-none placeholder:text-slate-500"
                placeholder="Enter ICAO (e.g., EDDF)..."
                value={icao}
                onChange={(e) => setIcao(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                maxLength={4}
              />
          </div>
          <button 
            className="hero-search-btn w-full md:w-auto flex-shrink-0 bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 text-white font-extrabold text-sm md:text-base px-8 py-4 h-14 md:h-auto min-h-[56px] rounded-xl md:rounded-r-xl md:rounded-l-none tracking-wide shadow-lg transition-all transform hover:scale-[1.02]" 
            onClick={() => handleSearch()}
          >
            GENERATE BRIEF
          </button>
        </div>

        {/* Popular Airports */}
        <div className="w-full flex flex-col items-center mt-8 md:mt-12">
            <div className="popular-airports-label text-slate-500 font-bold tracking-[0.15em] text-xs mb-4 md:mb-6">POPULAR DESTINATIONS</div>
            <div className="hero-popular-grid grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 max-w-4xl mx-auto w-full px-2">
            {popularAirports.map((apt) => (
                <button 
                    key={apt.code} 
                    className="popular-btn w-full flex flex-col items-start gap-1 p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl backdrop-blur-md transition-all hover:bg-blue-500/20 hover:border-blue-500/50 hover:-translate-y-1 min-h-[44px]" 
                    onClick={() => handleSearch(apt.code)}
                >
                <span className="code font-mono font-bold text-lg md:text-xl text-white">{apt.code}</span>
                <span className="name text-xs text-slate-400 font-medium truncate w-full text-left">{apt.name}</span>
                </button>
            ))}
            </div>
        </div>

        {/* --- SAFETY FOOTER --- */}
        <div className="hero-footer flex flex-col items-center gap-4 mt-12 md:mt-20 pt-8 border-t border-slate-700/50 w-full max-w-2xl px-4">
            <div className="disclaimer-badge flex items-center justify-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase">
                <i className="fa-solid fa-triangle-exclamation"></i>
                <span>NOT FOR FLIGHT USE</span>
            </div>
            <p className="disclaimer-text text-xs md:text-sm text-slate-500 text-center leading-relaxed">
                This is a <strong className="text-slate-400 font-semibold">Student Demonstration Project (PFE)</strong>. 
                Data is processed by AI and may contain errors. 
                Always consult official sources (AIS/EASA/FAA) for flight planning.
            </p>
        </div>

      </div>
    </div>
  );
};

export default HeroSection;