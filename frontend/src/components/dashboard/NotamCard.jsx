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
    if (text.length < 250) return <div className="message-body text-sm md:text-base font-mono text-slate-200 leading-relaxed bg-slate-900/40 p-4 rounded-xl border border-slate-700/50 break-words w-full">{text}</div>;

    return (
        <div className="message-body text-sm md:text-base font-mono text-slate-200 leading-relaxed bg-slate-900/40 p-4 rounded-xl border border-slate-700/50 break-words w-full">
            {isExpanded ? text : text.substring(0, 250) + "..."}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                }}
                className="read-more-link flex justify-center items-center gap-2 text-blue-400 hover:text-blue-300 font-bold text-xs md:text-sm mt-3 pt-3 border-t border-slate-700/50 w-full min-h-[44px] transition-colors"
            >
                {isExpanded ? <><i className="fa-solid fa-chevron-up"></i> [ COLLAPSE ]</> : <><i className="fa-solid fa-chevron-down"></i> [ READ FULL TEXT ]</>}
            </button>
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

    return (
        <div className="notam-card relative p-4 md:p-6 flex flex-col space-y-3 md:space-y-4 bg-slate-800/90 rounded-2xl shadow-lg border border-slate-700 transition-transform w-full overflow-hidden mb-6" style={{ borderLeft: `5px solid ${riskColor}` }}>
            
            {/* [Header] */}
            <div className="card-header flex flex-col md:flex-row md:items-center justify-between gap-3 w-full border-b border-slate-700/50 pb-3">
                <div className="header-left flex items-start md:items-center gap-2 md:gap-3 w-full md:w-auto">
                    {priority === 3 && <i className="fa-solid fa-triangle-exclamation text-red-500 text-lg md:text-xl mt-1 md:mt-0"></i>}
                    <span className="notam-id font-mono font-black text-lg md:text-xl lg:text-2xl break-all" style={{ color: riskColor }}>{notam.notam_id}</span>
                </div>
                <span className="priority-badge w-fit px-3 py-1 bg-slate-700/80 text-slate-300 text-[10px] md:text-xs font-black rounded border border-slate-600 uppercase tracking-widest align-self-start">
                    {priority === 3 ? "CRITICAL" : "NOTICE"}
                </span>
            </div>

            {/* [Meta] Q-Code Pills */}
            {notam.q_data && (
                <div className="q-bar-container flex flex-wrap gap-2 items-center w-full">
                    <div className="q-pill blue flex items-center justify-center gap-2 px-3 py-1.5 bg-blue-500/15 text-blue-400 border border-blue-500/20 rounded-lg text-xs md:text-sm font-mono font-semibold min-h-[36px]">
                        <i className="fa-solid fa-map-pin opacity-70"></i> {notam.q_data.fir}
                    </div>
                    <div className="q-pill dark flex items-center justify-center gap-2 px-3 py-1.5 bg-slate-900/60 border border-slate-700 text-slate-300 rounded-lg text-xs md:text-sm font-mono font-medium min-h-[36px]">
                        <i className="fa-solid fa-ruler-vertical text-slate-500"></i>
                        <span>FL{notam.q_data.lower || "000"} - FL{notam.q_data.upper || "999"}</span>
                    </div>
                    <div className="q-pill dark flex items-center justify-center gap-2 px-3 py-1.5 bg-slate-900/60 border border-slate-700 text-slate-300 rounded-lg text-xs md:text-sm font-mono font-medium min-h-[36px]">
                        <strong style={{ color: riskColor }}>{notam.q_data.code}</strong>
                        <span className="opacity-70 truncate max-w-[200px]">{decodeQCode(notam.q_data.code)}</span>
                    </div>
                </div>
            )}

            {/* [Details] Coordinates & Radius */}
            {notam.q_data && (
                <div className="details-container flex flex-col md:flex-row md:items-center justify-between gap-3 w-full bg-slate-900/30 p-3 rounded-xl border border-slate-700/30">
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto text-xs md:text-sm font-mono text-slate-300">
                        <div className="flex items-center gap-2 bg-black/20 px-2 py-1 rounded">
                            <i className="fa-solid fa-crosshairs text-slate-500"></i> {notam.q_data.coords}
                        </div>
                        <div className="flex items-center gap-2 bg-black/20 px-2 py-1 rounded">
                            <i className="fa-solid fa-circle-dot text-slate-500"></i> <strong className="text-yellow-400">{notam.q_data.radius} NM</strong>
                        </div>
                    </div>
                    {mapCoords && (
                        <button 
                            className="locate-btn w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 min-h-[44px] bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-colors border border-blue-500 shadow-md" 
                            onClick={() => toggleMap(notam.notam_id)}
                        >
                            <i className={`fa-solid ${isMapOpen ? 'fa-map-location-dot' : 'fa-location-dot'}`}></i> {isMapOpen ? 'CLOSE MAP' : 'LOCATE ON MAP'}
                        </button>
                    )}
                </div>
            )}

            {/* Map View */}
            {isMapOpen && mapCoords && (
                <div className="map-box w-full h-[300px] md:h-[400px] lg:h-[450px] rounded-xl overflow-hidden border-2 border-slate-600 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] mt-2 animate-[fadeIn_0.3s_ease-out] z-10 bg-black">
                    <MapContainer center={mapCoords} zoom={11} style={{ height: '100%', width: '100%' }}>
                        <MapAutoFit center={mapCoords} />
                        <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                        <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}" />
                        <Circle center={mapCoords} radius={radiusMeters} pathOptions={{ color: riskColor, fillColor: riskColor, fillOpacity: 0.2 }} />
                        <Marker position={mapCoords} icon={customIcon}>
                            <Popup>
                                <div className="popup-header font-bold px-3 py-2 bg-slate-100 text-slate-900 rounded-t-md border-b">NOTAM {notam.notam_id}</div>
                                <div className="popup-body px-3 py-2 bg-white text-sm text-slate-800">
                                    <p className="m-0"><strong>Radius:</strong> <span className="font-mono">{notam.q_data?.radius} NM</span></p>
                                </div>
                            </Popup>
                        </Marker>
                    </MapContainer>
                </div>
            )}

            {/* [Time] Dates */}
            <div className="dates-row flex flex-col md:flex-row justify-between gap-4 md:gap-8 bg-slate-900/60 p-4 rounded-xl border border-slate-700/50">
                <div className="date-col flex flex-col w-full">
                    <label className="text-[10px] md:text-xs text-slate-400 font-bold mb-1.5 tracking-widest uppercase">EFFECTIVE FROM</label>
                    <span className="font-mono font-medium text-white text-sm md:text-base bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-700/30">{formatDate(notam.start_date)}</span>
                </div>
                <div className="date-col flex flex-col w-full md:text-right">
                    <label className="text-[10px] md:text-xs text-slate-400 font-bold mb-1.5 tracking-widest uppercase">VALID UNTIL</label>
                    <span className="font-mono font-medium text-white text-sm md:text-base bg-slate-800/80 px-3 py-2 rounded-lg border border-slate-700/30">{formatDate(notam.end_date)}</span>
                </div>
            </div>

            {/* Message Body */}
            <CollapsibleText text={notam.message || notam.raw_text} />
            
            {/* Raw View */}
            {isRawOpen && (
                <div className="raw-terminal bg-[#0d1117] border border-[#30363d] border-l-4 border-l-yellow-400 p-4 rounded-xl shadow-inner overflow-x-auto animate-[fadeIn_0.3s_ease-out]">
                    <pre className="font-mono text-slate-300 text-xs md:text-sm whitespace-pre-wrap break-words m-0">{reconstructRawICAO(notam)}</pre>
                </div>
            )}

            {/* [Action] Primary Buttons */}
            <div className="actions-container flex flex-col md:flex-row gap-3 w-full pt-4 border-t border-slate-700/50 mt-2">
                <button 
                    className={`raw-toggle-btn w-full md:w-1/3 flex items-center justify-center gap-2 px-4 py-3 min-h-[48px] text-xs md:text-sm font-bold rounded-xl transition-colors border ${isRawOpen ? 'bg-slate-700 text-white border-slate-500' : 'bg-slate-800 text-slate-300 border-slate-600 hover:text-white hover:border-slate-400 hover:bg-slate-700/50'}`} 
                    onClick={() => toggleRaw(notam.notam_id)}
                >
                    <i className={`fa-solid ${isRawOpen ? 'fa-eye-slash' : 'fa-code'}`}></i> {isRawOpen ? 'HIDE RAW NOTAM' : 'VIEW RAW NOTAM'}
                </button>
                
                {!aiData ? (
                    <button 
                        className="ai-btn w-full md:w-2/3 bg-gradient-to-br from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 text-white border border-blue-400/50 flex items-center justify-center gap-2 px-4 py-3 min-h-[48px] rounded-xl text-xs md:text-sm font-bold tracking-wide shadow-lg transition-transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed" 
                        onClick={() => triggerAI(notam.notam_id, notam.raw_text)} 
                        disabled={isAnalyzing}
                    >
                        {isAnalyzing ? (
                            <><i className="fa-solid fa-circle-notch fa-spin"></i> GENERATING BRIEF...</>
                        ) : (
                            <><i className="fa-solid fa-brain"></i> GENERATE COMMANDER'S BRIEF</>
                        )}
                    </button>
                ) : null}
            </div>

            {/* AI Results Section */}
            {aiData && (
                <div className="ai-section mt-2 w-full animate-[fadeIn_0.4s_ease-out]">
                    <div className="ai-box flex flex-col bg-slate-900 border border-slate-700 border-t-4 border-t-blue-500 rounded-xl overflow-hidden shadow-xl">
                        {/* Header */}
                        <div className="ai-box-header flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-800 p-4 border-b border-slate-700">
                            <div className="ai-title-group flex items-center gap-2">
                                <i className="fa-solid fa-robot text-blue-400 text-lg"></i>
                                <span className="ai-label font-mono font-bold text-slate-300 tracking-wide text-xs md:text-sm">OPERATIONAL INTEL</span>
                            </div>
                            <div className="risk-badge-container flex items-center justify-between w-full md:w-auto gap-3 bg-slate-900/80 px-3 py-2 rounded-lg border border-slate-700">
                                <span className="risk-label text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">THREAT LEVEL</span>
                                <span className="risk-pill font-black text-xs md:text-sm px-2 py-0.5 rounded shadow text-slate-900" style={{ backgroundColor: getRiskColor(aiData.risk_score) }}>
                                    {aiData.risk_score}/100
                                </span>
                            </div>
                        </div>

                        {/* Grid Content */}
                        <div className="ai-content-grid flex flex-col gap-5 p-5">
                            <div className="ai-row flex flex-col gap-2">
                                <label className="text-[10px] md:text-xs text-slate-400 font-bold tracking-widest uppercase flex items-center gap-2"><i className="fa-solid fa-plane-slash text-slate-500"></i> OPERATIONAL IMPACT</label>
                                <div className="ai-text text-sm md:text-base text-slate-100 leading-relaxed bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                                    {aiData.impact || "Analyzing operational restrictions..."}
                                </div>
                            </div>

                            {aiData.action && (
                                <div className="ai-row action-row flex flex-col gap-2">
                                    <label className="text-[10px] md:text-xs text-emerald-400 font-bold tracking-widest uppercase flex items-center gap-2"><i className="fa-solid fa-check-to-slot"></i> PILOT DIRECTIVE</label>
                                    <div className="action-box flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl">
                                        <i className="fa-solid fa-circle-exclamation text-emerald-400 mt-1"></i>
                                        <p className="m-0 text-sm md:text-base text-emerald-100 font-medium leading-relaxed">{aiData.action}</p>
                                    </div>
                                </div>
                            )}

                            {/* AI Disclaimer */}
                            <div className="ai-disclaimer flex items-start gap-2 p-3 mt-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                                <i className="fa-solid fa-triangle-exclamation text-amber-500 text-xs mt-0.5"></i>
                                <span className="text-[10px] md:text-xs text-amber-400/80 leading-relaxed font-medium">AI-generated analysis — advisory only. Verify against official NOTAM sources before execution.</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotamCard;