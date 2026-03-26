import React from 'react';

const StatsPanel = ({ 
    airport, 
    airportName, 
    notamsCount, 
    stats, 
    categories, 
    priorityFilter, 
    setPriorityFilter,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter
}) => {
  if (!airport) return null;

  const handleStatusClick = (status) => {
    if (statusFilter === status) {
        setStatusFilter('ALL');
    } else {
        setStatusFilter(status);
        setCategoryFilter('ALL'); 
    }
  };

  const handleCategoryClick = (category) => {
    if (categoryFilter === category) {
        setCategoryFilter('ALL');
    } else {
        setCategoryFilter(category);
        setStatusFilter('ALL'); 
    }
  };

  const handleResetAll = () => {
    setPriorityFilter('ALL');
    setStatusFilter('ALL');
    setCategoryFilter('ALL');
  };

  const isAnyFilterActive = statusFilter !== 'ALL' || categoryFilter !== 'ALL' || priorityFilter !== 'ALL';

  return (
    <div className="dashboard-section w-full mb-8 space-y-4 md:space-y-6 animate-[fadeInUp_0.4s_ease-out]">
      {/* Header Card */}
      <div className="airport-header-card bg-gradient-to-br from-blue-600 to-blue-900 rounded-2xl p-5 md:p-6 lg:p-8 text-white shadow-xl w-full">
        <div className="airport-title-row flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-black tracking-tight">{airportName || airport} Briefing</h2>
          <div className="airport-tags flex flex-wrap gap-2 md:gap-3 w-full md:w-auto">
            <span className="meta-tag bg-white/20 px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold tracking-wide">ICAO: {airport}</span>
            <span className="meta-tag bg-white/20 px-3 py-1.5 rounded-lg text-xs md:text-sm font-bold tracking-wide">ACTIVE NOTAMS: {notamsCount}</span>
          </div>
        </div>
        <p className="airport-desc text-blue-100 text-sm md:text-base leading-relaxed max-w-3xl">
          Current operational status and critical notices for {airportName || airport}. Review all items before flight.
        </p>
      </div>

      {/* CLICKABLE STAT CARDS */}
      <div className="stats-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {[
          { id: 'CLOSED', icon: 'fa-circle-xmark', label: 'CLOSED', val: stats.closed, colorClass: 'border-l-4 border-red-500 text-red-500' },
          { id: 'UNSERVICEABLE', icon: 'fa-triangle-exclamation', label: 'UNSERVICEABLE', val: stats.unserviceable, colorClass: 'border-l-4 border-orange-500 text-orange-500' },
          { id: 'RESTRICTED', icon: 'fa-ban', label: 'RESTRICTED', val: stats.restricted, colorClass: 'border-l-4 border-yellow-400 text-yellow-400' },
          { id: 'WIP', icon: 'fa-hammer', label: 'WORK IN PROG', val: stats.wip, colorClass: 'border-l-4 border-blue-500 text-blue-500' },
          { id: 'OBSTACLES', icon: 'fa-mountain-sun', label: 'OBSTACLES', val: stats.obstacles, colorClass: 'border-l-4 border-purple-500 text-purple-400 bg-purple-500/5' }
        ].map(stat => (
            <div 
                key={stat.id}
                className={`stat-card flex items-center gap-4 bg-slate-800 border border-slate-700 p-4 rounded-xl transition-all transform hover:-translate-y-1 hover:shadow-lg cursor-pointer ${stat.colorClass} ${statusFilter === stat.id ? 'ring-2 ring-white shadow-[0_0_15px_rgba(255,255,255,0.2)]' : ''}`}
                onClick={() => handleStatusClick(stat.id)}
            >
                <div className="stat-icon text-2xl opacity-90"><i className={`fa-solid ${stat.icon}`}></i></div>
                <div className="stat-info flex flex-col">
                    <span className="stat-value text-2xl font-black text-white leading-none">{stat.val}</span>
                    <span className="stat-label text-[10px] md:text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">{stat.label}</span>
                </div>
            </div>
        ))}
      </div>

      {/* CATEGORY BAR WITH MASTER RESET BUTTON */}
      <div className="category-bar flex flex-col md:flex-row flex-wrap items-start md:items-center gap-3 bg-slate-800/80 p-3 md:p-4 rounded-xl border border-slate-700 w-full">
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {Object.entries({ RUNWAYS: [categories.runways, 'Runways'], TAXIWAYS: [categories.taxiways, 'Taxiways'], APRONS: [categories.aprons, 'Aprons'], LIGHTING: [categories.lighting, 'Lighting'], NAVAIDS: [categories.nav, 'Nav Aids'] }).map(([key, [count, label]]) => (
                <button 
                    key={key}
                    className={`cat-pill flex items-center gap-2 px-3 md:px-4 py-2 min-h-[44px] rounded-lg text-xs md:text-sm font-semibold transition-colors border ${categoryFilter === key ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.4)]' : 'bg-slate-700/50 border-white/10 text-slate-300 hover:bg-white/10'}`}
                    onClick={() => handleCategoryClick(key)}
                >
                    {label} <span className="count bg-black/30 px-2 py-0.5 rounded text-[10px] md:text-xs">{count}</span>
                </button>
            ))}
        </div>

        <div className="filter-group-right flex flex-row gap-2 w-full md:w-auto md:ml-auto mt-2 md:mt-0">
            {/* MASTER RESET BUTTON */}
            <button 
                className={`filter-btn flex-1 md:flex-none flex items-center justify-center px-4 py-2 min-h-[44px] rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${!isAnyFilterActive ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`} 
                onClick={handleResetAll}
            >
                ALL
            </button>

            <button 
                className={`filter-btn flex-1 md:flex-none flex items-center justify-center px-4 py-2 min-h-[44px] rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${priorityFilter === 'CRITICAL' ? 'bg-red-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`} 
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