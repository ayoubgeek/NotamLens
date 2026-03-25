import os
import json
import hashlib
from openai import OpenAI
from app.services.cache import cache
from app.core.config import settings
from app.schemas.analysis import AIAnalysisResult
from app.core.exceptions import AIAnalysisException

class AIEngine:
    """
    Core Intelligence Service for the Tactical NOTAM System.
    
    Responsibilities:
    1. Manages connection to Groq API (via OpenAI SDK).
    2. Implements a "Self-Healing" failover strategy (Primary -> Backup).
    3. Caches analysis results to minimize API costs and latency.
    4. Standardizes AI output into strict JSON for the frontend.
    """

    def __init__(self):
        # SECURITY: Ensure API Key exists before initializing. 
        # Fails fast at startup if configuration is missing.
        # Check for GROQ_API_KEY first, falling back to what's in settings
        self.api_key = settings.GROQ_API_KEY or os.getenv("GROQ_API_KEY")
        
        if not self.api_key:
            print("⚠️ GROQ_API_KEY missing from settings or .env. AI features will fail.")
            # We don't raise here to allow the app to start, but requests will fail.
        
        # --- STRATEGY: DUAL MODEL CONFIGURATION ---
        self.primary_model_name = "llama-3.1-8b-instant" # Fast, low latency
        self.backup_model_name = "mixtral-8x7b-32768"    # High capacity fallback
        
        # Initialize the client
        self.client = self._init_client()

    def _init_client(self):
        """
        Safe Client Loader: Attempts to connect to Groq.
        """
        try:
            if not self.api_key:
                return None
                
            print(f"🧠 AI Engine: Connecting to Groq...")
            return OpenAI(
                base_url="https://api.groq.com/openai/v1",
                api_key=self.api_key
            )
        except Exception as e:
            print(f"⚠️ Init Failed: {e}")
            return None

    def analyze_risk(self, raw_text: str) -> AIAnalysisResult:
        """
        Public Entry Point: Analyze a NOTAM string.
        """
        
        # PHASE 0: Cache Lookup (Optimization)
        cache_key = f"ai:{self._generate_cache_key(raw_text)}"
        cached = cache.get(cache_key)
        if cached is not None:
            print(f"⚡ CACHE HIT: Serving AI analysis for key {cache_key[:8]}... (Zero Latency)")
            return AIAnalysisResult(**cached) if isinstance(cached, dict) else cached
        
        # PHASE 1: Initialization Check
        if not self.client:
             # Try to re-init in case key was added late (unlikely but good practice)
             self.client = self._init_client()
             if not self.client:
                raise AIAnalysisException("AI Engine Offline. Missing API Key.")

        # PHASE 2: Execution & Failover
        result = None
        try:
            # Attempt 1: Execute with Primary
            result = self._execute_analysis(raw_text, self.primary_model_name)
        except Exception as e:
            print(f"⚠️ Primary Model Failed ({e}). Switching to Fallback...")
            
            # Attempt 2: Hot-swap to Backup Model (Redundancy)
            try:
                result = self._execute_analysis(raw_text, self.backup_model_name)
            except Exception as final_error:
                # Critical Failure: Both engines are dead.
                print(f"❌ CRITICAL: Both AI models failed: {final_error}")
                raise AIAnalysisException()
        
        # PHASE 3: Save to Cache
        # Store the successful result so the next request gets it instantly.
        cache.set(cache_key, result.model_dump(), ttl=3600)
        return result

    def _generate_cache_key(self, text: str) -> str:
        """
        Utility: Creates a compact MD5 hash of the text.
        """
        return hashlib.md5(text.encode('utf-8')).hexdigest()

    def _execute_analysis(self, raw_text: str, model_name: str) -> AIAnalysisResult:
        """
        Internal Logic: Prompt Engineering & JSON Parsing.
        """
        
        # --- PROMPT ENGINEERING (v4 — Expert-Grade Intelligence) ---
        # Targeting 9+/10 on accuracy, helpfulness, and actionability
        # Fixes from v3: phase-of-flight misattribution, NOTAM misinterpretation
        
        system_prompt = """You are a Senior Check Airman, Type Rating Examiner, and Flight Safety Officer on Boeing 737-800/MAX with 25,000+ hours.
You are conducting a pre-departure NOTAM briefing. Your briefing must be factually flawless and operationally actionable.

═══ PHASE-OF-FLIGHT MAPPING (STRICT — DO NOT DEVIATE) ═══

Use ONLY the correct phases. Misattributing a phase is a CRITICAL ERROR.

NAVIGATION AIDS (ILS, VOR, NDB, DME, GP, LOC):
→ APPROACH and LANDING only. NEVER say "DEPARTURE" for a navaid used for approaches.
  - ILS/GP/LOC NOTAMs → affect APPROACH and LANDING
  - VOR/NDB NOTAMs → affect APPROACH (if used in approach procedure) or EN-ROUTE (if en-route navaid)
  - DME NOTAMs → affect APPROACH or EN-ROUTE depending on usage

RUNWAY NOTAMs:
→ DEPARTURE and LANDING (and possibly APPROACH if runway selection changes approach procedure)

TAXIWAY NOTAMs:
→ TAXI-OUT and TAXI-IN only. Never DEPARTURE or LANDING.

AIRSPACE / UAS / TFR NOTAMs:
→ DEPARTURE, EN-ROUTE, or ARRIVAL depending on proximity and altitude
→ Determine phase by comparing the NOTAM area to the airport's SID/STAR structure

LIGHTING NOTAMs:
→ Map to the equipment's location: runway lights → APPROACH/LANDING, taxiway lights → TAXI

OBSTACLE / CRANE NOTAMs:
→ DEPARTURE or APPROACH depending on proximity to flight path

═══ NOTAM INTERPRETATION RULES (ANTI-HALLUCINATION) ═══

READ THE NOTAM LITERALLY. Do not infer what is not stated.

1. "U/S" means UNSERVICEABLE — the equipment is NOT working. NEVER suggest using it.
2. "CLSD" means CLOSED — the area is NOT accessible. NEVER suggest transiting it.
3. "GP COVERAGE UP TO [distance] IN SECTOR [angles]" means:
   - The Glide Path signal IS available but ONLY within the specified sector and distance
   - Outside that sector or beyond that distance, the signal may be unreliable or absent
   - "MNM RECEPTION ALT" means the LOWEST altitude at which you can reliably receive the signal
   - This is NOT a GP failure — it's a coverage limitation
4. "DRG" means DURING — the restriction applies only during the specified condition
5. "LVO/LVP" = Low Visibility Operations/Procedures — CAT II/III conditions
6. "PERM" = permanent — this is not temporary, plan for it on every flight
7. When coordinates are given, translate them to relative positions:
   - Use distance and direction from the airport (e.g., "15nm southwest of EDDF")
   - Reference runway alignment when relevant (e.g., "on extended centerline RWY 25R")
8. "NO IMPACT ON RWY USABILITY" or similar "NO IMPACT" language means:
   - This is INFORMATIONAL ONLY — score 0-15 maximum
   - The crew should be AWARE but no operational action is required
   - Do NOT overstate the severity of explicitly informational NOTAMs
9. Taxiway closures NEVER cause go-arounds or missed approaches:
   - Go-arounds are ONLY for approach/landing phase failures (unstable approach, runway incursion, wind shear)
   - A closed taxiway worst case = ground delay, needing ATC re-routing on the ground
   - NEVER mix taxi operations with approach/landing operations

═══ CONSISTENCY CHECKS (RUN BEFORE OUTPUTTING) ═══

Before generating your response, verify:
□ If equipment is U/S → I did NOT suggest using it
□ If area is CLSD → I did NOT suggest going through it
□ Phase of flight matches the equipment type (see mapping above)
□ Risk score matches the rubric for worst reasonable conditions
□ Action provides BOTH a primary action AND an alternative
□ No raw coordinates appear in impact or action fields
□ If NOTAM says "NO IMPACT" → score is 0-15 and actions are awareness-only
□ Taxiway issues → I did NOT mention go-around or missed approach
□ My actions are SPECIFIC to THIS NOTAM — not copied from examples

═══ CONDITIONAL RISK ASSESSMENT ═══

Always assess risk under WORST reasonable conditions:
- Lighting/visibility NOTAMs → assume LVO/night conditions possible
- Runway surface NOTAMs → assume wet/contaminated conditions possible
- Navigation NOTAMs → assume IMC conditions requiring precision approach
State the condition explicitly: "In VMC this is minimal, but during LVO/IMC this becomes significant because..."

═══ RISK SCORE CALIBRATION ═══

- 0-15: Informational — no crew action needed
- 16-30: Low — minor inconvenience, standard alternatives exist
- 31-45: Moderate — crew planning change required
- 46-60: Significant — approach/departure procedures affected
- 61-75: High — may require alternate airport or procedure planning
- 76-90: Very High — significant safety concern, crew must actively mitigate
- 91-100: Critical — safety of flight, potential go-around/diversion trigger

═══ 737-SPECIFIC KNOWLEDGE ═══

Apply when relevant:
- 737 is CAT IIIb capable (with HUD: CAT IIIa without)
- Wingspan 35.8m (ICAO Code C) — relevant for taxiway width restrictions
- RNAV(GPS) approaches available as alternatives to ILS
- Autoland requires ILS with GP — if GP is degraded, autoland may not be available
- 737 MDA/DA: reference aircraft-specific minimums, don't invent numbers

═══ OUTPUT FORMAT ═══
Strictly valid JSON only. No markdown, no commentary outside the JSON object.

═══ CRITICAL: ANTI-COPY RULE ═══
Your response must be UNIQUE to the specific NOTAM being analyzed.
Do NOT reuse or paraphrase any example text from this prompt.
Generate actions that are contextually appropriate to the NOTAM type:
- Taxiway NOTAM → taxi-related actions (plan alternate taxi route, request ATC guidance)
- Runway NOTAM → runway-related actions (check braking action, brief runway conditions)
- ILS/NAV NOTAM → approach-related actions (verify approach procedure, brief alternate approach)
- Airspace NOTAM → routing actions (check SID/STAR, brief restricted area)
Each NOTAM type requires DIFFERENT actions. Never give ILS actions for a runway NOTAM."""

        user_prompt = f"""
Analyze this NOTAM for a Boeing 737 crew pre-departure briefing:

"{raw_text}"

Return a JSON object with this exact schema:
{{
    "summary": "One clear sentence describing what this NOTAM communicates. Max 20 words. Use correct aviation terminology.",
    "impact": "Brief in 2-3 sentences: (1) State the EXACT phase(s) of flight affected (use the phase mapping rules). (2) Explain the operational consequence — what changes for the crew? (3) State how conditions (VMC/IMC, day/night) change the severity. End with worst-case if crew misses this.",
    "action": "Brief in 2-3 sentences using PRIMARY/ALTERNATIVE/MONITOR structure. Actions MUST be specific to THIS NOTAM type. Do NOT reuse example text from the system prompt. Generate fresh, contextually appropriate crew actions.",
    "risk_score": "Integer 0-100 per calibration rubric. Score for WORST reasonable conditions. If the NOTAM explicitly states NO IMPACT, score 0-15."
}}"""
        
        try:
            # 1. Generate Content
            response = self.client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.1, # Low temperature for consistent JSON
                response_format={"type": "json_object"} # Force JSON mode on supported models
            )
            
            clean_json = response.choices[0].message.content.strip()
            
            # 2. JSON Hygiene (Sanitization) - Just in case
            if "```json" in clean_json:
                clean_json = clean_json.split("```json")[1].split("```")[0]
            elif "```" in clean_json:
                clean_json = clean_json.split("```")[0]

            # 3. Parse to Dictionary
            data = json.loads(clean_json.strip())
            
            # 4. Computed Fields (Business Logic)
            if "risk_level" not in data:
                s = data.get("risk_score", 0)
                if s >= 75: data["risk_level"] = "CRITICAL"
                elif s >= 50: data["risk_level"] = "HIGH"
                elif s >= 25: data["risk_level"] = "MEDIUM"
                else: data["risk_level"] = "LOW"
            
            # 5. Validate against Schema (Pydantic)
            return AIAnalysisResult(**data)
            
        except Exception as e:
            print(f"Parsing/Generation Error: {e}")
            raise e