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
    <div className="w-full mb-[32px] md:mb-[40px] animate-[fadeInUp_0.4s_ease-out]">
      {/* Header Card */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-[16px] p-[20px] md:p-[24px] text-white shadow-md w-full mb-[24px]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-[16px] mb-[12px]">
          <h2 className="text-[28px] md:text-[32px] font-black tracking-tight leading-none">{airportName || airport} Briefing</h2>
          <div className="flex flex-wrap items-center gap-[8px] md:gap-[12px] w-full md:w-auto">
            <span className="bg-slate-700/50 border border-slate-600 px-[12px] py-[6px] rounded-[6px] text-[12px] md:text-[13px] font-mono font-bold tracking-wide">ICAO: {airport}</span>
            <span className="bg-blue-600/20 text-blue-300 border border-blue-500/30 px-[12px] py-[6px] rounded-[6px] text-[12px] md:text-[13px] font-mono font-bold tracking-wide">NOTAMS: {notamsCount}</span>
          </div>
        </div>
        <p className="text-slate-400 text-[14px] md:text-[15px] leading-relaxed max-w-3xl m-0">
          Review operational status and critical notices before dispatch.
        </p>
      </div>

      {/* FILTER TOP BAR: ALL / CRITICAL - Pinned for visibility */}
      <div className="flex flex-col md:flex-row flex-wrap items-center justify-between gap-[16px] bg-slate-800 p-[16px] rounded-[16px] border border-slate-700 w-full shadow-sm mb-[24px]">
        <div className="flex flex-nowrap w-full md:w-auto gap-[8px]">
            <button 
                className={`flex-1 md:flex-none flex items-center justify-center px-[20px] py-[10px] min-h-[44px] rounded-[8px] text-[13px] font-bold uppercase tracking-wider transition-colors outline-none focus:ring-2 focus:ring-white/20 ${!isAnyFilterActive ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-700 border border-slate-600 text-slate-300 hover:bg-slate-600 hover:text-white'}`} 
                onClick={handleResetAll}
            >
                ALL NOTAMS
            </button>
            <button 
                className={`flex-1 md:flex-none flex items-center justify-center px-[20px] py-[10px] min-h-[44px] rounded-[8px] text-[13px] font-bold uppercase tracking-wider transition-colors outline-none focus:ring-2 focus:ring-red-500/50 ${priorityFilter === 'CRITICAL' ? 'bg-red-600 text-white shadow-md border border-red-500' : 'bg-slate-700 border border-slate-600 text-slate-300 hover:bg-slate-600 hover:text-white'}`} 
                onClick={() => setPriorityFilter(priorityFilter === 'CRITICAL' ? 'ALL' : 'CRITICAL')}
            >
                <i className="fa-solid fa-triangle-exclamation mr-2"></i> CRITICAL
            </button>
        </div>

        {/* Category Pills (Wrapping nicely) */}
        <div className="flex flex-wrap items-center gap-[8px] w-full md:w-auto ml-0 md:ml-auto">
            {Object.entries({ RUNWAYS: [categories.runways, 'Runways'], TAXIWAYS: [categories.taxiways, 'Taxiways'], APRONS: [categories.aprons, 'Aprons'], LIGHTING: [categories.lighting, 'Lighting'], NAVAIDS: [categories.nav, 'Nav Aids'] }).map(([key, [count, label]]) => (
                <button 
                    key={key}
                    className={`flex items-center justify-center gap-[6px] px-[12px] py-[8px] min-h-[44px] rounded-[8px] text-[13px] font-semibold transition-colors border outline-none focus:ring-2 focus:ring-blue-500/50 flex-grow sm:flex-grow-0
                    ${categoryFilter === key ? 'bg-blue-600 border-blue-500 text-white shadow-md' : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'}`}
                    onClick={() => handleCategoryClick(key)}
                >
                    {label} <span className="flex items-center justify-center min-w-[20px] h-[20px] bg-black/40 rounded-[4px] text-[11px] font-mono leading-none">{count}</span>
                </button>
            ))}
        </div>
      </div>

      {/* CLICKABLE STAT CARDS */}
      <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-[12px] ml-[4px]">Status Overview</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-[12px] md:gap-[16px]">
        {[
          { id: 'CLOSED', icon: 'fa-circle-xmark', label: 'CLOSED', val: stats.closed, colorClass: 'border-l-[4px] border-red-500 text-red-500' },
          { id: 'UNSERVICEABLE', icon: 'fa-triangle-exclamation', label: 'INOP', val: stats.unserviceable, colorClass: 'border-l-[4px] border-amber-500 text-amber-500' },
          { id: 'RESTRICTED', icon: 'fa-ban', label: 'RESTRICTED', val: stats.restricted, colorClass: 'border-l-[4px] border-orange-400 text-orange-400' },
          { id: 'WIP', icon: 'fa-hammer', label: 'WORKS', val: stats.wip, colorClass: 'border-l-[4px] border-blue-500 text-blue-500' },
          { id: 'OBSTACLES', icon: 'fa-mountain-sun', label: 'OBSTACLES', val: stats.obstacles, colorClass: 'border-l-[4px] border-purple-400 text-purple-400 bg-purple-500/5' }
        ].map(stat => (
            <button 
                key={stat.id}
                className={`flex flex-col sm:flex-row items-center sm:items-center justify-center sm:justify-start gap-[12px] bg-slate-800 border border-slate-700 p-[16px] rounded-[12px] transition-all transform hover:-translate-y-[2px] hover:bg-slate-700 hover:shadow-lg cursor-pointer outline-none focus:ring-2 focus:ring-blue-500 h-full w-full ${stat.colorClass} ${statusFilter === stat.id ? 'ring-2 ring-white bg-slate-700 shadow-md' : ''}`}
                onClick={() => handleStatusClick(stat.id)}
                aria-label={`Filter by ${stat.label}`}
                aria-pressed={statusFilter === stat.id}
            >
                <div className="text-[24px] sm:text-[28px] opacity-90"><i className={`fa-solid ${stat.icon}`}></i></div>
                <div className="flex flex-col items-center sm:items-start">
                    <span className="text-[24px] sm:text-[26px] font-black text-white leading-none whitespace-nowrap">{stat.val}</span>
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 mt-[4px] uppercase tracking-wider">{stat.label}</span>
                </div>
            </button>
        ))}
      </div>
    </div>
  );
};

export default StatsPanel;