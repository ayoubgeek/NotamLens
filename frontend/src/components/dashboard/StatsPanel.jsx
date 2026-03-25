import React from 'react';

const StatsPanel = ({ 
    airport, 
    airportName, 
    notamsCount, 
    stats, 
    categories, 
    // Priority Props
    priorityFilter, 
    setPriorityFilter,
    // Status Filter Props
    statusFilter,
    setStatusFilter,
    // Category Filter Props
    categoryFilter,
    setCategoryFilter
}) => {
  if (!airport) return null;

  // Toggle Logic: If clicking the same filter again, turn it off (set to ALL)
  const handleStatusClick = (status) => {
    if (statusFilter === status) {
        setStatusFilter('ALL');
    } else {
        setStatusFilter(status);
        setCategoryFilter('ALL'); // Reset category to avoid conflicts
    }
  };

  const handleCategoryClick = (category) => {
    if (categoryFilter === category) {
        setCategoryFilter('ALL');
    } else {
        setCategoryFilter(category);
        setStatusFilter('ALL'); // Reset status to avoid conflicts
    }
  };

  // --- MASTER RESET FUNCTION ---
  const handleResetAll = () => {
    setPriorityFilter('ALL');
    setStatusFilter('ALL');
    setCategoryFilter('ALL');
  };

  // Check if any filter is currently active
  const isAnyFilterActive = statusFilter !== 'ALL' || categoryFilter !== 'ALL' || priorityFilter !== 'ALL';

  return (
    <div className="dashboard-section fade-in">
      <div className="airport-header-card">
        <div className="airport-title-row">
          <h2>{airportName || airport} Briefing</h2>
          <div className="airport-tags">
            <span className="meta-tag">ICAO: {airport}</span>
            <span className="meta-tag">ACTIVE NOTAMS: {notamsCount}</span>
          </div>
        </div>
        <p className="airport-desc">
          Current operational status and critical notices for {airportName || airport}. Review all items before flight.
        </p>
      </div>

      {/* CLICKABLE STAT CARDS */}
      <div className="stats-grid">
        <div 
            className={`stat-card red ${statusFilter === 'CLOSED' ? 'active-card' : ''}`}
            onClick={() => handleStatusClick('CLOSED')}
            style={{ cursor: 'pointer' }}
        >
            <div className="stat-icon"><i className="fa-solid fa-circle-xmark"></i></div>
            <div className="stat-info"><span className="stat-value">{stats.closed}</span><span className="stat-label">CLOSED</span></div>
        </div>
        
        <div 
            className={`stat-card orange ${statusFilter === 'UNSERVICEABLE' ? 'active-card' : ''}`}
            onClick={() => handleStatusClick('UNSERVICEABLE')}
            style={{ cursor: 'pointer' }}
        >
            <div className="stat-icon"><i className="fa-solid fa-triangle-exclamation"></i></div>
            <div className="stat-info"><span className="stat-value">{stats.unserviceable}</span><span className="stat-label">UNSERVICEABLE</span></div>
        </div>
        
        <div 
            className={`stat-card yellow ${statusFilter === 'RESTRICTED' ? 'active-card' : ''}`}
            onClick={() => handleStatusClick('RESTRICTED')}
            style={{ cursor: 'pointer' }}
        >
            <div className="stat-icon"><i className="fa-solid fa-ban"></i></div>
            <div className="stat-info"><span className="stat-value">{stats.restricted}</span><span className="stat-label">RESTRICTED</span></div>
        </div>
        
        <div 
            className={`stat-card blue ${statusFilter === 'WIP' ? 'active-card' : ''}`}
            onClick={() => handleStatusClick('WIP')}
            style={{ cursor: 'pointer' }}
        >
            <div className="stat-icon"><i className="fa-solid fa-hammer"></i></div>
            <div className="stat-info"><span className="stat-value">{stats.wip}</span><span className="stat-label">WORK IN PROG</span></div>
        </div>

        {/* --- NEW OBSTACLES CARD --- */}
        <div 
            className={`stat-card purple ${statusFilter === 'OBSTACLES' ? 'active-card' : ''}`}
            onClick={() => handleStatusClick('OBSTACLES')}
            style={{ cursor: 'pointer' }}
        >
            <div className="stat-icon"><i className="fa-solid fa-mountain-sun"></i></div>
            <div className="stat-info"><span className="stat-value">{stats.obstacles}</span><span className="stat-label">OBSTACLES</span></div>
        </div>
      </div>

      {/* CATEGORY BAR WITH MASTER RESET BUTTON */}
      <div className="category-bar">
        <button 
            className={`cat-pill ${categoryFilter === 'RUNWAYS' ? 'active-pill' : ''}`} 
            onClick={() => handleCategoryClick('RUNWAYS')}
        >
            Runways <span className="count">{categories.runways}</span>
        </button>

        <button 
            className={`cat-pill ${categoryFilter === 'TAXIWAYS' ? 'active-pill' : ''}`}
            onClick={() => handleCategoryClick('TAXIWAYS')}
        >
            Taxiways <span className="count">{categories.taxiways}</span>
        </button>

        <button 
            className={`cat-pill ${categoryFilter === 'APRONS' ? 'active-pill' : ''}`}
            onClick={() => handleCategoryClick('APRONS')}
        >
            Aprons <span className="count">{categories.aprons}</span>
        </button>

        <button 
            className={`cat-pill ${categoryFilter === 'LIGHTING' ? 'active-pill' : ''}`}
            onClick={() => handleCategoryClick('LIGHTING')}
        >
            Lighting <span className="count">{categories.lighting}</span>
        </button>

        <button 
            className={`cat-pill ${categoryFilter === 'NAVAIDS' ? 'active-pill' : ''}`}
            onClick={() => handleCategoryClick('NAVAIDS')}
        >
            Nav Aids <span className="count">{categories.nav}</span>
        </button>

        <div className="filter-group-right">
            {/* MASTER RESET BUTTON */}
            <button 
                className={`filter-btn ${!isAnyFilterActive ? 'active' : ''}`} 
                onClick={handleResetAll}
                title="Reset all filters"
            >
                ALL
            </button>

            <button 
                className={`filter-btn crit ${priorityFilter === 'CRITICAL' ? 'active' : ''}`} 
                onClick={() => setPriorityFilter(priorityFilter === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
            >
                CRITICAL
            </button>
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;