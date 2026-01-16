import Q_CODES from '../assets/q_codes.json';

// --- DATE HELPERS ---
export const toRawDate = (dateStr) => {
  if (!dateStr) return 'PERM';
  const clean = dateStr.replace(/[^0-9]/g, '');
  return clean.length >= 12 ? clean.substring(2, 12) : clean.substring(0, 10);
};

export const formatDate = (rawDate) => {
  if (!rawDate) return 'PERM';
  const cleanDate = rawDate.substring(0, 10);
  if (!/^\d{10}$/.test(cleanDate)) return rawDate;
  
  const year = "20" + cleanDate.substring(0, 2);
  const monthNum = parseInt(cleanDate.substring(2, 4));
  const day = cleanDate.substring(4, 6);
  const hour = cleanDate.substring(6, 8);
  const min = cleanDate.substring(8, 10);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  return `${day}-${months[monthNum - 1] || "UNK"}-${year} ${hour}:${min}Z`;
};

// --- DECODERS ---
export const decodeQCode = (qString) => {
  if (!qString || qString.length < 5) return "GENERAL NOTICE";
  const sub = Q_CODES.subjects?.[qString.substring(1, 3)] || "UNKNOWN";
  const con = Q_CODES.conditions?.[qString.substring(3, 5)] || "CONDITION";
  return `${sub} • ${con}`;
};

export const getPriority = (notam) => {
  const code = notam.q_data?.code || "";
  if (code.includes("LC") || code.includes("RP") || code.includes("RD")) return 3; 
  if (code.includes("OB") || code.includes("EW") || code.includes("AS") || code.includes("WA")) return 2; 
  return 1; 
};

// --- GEOSPATIAL ---
export const parseCoordinates = (coordString) => {
  if (!coordString || coordString.length < 11) return null;
  try {
    const latDeg = parseInt(coordString.substring(0, 2));
    const latMin = parseInt(coordString.substring(2, 4));
    const latDir = coordString.substring(4, 5);
    let lat = latDeg + (latMin / 60);
    if (latDir === 'S') lat = lat * -1;
    
    const lonDeg = parseInt(coordString.substring(5, 8));
    const lonMin = parseInt(coordString.substring(8, 10));
    const lonDir = coordString.substring(10, 11);
    let lon = lonDeg + (lonMin / 60);
    if (lonDir === 'W') lon = lon * -1;
    
    return [lat, lon];
  } catch (e) { return null; }
};

export const parseRadius = (radiusStr) => {
  const r = parseInt(radiusStr);
  return isNaN(r) ? 1852 : r * 1852; 
};

// --- RAW TEXT RECONSTRUCTION ---
export const reconstructRawICAO = (n) => {
  if (n.raw_text && n.raw_text.length > 50) return n.raw_text;
  
  const fir = n.q_data?.fir || "XXXX";
  const qCode = n.q_data?.code || "QXXXX";
  const coords = n.q_data?.coords || "0000N00000W";
  const rad = n.q_data?.radius ? `${n.q_data.radius}`.padStart(3, '0') : "005";
  const lower = n.q_data?.lower || "000";
  const upper = n.q_data?.upper || "999";
  
  const line1 = `(${n.notam_id} NOTAMN`; 
  const lineQ = `Q) ${fir}/${qCode}/IV/BO /E /${lower}/${upper}/${coords}${rad}`;
  const lineA = `A) ${fir}`;
  const lineB = `B) ${toRawDate(n.start_date)}`; 
  const lineC = `C) ${toRawDate(n.end_date)}`;
  const lineE = `E) ${n.raw_text || "TEXT MISSING"}`;
  
  return `${line1}\n${lineQ}\n${lineA} ${lineB} ${lineC}\n${lineE})`;
};

// --- STATS ENGINE (UPDATED) ---
export const calculateStats = (data) => {
  // Added 'obstacles' to the stats object
  let s = { closed: 0, unserviceable: 0, restricted: 0, wip: 0, obstacles: 0 };
  let c = { runways: 0, taxiways: 0, aprons: 0, lighting: 0, nav: 0, other: 0 };
  
  data.forEach(n => {
    const qCode = (n.q_data?.code || "QXXXX").toUpperCase();
    const subject = qCode.substring(1, 3);   // e.g., MR
    const condition = qCode.substring(3, 5); // e.g., LC
    
    // --- STATUS COUNTERS ---
    
    // CLOSED: LC (Closed), CC (Closed)
    if (condition === 'LC' || condition === 'CC') {
        s.closed++;
    }
    
    // UNSERVICEABLE: AS (Unserviceable), AU (Not Available)
    else if (condition === 'AS' || condition === 'AU') {
        s.unserviceable++;
    }
    
    // RESTRICTED: RT, RP, RR
    else if (condition === 'RT' || condition === 'RP' || condition === 'RR') {
        s.restricted++;
    }
    
    // WIP: EW (Work), WZ (Work Zone), MA (Maintenance), HW (Work in Progress - FIX ADDED HERE)
    else if (condition === 'EW' || condition === 'WZ' || condition === 'MA' || condition === 'HW') {
        s.wip++;
    }
    
    // OBSTACLES: Subject is OB (Obstacle), or Condition is CT (Caution), OB (Obstacle)
    else if (subject === 'OB' || condition === 'OB' || condition === 'CT') {
        s.obstacles++;
    }

    // --- CATEGORY COUNTERS ---
    if (subject === 'MR' || subject === 'RW') c.runways++;
    else if (subject === 'MX' || subject === 'TW') c.taxiways++;
    else if (subject === 'MN' || subject === 'MK' || subject === 'MP') c.aprons++;
    else if (subject.startsWith('L')) c.lighting++;
    else if (subject.startsWith('N') || subject.startsWith('I')) c.nav++;
    else c.other++;
  });
  
  return { stats: s, categories: c };
};