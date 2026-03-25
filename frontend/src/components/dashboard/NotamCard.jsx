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

// --- INTERNAL COMPONENT: MAP AUTO-FIT ---
function MapAutoFit({ center }) {
    const map = useMap();
    useEffect(() => {
        if (!map || !center) return;
        map.setView(center, 10, { animate: true });
    }, [center, map]);
    return null;
}

// --- INTERNAL COMPONENT: COLLAPSIBLE TEXT (THE FIX) ---
const CollapsibleText = ({ text }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    // If text is shorter than 250 chars, just show it all.
    if (!text) return null;
    if (text.length < 250) return <div className="message-body">{text}</div>;

    return (
        <div className="message-body">
            {isExpanded ? text : text.substring(0, 250) + "..."}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                }}
                className="read-more-link"
            >
                {isExpanded ? "[ COLLAPSE ]" : "[ READ FULL TEXT ]"}
            </button>
        </div>
    );
};

const NotamCard = ({ notam, priority, aiData, isAnalyzing, activeMaps, activeRaw, toggleMap, toggleRaw, triggerAI }) => {

    const mapCoords = notam.q_data ? parseCoordinates(notam.q_data.coords) : null;
    const radiusMeters = notam.q_data ? parseRadius(notam.q_data.radius) : 1852;
    const isMapOpen = activeMaps[notam.notam_id];
    const isRawOpen = activeRaw[notam.notam_id];

    // Risk Color Logic
    const riskColor = priority === 3 ? '#ef4444' : priority === 2 ? '#f59e0b' : '#3b82f6';

    const getRiskColor = (score) => {
        if (score >= 75) return '#ef4444';
        if (score >= 40) return '#facc15';
        return '#10b981';
    };

    return (
        <div className="notam-card" style={{ borderLeft: `4px solid ${riskColor}` }}>
            {/* Header */}
            <div className="card-header">
                <div className="header-left">
                    {priority === 3 && <i className="fa-solid fa-triangle-exclamation" style={{ color: '#ef4444' }}></i>}
                    <span className="notam-id" style={{ color: riskColor }}>{notam.notam_id}</span>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="raw-toggle-btn" onClick={() => toggleRaw(notam.notam_id)}>
                        {isRawOpen ? 'HIDE RAW' : 'VIEW RAW'}
                    </button>
                    <span className="priority-badge">{priority === 3 ? "CRITICAL" : "NOTICE"}</span>
                </div>
            </div>

            {/* Q-Code Pills */}
            {notam.q_data && (
                <div className="q-bar-container">
                    <div className="q-pill blue"><i className="fa-solid fa-map-pin"></i> {notam.q_data.fir}</div>

                    {/* FLIGHT LEVEL PILL */}
                    <div className="q-pill dark">
                        <i className="fa-solid fa-ruler-vertical" style={{ color: '#94a3b8' }}></i>
                        <span>FL{notam.q_data.lower || "000"} - FL{notam.q_data.upper || "999"}</span>
                    </div>

                    <div className="q-pill dark">
                        <strong style={{ color: riskColor, marginRight: '8px' }}>{notam.q_data.code}</strong>
                        <span style={{ opacity: 0.7 }}>| {decodeQCode(notam.q_data.code)}</span>
                    </div>
                    <div className="q-pill dark">
                        <i className="fa-solid fa-crosshairs"></i> {notam.q_data.coords}
                        <span className="divider">|</span>
                        <strong style={{ color: '#facc15' }}>{notam.q_data.radius} NM</strong>
                        {mapCoords && (
                            <button className="locate-btn" onClick={() => toggleMap(notam.notam_id)}>
                                {isMapOpen ? 'CLOSE' : 'LOCATE'}
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Raw View */}
            {isRawOpen && (
                <div className="raw-terminal fade-in">
                    <pre>{reconstructRawICAO(notam)}</pre>
                </div>
            )}

            {/* Text Body */}
            <div className="dates-row">
                <div className="date-col"><label>EFFECTIVE FROM</label><span>{formatDate(notam.start_date)}</span></div>
                <div className="date-col right"><label>VALID UNTIL</label><span>{formatDate(notam.end_date)}</span></div>
            </div>

            {/* REPLACED: Use the new Collapsible Component */}
            <CollapsibleText text={notam.message || notam.raw_text} />

            {/* Map View */}
            {isMapOpen && mapCoords && (
                <div className="map-box fade-in">
                    <MapContainer center={mapCoords} zoom={13} style={{ height: '100%', width: '100%' }}>
                        <MapAutoFit center={mapCoords} />
                        <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
                        <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}" />
                        <Circle center={mapCoords} radius={radiusMeters} pathOptions={{ color: riskColor, fillColor: riskColor, fillOpacity: 0.2 }} />
                        <Marker position={mapCoords} icon={customIcon}>
                            <Popup>
                                <div className="popup-header" style={{ background: riskColor }}>NOTAM {notam.notam_id}</div>
                                <div className="popup-body">
                                    <p><strong>Radius:</strong> {notam.q_data?.radius} NM</p>
                                </div>
                            </Popup>
                        </Marker>
                    </MapContainer>
                </div>
            )}

            {/* AI Section */}
            <div className="ai-section">
                {!aiData ? (
                    <button className="ai-btn" onClick={() => triggerAI(notam.notam_id, notam.raw_text)} disabled={isAnalyzing}>
                        {isAnalyzing ? (
                            <span><i className="fa-solid fa-circle-notch fa-spin"></i> GENERATING BRIEF...</span>
                        ) : (
                            <span><i className="fa-solid fa-brain"></i> GENERATE COMMANDER'S BRIEF</span>
                        )}
                    </button>
                ) : (
                    <div className="ai-box fade-in">
                        {/* Header */}
                        <div className="ai-box-header">
                            <div className="ai-title-group">
                                <i className="fa-solid fa-robot" style={{ color: '#60a5fa' }}></i>
                                <span className="ai-label">OPERATIONAL INTELLIGENCE</span>
                            </div>
                            <div className="risk-badge-container">
                                <span className="risk-label">THREAT LEVEL</span>
                                <span className="risk-pill" style={{ backgroundColor: getRiskColor(aiData.risk_score), color: 'black' }}>
                                    {aiData.risk_score}/100
                                </span>
                            </div>
                        </div>

                        {/* Grid Content */}
                        <div className="ai-content-grid">
                            <div className="ai-row">
                                <label><i className="fa-solid fa-plane-slash"></i> OPERATIONAL IMPACT</label>
                                <div className="ai-text warning">
                                    {aiData.impact || "Analyzing operational restrictions..."}
                                </div>
                            </div>

                            {aiData.action && (
                                <div className="ai-row action-row">
                                    <label style={{ color: '#10b981' }}><i className="fa-solid fa-check-to-slot"></i> PILOT DIRECTIVE</label>
                                    <div className="action-box">
                                        <i className="fa-solid fa-circle-exclamation"></i>
                                        <p>{aiData.action}</p>
                                    </div>
                                </div>
                            )}

                            {/* AI Disclaimer */}
                            <div className="ai-disclaimer">
                                <i className="fa-solid fa-triangle-exclamation"></i>
                                <span>AI-generated analysis — advisory only. Always verify against official NOTAM sources and apply crew judgment before operational decisions.</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotamCard;