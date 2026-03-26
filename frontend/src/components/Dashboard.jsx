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

  // state...
  const [notams, setNotams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aiInsights, setAiInsights] = useState({}); 
  const [analyzingIds, setAnalyzingIds] = useState({});
  const [stats, setStats] = useState({ closed: 0, unserviceable: 0, restricted: 0, wip: 0, obstacles: 0 });
  const [categories, setCategories] = useState({ runways: 0, taxiways: 0, aprons: 0, lighting: 0, nav: 0, other: 0 });
  const [priorityFilter, setPriorityFilter] = useState('ALL'); 
  const [statusFilter, setStatusFilter] = useState('ALL');     
  const [categoryFilter, setCategoryFilter] = useState('ALL'); 
  const [activeMaps, setActiveMaps] = useState({});
  const [activeRaw, setActiveRaw] = useState({}); 
  const [airportDatabase, setAirportDatabase] = useState(AIRPORT_CONFIG.firs); 
  const [airportName, setAirportName] = useState('');

  // effects...
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

  useEffect(() => {
    if (icao && Object.keys(airportDatabase).length > 0) {
        fetchData(icao);
    }
  }, [icao, airportDatabase]);

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

  const toggleMap = (id) => setActiveMaps(prev => ({ ...prev, [id]: !prev[id] }));
  const toggleRaw = (id) => setActiveRaw(prev => ({ ...prev, [id]: !prev[id] }));

  const filteredNotams = notams.filter(n => {
    const qCode = (n.q_data?.code || "QXXXX").toUpperCase();
    const subject = qCode.substring(1, 3);
    const condition = qCode.substring(3, 5);
    const p = getPriority(n);
    if (priorityFilter === 'CRITICAL' && p !== 3) return false;
    if (priorityFilter === 'WARNING' && p < 2) return false;
    if (statusFilter !== 'ALL') {
        if (statusFilter === 'CLOSED') { if (condition !== 'LC' && condition !== 'CC') return false; }
        else if (statusFilter === 'UNSERVICEABLE') { if (condition !== 'AS' && condition !== 'AU') return false; }
        else if (statusFilter === 'RESTRICTED') { if (condition !== 'RT' && condition !== 'RP' && condition !== 'RR') return false; }
        else if (statusFilter === 'WIP') { if (condition !== 'EW' && condition !== 'WZ' && condition !== 'MA' && condition !== 'HW') return false; }
        else if (statusFilter === 'OBSTACLES') { if (subject !== 'OB' && condition !== 'OB' && condition !== 'CT') return false; }
    }
    if (categoryFilter !== 'ALL') {
        if (categoryFilter === 'RUNWAYS') { if (subject !== 'MR' && subject !== 'RW') return false; }
        else if (categoryFilter === 'TAXIWAYS') { if (subject !== 'MX' && subject !== 'TW') return false; }
        else if (categoryFilter === 'APRONS') { if (subject !== 'MN' && subject !== 'MK' && subject !== 'MP') return false; }
        else if (categoryFilter === 'LIGHTING') { if (!subject.startsWith('L')) return false; }
        else if (categoryFilter === 'NAVAIDS') { if (!subject.startsWith('N') && !subject.startsWith('I')) return false; }
    }
    return true;
  });

  return (
    <div className="dashboard-container min-h-[100dvh] bg-slate-900 w-full overflow-x-hidden flex flex-col">
      {/* Navigation */}
      <div className="dashboard-nav w-full bg-slate-900 border-b border-slate-800 p-4 md:px-6 lg:px-8 flex items-center justify-between z-50 sticky top-0 shadow-md">
          <button onClick={() => navigate('/')} className="back-btn flex items-center justify-center gap-2 text-xs md:text-sm font-mono font-bold text-slate-400 hover:text-white px-4 min-h-[44px] rounded-lg border border-slate-700 hover:border-blue-500 bg-slate-800/50 hover:bg-blue-500/10 transition-colors">
            <i className="fa-solid fa-arrow-left"></i> <span className="hidden md:inline">NEW SEARCH</span><span className="md:hidden">BACK</span>
          </button>
          <div className="nav-title font-mono font-bold text-white text-xs md:text-sm lg:text-base tracking-widest truncate ml-4 w-full text-right md:text-left">
            COMMANDER'S BRIEF // <span className="text-blue-400">{icao}</span>
          </div>
      </div>

      <div className="main-content w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 lg:py-10 flex flex-col flex-1">
        {loading && (
            <div className="loading-state flex flex-col items-center justify-center p-12 text-slate-400 text-center w-full min-h-[300px] border border-slate-800 rounded-2xl bg-slate-800/30">
                <i className="fa-solid fa-satellite-dish fa-spin text-4xl mb-4 text-blue-500"></i>
                <p className="font-mono font-bold tracking-widest text-sm">ESTABLISHING DATALINK WITH {icao}...</p>
            </div>
        )}
        
        {error && (
            <div className="error-banner flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-500 p-4 md:p-6 rounded-xl font-bold text-sm md:text-base tracking-wide w-full shadow-lg">
                <i className="fa-solid fa-triangle-exclamation text-2xl flex-shrink-0"></i> 
                <span>{error}</span>
            </div>
        )}

        {!loading && !error && (
          <div className="w-full flex flex-col gap-6 md:gap-8">
            <StatsPanel 
                airport={icao}
                airportName={airportName}
                notamsCount={notams.length}
                stats={stats}
                categories={categories}
                priorityFilter={priorityFilter}
                setPriorityFilter={setPriorityFilter}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                categoryFilter={categoryFilter}
                setCategoryFilter={setCategoryFilter}
            />

            <div className="results w-full flex flex-col items-center justify-center gap-4">
            {/* --- UPDATED NO RESULTS DESIGN --- */}
            {filteredNotams.length === 0 && (
                <div className="empty-state-card flex flex-col items-center justify-center text-center p-8 md:p-12 lg:p-16 bg-gradient-to-b from-slate-800/60 to-slate-900/80 border border-slate-700/50 rounded-2xl shadow-xl w-full animate-[fadeInUp_0.3s_ease-out]">
                    <div className="empty-icon-wrapper text-5xl md:text-6xl text-slate-600 mb-6 drop-shadow-md">
                        <i className="fa-solid fa-filter-circle-xmark bg-clip-text text-transparent bg-gradient-to-tr from-slate-500 to-slate-400"></i>
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-2 tracking-wide">NO NOTAMS MATCH FILTERS</h3>
                    <p className="text-slate-400 text-sm md:text-base max-w-md leading-relaxed mb-6">Your current filter selections returned no results for this airport.</p>
                    <button 
                        className="px-6 py-3 min-h-[48px] bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl tracking-wider uppercase shadow-lg transition-transform hover:-translate-y-0.5" 
                        onClick={() => { setStatusFilter('ALL'); setCategoryFilter('ALL'); setPriorityFilter('ALL'); }}
                    >
                        RESET ALL FILTERS
                    </button>
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
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;