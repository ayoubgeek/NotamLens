import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import StatsPanel from './dashboard/StatsPanel';
import NotamCard from './dashboard/NotamCard';
import { calculateStats, getPriority } from '../utils/formatters';
import AIRPORT_CONFIG from '../assets/airports.json';

function Dashboard() {
  const { icao } = useParams();
  const navigate = useNavigate();

  // --- STATE ---
  const [notams, setNotams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Analytics State
  const [aiInsights, setAiInsights] = useState({}); 
  const [analyzingIds, setAnalyzingIds] = useState({});
  // Updated Stats State: includes 'obstacles' to match formatters.js
  const [stats, setStats] = useState({ closed: 0, unserviceable: 0, restricted: 0, wip: 0, obstacles: 0 });
  const [categories, setCategories] = useState({ runways: 0, taxiways: 0, aprons: 0, lighting: 0, nav: 0, other: 0 });
  
  // --- FILTER STATE ---
  const [priorityFilter, setPriorityFilter] = useState('ALL'); 
  const [statusFilter, setStatusFilter] = useState('ALL');     
  const [categoryFilter, setCategoryFilter] = useState('ALL'); 
  
  // UI State
  const [activeMaps, setActiveMaps] = useState({});
  const [activeRaw, setActiveRaw] = useState({}); 
  
  // Database State
  const [airportDatabase, setAirportDatabase] = useState(AIRPORT_CONFIG.firs); 
  const [airportName, setAirportName] = useState('');

  // --- EFFECT 1: Load Airport Names ---
  useEffect(() => {
    const fetchAirportData = async () => {
      try {
        const response = await fetch('https://raw.githubusercontent.com/davidmegginson/ourairports-data/main/airports.csv');
        if (!response.ok) throw new Error("Failed to fetch CSV");
        const text = await response.text();
        const db = { ...AIRPORT_CONFIG.firs }; 
        text.split('\n').forEach(line => {
          const parts = line.split(',');
          if (parts.length > 3) {
            const code = parts[1].replace(/"/g, '').trim();
            const name = parts[3].replace(/"/g, '').trim();
            if (code.length >= 4) db[code] = name;
          }
        });
        setAirportDatabase(db);
      } catch (err) { console.error("DB Error", err); }
    };
    fetchAirportData();
  }, []);

  // --- EFFECT 2: Auto-Fetch Data ---
  useEffect(() => {
    if (icao && Object.keys(airportDatabase).length > 0) {
        fetchData(icao);
    }
  }, [icao, airportDatabase]);

  // --- DATA FETCHING ---
  const fetchData = async (code) => {
    const searchCode = code.toUpperCase();
    const foundName = airportDatabase[searchCode] || searchCode;
    setAirportName(foundName);
    
    setLoading(true); 
    setError(''); 
    setNotams([]); 
    
    try {
      const response = await apiClient.get(`/search/${searchCode}`);
      const sorted = (response.data || []).sort((a, b) => getPriority(b) - getPriority(a));
      
      setNotams(sorted);
      
      const computed = calculateStats(sorted);
      setStats(computed.stats);
      setCategories(computed.categories);
      
    } catch (err) { 
      console.error(err); 
      setError(`Failed to fetch data for ${searchCode}. Is the backend running?`); 
    } finally { 
      setLoading(false); 
    }
  };

  const triggerAI = async (notamId, rawText) => {
    setAnalyzingIds(prev => ({ ...prev, [notamId]: true }));
    try {
      const response = await apiClient.post('/analyze/', { raw_text: rawText });
      setAiInsights(prev => ({ ...prev, [notamId]: response.data }));
    } catch (err) { 
      console.error("AI Failed", err); 
    } finally { 
      setAnalyzingIds(prev => ({ ...prev, [notamId]: false })); 
    }
  };

  // --- UI TOGGLES ---
  const toggleMap = (id) => setActiveMaps(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleRaw = (id) => setActiveRaw(prev => ({ ...prev, [id]: !prev[id] }));

  // --- ADVANCED FILTERING LOGIC (STRICT Q-CODE) ---
  const filteredNotams = notams.filter(n => {
    // 1. Prepare Q-Code Parts
    const qCode = (n.q_data?.code || "QXXXX").toUpperCase();
    const subject = qCode.substring(1, 3);   // e.g., MR
    const condition = qCode.substring(3, 5); // e.g., LC
    
    const p = getPriority(n);

    // 2. Priority Filter
    if (priorityFilter === 'CRITICAL' && p !== 3) return false;
    if (priorityFilter === 'WARNING' && p < 2) return false;

    // 3. Status Filter (Matches formatters.js Logic)
    if (statusFilter !== 'ALL') {
        if (statusFilter === 'CLOSED') {
            // LC = Closed, CC = Closed
            if (condition !== 'LC' && condition !== 'CC') return false;
        }
        else if (statusFilter === 'UNSERVICEABLE') {
            // AS = Unserviceable, AU = Not Available
            if (condition !== 'AS' && condition !== 'AU') return false;
        }
        else if (statusFilter === 'RESTRICTED') {
            // RT = Restricted, RP = Prohibited, RR = Reserved
            if (condition !== 'RT' && condition !== 'RP' && condition !== 'RR') return false;
        }
        else if (statusFilter === 'WIP') {
            // EW = Work, WZ = Work Zone, MA = Maintenance, HW = Work in Progress (Added HW)
            if (condition !== 'EW' && condition !== 'WZ' && condition !== 'MA' && condition !== 'HW') return false;
        }
        else if (statusFilter === 'OBSTACLES') {
            // Subject OB, or Condition OB/CT
            if (subject !== 'OB' && condition !== 'OB' && condition !== 'CT') return false;
        }
    }

    // 4. Category Filter (Matches formatters.js Logic)
    if (categoryFilter !== 'ALL') {
        if (categoryFilter === 'RUNWAYS') {
            // MR = Runway, RW = Runway
            if (subject !== 'MR' && subject !== 'RW') return false;
        }
        else if (categoryFilter === 'TAXIWAYS') {
            // MX = Taxiway, TW = Taxiway
            if (subject !== 'MX' && subject !== 'TW') return false;
        }
        else if (categoryFilter === 'APRONS') {
            // MN = Apron, MK = Parking, MP = Parking
            if (subject !== 'MN' && subject !== 'MK' && subject !== 'MP') return false;
        }
        else if (categoryFilter === 'LIGHTING') {
            // Subject starts with L (LA, LB, etc.)
            if (!subject.startsWith('L')) return false;
        }
        else if (categoryFilter === 'NAVAIDS') {
            // Subject starts with N (Nav) or I (ILS)
            if (!subject.startsWith('N') && !subject.startsWith('I')) return false;
        }
    }

    return true;
  });

  return (
    <div className="dashboard-container">
      <div className="dashboard-nav">
          <button onClick={() => navigate('/')} className="back-btn">
            <i className="fa-solid fa-arrow-left"></i> NEW SEARCH
          </button>
          <div className="nav-title">COMMANDER'S BRIEF // {icao}</div>
      </div>

      <div className="main-content">
        {loading && (
            <div className="loading-state">
                <i className="fa-solid fa-satellite-dish fa-spin"></i>
                <p>ESTABLISHING DATALINK WITH {icao}...</p>
            </div>
        )}
        
        {error && <div className="error-banner"><i className="fa-solid fa-triangle-exclamation"></i> {error}</div>}

        {!loading && !error && (
          <>
            <StatsPanel 
                airport={icao}
                airportName={airportName}
                notamsCount={notams.length}
                stats={stats}
                categories={categories}
                
                // Priority State
                priorityFilter={priorityFilter}
                setPriorityFilter={setPriorityFilter}
                
                // New Filters State
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                categoryFilter={categoryFilter}
                setCategoryFilter={setCategoryFilter}
            />

            <div className="results">
            {/* --- UPDATED NO RESULTS DESIGN --- */}
            {filteredNotams.length === 0 && (
                <div className="empty-state-card fade-in">
                    <div className="empty-icon-wrapper">
                        <i className="fa-solid fa-filter-circle-xmark"></i>
                    </div>
                    <h3>NO NOTAMS MATCH FILTERS</h3>
                    <p>Your current filter selections returned no results for this airport.</p>
                    <small>Try selecting different categories or click "ALL" to reset.</small>
                </div>
            )}
            
            {filteredNotams.map((notam, index) => (
                <NotamCard 
                key={notam.notam_id || index}
                notam={notam}
                priority={getPriority(notam)}
                aiData={aiInsights[notam.notam_id]}
                isAnalyzing={analyzingIds[notam.notam_id]}
                activeMaps={activeMaps}
                activeRaw={activeRaw}
                toggleMap={toggleMap}
                toggleRaw={toggleRaw}
                triggerAI={triggerAI}
                />
            ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Dashboard;