import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { formatDate, decodeQCode, reconstructRawICAO, parseCoordinates, parseRadius } from '../../utils/formatters';

const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function MapAutoFit({ center }) {
    const map = useMap();
    useEffect(() => {
        if (!map || !center) return;
        map.setView(center, 10, { animate: true });
    }, [center, map]);
    return null;
}

const CollapsibleText = ({ text }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    if (!text) return null;
    const isLong = text.length > 200;
    const displayText = isExpanded || !isLong ? text : text.substring(0, 200) + (isExpanded ? '' : '...');

    return (
        <div className="w-full bg-slate-900/40 rounded-[12px] border border-slate-700/50 shadow-inner overflow-hidden flex flex-col transition-all duration-300">
            <div className={`font-mono text-[14px] md:text-[15px] leading-[1.6] text-slate-200 p-[16px] break-words w-full ${!isExpanded && isLong ? 'pb-[8px]' : ''}`}>
                {displayText}
            </div>
            {isLong && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsExpanded(!isExpanded);
                    }}
                    className="flex justify-center items-center gap-2 text-blue-400 hover:text-blue-300 font-bold text-[12px] tracking-widest uppercase w-full py-[12px] bg-slate-800/40 hover:bg-slate-700/50 transition-colors border-t border-slate-700/30 outline-none"
                    aria-label={isExpanded ? "Collapse full text" : "Read full text"}
                >
                    {isExpanded ? <><i className="fa-solid fa-chevron-up"></i> SHOW LESS</> : <><i className="fa-solid fa-chevron-down"></i> READ FULL TEXT</>}
                </button>
            )}
        </div>
    );
};

const NotamCard = ({ notam, priority, aiData, isAnalyzing, activeMaps, activeRaw, toggleMap, toggleRaw, triggerAI }) => {

    const mapCoords = notam.q_data ? parseCoordinates(notam.q_data.coords) : null;
    const radiusMeters = notam.q_data ? parseRadius(notam.q_data.radius) : 1852;
    const isMapOpen = activeMaps[notam.notam_id];
    const isRawOpen = activeRaw[notam.notam_id];

    const riskColor = priority === 3 ? '#ef4444' : priority === 2 ? '#f59e0b' : '#3b82f6';

    const getRiskColor = (score) => {
        if (score >= 75) return '#ef4444';
        if (score >= 40) return '#facc15';
        return '#10b981';
    };

    // --- CHIP STYLES ---
    const chipBase = "flex items-center justify-center gap-2 px-[12px] py-[6px] rounded-[6px] text-[13px] md:text-[14px] font-mono font-medium border min-h-[36px] w-[100%] min-[480px]:w-auto text-left min-[480px]:text-center transition-colors";
    
    // Q-Code Semantic Coloring
    const condition = notam.q_data?.code?.substring(3, 5)?.toUpperCase() || '';
    let qColor = 'bg-slate-900 border-slate-700 text-slate-300'; // Default Neutral
    if (['LC', 'CC'].includes(condition)) qColor = 'bg-red-500/15 border-red-500/30 text-red-400';
    else if (['AS', 'AU'].includes(condition)) qColor = 'bg-amber-500/15 border-amber-500/30 text-amber-400';
    else if (['RT', 'RP', 'RR'].includes(condition)) qColor = 'bg-orange-500/15 border-orange-500/30 text-orange-400';
    else if (['EW', 'WZ', 'MA', 'HW'].includes(condition)) qColor = 'bg-blue-500/15 border-blue-500/30 text-blue-400';

    return (
        <div className="relative p-[16px] flex flex-col bg-slate-800 rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.15)] border border-slate-700 transition-transform w-full overflow-hidden mb-[16px] md:mb-[20px] focus-within:border-slate-500 group" style={{ borderLeft: `3px solid ${riskColor}` }}>
            
            {/* [HEADER] */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[12px] w-full pb-[12px] md:pb-[16px] mb-[12px] md:mb-[16px]">
                <div className="flex items-center gap-[12px] w-full md:w-auto">
                    {priority === 3 && <i className="fa-solid fa-triangle-exclamation text-red-500 text-[18px]"></i>}
                    <span className="font-bold text-[18px] md:text-[20px] font-mono break-all text-white">{notam.notam_id}</span>
                    <span className="flex-shrink-0 px-[12px] py-[4px] bg-slate-700/60 text-slate-300 text-[12px] font-bold rounded-full border border-slate-600 uppercase tracking-widest ml-auto sm:ml-0">
                        {priority === 3 ? "CRITICAL" : "NOTICE"}
                    </span>
                </div>
                
                {/* Desktop View Raw Button */}
                <button 
                    className={`hidden md:flex items-center justify-center gap-2 px-[16px] py-[8px] min-h-[40px] text-[13px] font-bold rounded-[8px] transition-colors border outline-none focus:ring-2 focus:ring-blue-500/50
                    ${isRawOpen ? 'bg-slate-700 text-white border-slate-500 shadow-inner' : 'bg-transparent text-slate-400 border-slate-600 hover:text-white hover:border-slate-400 hover:bg-slate-700/50'}`} 
                    onClick={() => toggleRaw(notam.notam_id)}
                >
                    <i className={`fa-solid ${isRawOpen ? 'fa-eye-slash' : 'fa-code'} opacity-80`}></i> {isRawOpen ? 'HIDE RAW NOTAM' : 'VIEW RAW NOTAM'}
                </button>
            </div>

            {/* [META] Chips */}
            {notam.q_data && (
                <div className="flex flex-wrap gap-[8px] w-full mb-[16px] md:mb-[20px]">
                    {/* FIR */}
                    <div className={`${chipBase} bg-blue-500/15 text-blue-300 border-blue-500/30`}>
                        <i className="fa-solid fa-map-pin opacity-70"></i> <span>{notam.q_data.fir}</span>
                    </div>

                    {/* FL */}
                    <div className={`${chipBase} bg-slate-900 border-slate-700 text-slate-300`}>
                        <i className="fa-solid fa-arrows-up-down opacity-50"></i>
                        <span>FL{notam.q_data.lower || "000"} - FL{notam.q_data.upper || "999"}</span>
                    </div>

                    {/* Q-Code */}
                    <div className={`${chipBase} ${qColor}`}>
                        <strong className="tracking-widest opacity-90">{notam.q_data.code}</strong>
                        <span className="opacity-50 mx-1">•</span>
                        <span className="truncate">{decodeQCode(notam.q_data.code)}</span>
                    </div>

                    {/* Coordinates + Radius + Locate */}
                    <div className={`${chipBase} bg-slate-900 border-slate-700 text-slate-300 !pr-[4px]`}>
                        <div className="flex items-center gap-2">
                            <i className="fa-solid fa-crosshairs opacity-50"></i>
                            <span>{notam.q_data.coords}</span>
                        </div>
                        <span className="opacity-50 mx-1">•</span>
                        <div className="flex items-center gap-1.5 mr-1">
                            <i className="fa-regular fa-circle opacity-50 text-[10px]"></i>
                            <span>{notam.q_data.radius} NM</span>
                        </div>
                        {mapCoords && (
                            <button 
                                className={`flex items-center justify-center min-w-[36px] min-h-[28px] rounded-[4px] ml-1 transition-colors outline-none focus:ring-2 focus:ring-blue-500 ${isMapOpen ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                                onClick={() => toggleMap(notam.notam_id)}
                                title="Toggle Map View"
                                aria-label="Toggle Map View"
                            >
                                <i className="fa-solid fa-location-dot"></i>
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Map View */}
            {isMapOpen && mapCoords && (
                <div className="w-full h-[300px] md:h-[400px] rounded-[12px] overflow-hidden border border-slate-600 shadow-inner mb-[16px] md:mb-[20px] bg-black">
                    <MapContainer center={mapCoords} zoom={11} style={{ height: '100%', width: '100%' }}>
                        <MapAutoFit center={mapCoords} />
                        <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                        <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}" />
                        <Circle center={mapCoords} radius={radiusMeters} pathOptions={{ color: riskColor, fillColor: riskColor, fillOpacity: 0.2 }} />
                        <Marker position={mapCoords} icon={customIcon}>
                            <Popup>
                                <div className="font-bold px-[12px] py-[8px] bg-slate-100 text-slate-900 rounded-t-md border-b text-[13px]">NOTAM {notam.notam_id}</div>
                                <div className="px-[12px] py-[8px] bg-white text-[13px] text-slate-800">
                                    <p className="m-0"><strong>Radius:</strong> <span className="font-mono">{notam.q_data?.radius} NM</span></p>
                                </div>
                            </Popup>
                        </Marker>
                    </MapContainer>
                </div>
            )}

            {/* [Time] Dates */}
            <div className="flex flex-col md:flex-row bg-slate-900/80 rounded-[12px] border border-slate-700/50 mb-[16px] md:mb-[20px] overflow-hidden">
                <div className="flex flex-col w-full p-[16px]">
                    <label className="text-[11px] md:text-[12px] text-slate-400 font-bold mb-[4px] tracking-[0.5px] uppercase">EFFECTIVE FROM</label>
                    <span className="font-mono font-semibold text-[15px] md:text-[16px] text-white tracking-tight">{formatDate(notam.start_date)}</span>
                </div>
                <div className="h-[1px] w-full bg-slate-700/50 md:hidden block"></div>
                <div className="hidden md:block w-[1px] bg-slate-700/50"></div>
                <div className="flex flex-col w-full p-[16px] bg-slate-800/20">
                    <label className="text-[11px] md:text-[12px] text-slate-400 font-bold mb-[4px] tracking-[0.5px] uppercase">VALID UNTIL</label>
                    <span className="font-mono font-semibold text-[15px] md:text-[16px] text-white tracking-tight">{formatDate(notam.end_date)}</span>
                </div>
            </div>

            {/* [Body] Message */}
            <div className="mb-[12px] md:mb-[16px]">
              <CollapsibleText text={notam.message || notam.raw_text} />
            </div>
            
            {/* Raw View Terminal */}
            {isRawOpen && (
                <div className="bg-[#0d1117] border border-[#30363d] border-l-[4px] border-l-slate-400 p-[16px] rounded-[12px] shadow-inner overflow-x-auto mb-[16px]">
                    <pre className="font-mono text-slate-300 text-[13px] md:text-[14px] leading-[1.6] whitespace-pre-wrap break-all m-0">{reconstructRawICAO(notam)}</pre>
                </div>
            )}

            {/* [Action] Primary Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-[12px] w-full pt-[12px] mt-auto">
                {/* Mobile View Raw Button */}
                <button 
                    className={`md:hidden w-full flex items-center justify-center gap-2 px-[24px] py-[14px] min-h-[48px] text-[14px] font-bold rounded-[8px] transition-colors border hover:text-white focus:ring focus:ring-blue-500/50 outline-none
                    ${isRawOpen ? 'bg-slate-700 text-white border-slate-500 shadow-inner' : 'bg-transparent text-slate-300 border-slate-600 hover:border-slate-400 hover:bg-slate-700/50'}`} 
                    onClick={() => toggleRaw(notam.notam_id)}
                >
                    <i className={`fa-solid ${isRawOpen ? 'fa-eye-slash' : 'fa-code'} opacity-80`}></i> {isRawOpen ? 'HIDE RAW' : 'VIEW RAW NOTAM'}
                </button>
                
                {/* AI Brief Button */}
                {!aiData ? (
                    <button 
                        className="w-full md:w-auto md:ml-auto bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/50 flex items-center justify-center gap-[10px] px-[24px] py-[14px] min-h-[48px] rounded-[8px] text-[14px] font-bold tracking-wide shadow-sm transition-all focus:ring-2 focus:ring-blue-400 focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed" 
                        onClick={() => triggerAI(notam.notam_id, notam.raw_text)} 
                        disabled={isAnalyzing}
                    >
                        {isAnalyzing ? (
                            <><i className="fa-solid fa-circle-notch fa-spin"></i> GENERATING...</>
                        ) : (
                            <><i className="fa-solid fa-robot"></i> COMMANDER'S BRIEF</>
                        )}
                    </button>
                ) : null}
            </div>

            {/* AI Results Section */}
            {aiData && (
                <div className="mt-[16px] w-full animate-[fadeIn_0.4s_ease-out]">
                    <div className="flex flex-col bg-slate-900 border border-slate-700 border-t-[3px] border-t-blue-500 rounded-[12px] overflow-hidden shadow-lg">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-[12px] p-[16px] border-b border-slate-700/80 bg-slate-800/50">
                            <div className="flex items-center gap-[10px]">
                                <i className="fa-solid fa-robot text-blue-400 text-[18px]"></i>
                                <span className="font-mono font-bold text-slate-200 tracking-wider text-[13px] md:text-[14px]">OPERATIONAL INTEL</span>
                            </div>
                            <div className="flex items-center justify-between sm:justify-start gap-[12px] bg-slate-950/50 px-[12px] py-[6px] rounded-[8px] border border-slate-700">
                                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">THREAT SCORE</span>
                                <span className="font-black text-[14px] px-[8px] py-[2px] rounded text-slate-900" style={{ backgroundColor: getRiskColor(aiData.risk_score) }}>
                                    {aiData.risk_score}/100
                                </span>
                            </div>
                        </div>

                        {/* Grid Content */}
                        <div className="flex flex-col gap-[20px] p-[20px]">
                            <div className="flex flex-col gap-[8px]">
                                <label className="text-[11px] md:text-[12px] text-slate-400 font-bold tracking-[0.5px] uppercase flex items-center gap-2"><i className="fa-solid fa-plane-slash text-slate-500"></i> IMPACT</label>
                                <div className="text-[14px] md:text-[15px] text-slate-200 leading-[1.6] bg-slate-800/30 p-[16px] rounded-[10px] border border-slate-700/50 shadow-inner">
                                    {aiData.impact || "Analyzing..."}
                                </div>
                            </div>

                            {aiData.action && (
                                <div className="flex flex-col gap-[8px]">
                                    <label className="text-[11px] md:text-[12px] text-emerald-400 font-bold tracking-[0.5px] uppercase flex items-center gap-2"><i className="fa-solid fa-check-double"></i> DIRECTIVE</label>
                                    <div className="flex items-start gap-[12px] bg-emerald-950/40 border border-emerald-500/30 p-[16px] rounded-[10px]">
                                        <i className="fa-solid fa-circle-exclamation text-emerald-500 mt-[4px]"></i>
                                        <p className="m-0 text-[14px] md:text-[15px] text-emerald-100 font-medium leading-[1.6]">{aiData.action}</p>
                                    </div>
                                </div>
                            )}

                            {/* AI Disclaimer */}
                            <div className="flex items-start gap-[10px] p-[12px] mt-[4px] bg-slate-800/50 border border-slate-700 rounded-[8px]">
                                <i className="fa-solid fa-circle-info text-slate-400 text-[12px] mt-[2px]"></i>
                                <span className="text-[11px] text-slate-400 leading-[1.5] font-medium">AI-generated advisory. Verify against official NOTAMs prior to flight.</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotamCard;