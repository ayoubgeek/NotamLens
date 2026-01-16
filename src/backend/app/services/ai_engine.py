import google.generativeai as genai
import json
import hashlib  # <--- NEW: For efficient cache keys
from cachetools import TTLCache # <--- NEW: In-memory Caching
from app.core.config import settings
from app.schemas.analysis import AIAnalysisResult
from app.core.exceptions import AIAnalysisException

class AIEngine:
    """
    Core Intelligence Service for the Tactical NOTAM System.
    
    Responsibilities:
    1. Manages connection to Google's Gemini Models.
    2. Implements a "Self-Healing" failover strategy (Primary -> Backup).
    3. Caches analysis results to minimize API costs and latency.
    4. Standardizes AI output into strict JSON for the frontend.
    """

    def __init__(self):
        # SECURITY: Ensure API Key exists before initializing. 
        # Fails fast at startup if configuration is missing.
        if not settings.GEMINI_API_KEY:
            raise ValueError("API Key missing. Cannot initialize AI Engine.")
        
        genai.configure(api_key=settings.GEMINI_API_KEY)
        
        # --- STRATEGY: DUAL MODEL CONFIGURATION ---
        # Primary: Gemini 2.0 Flash (Latest/Fastest) - Explicitly selected from available list.
        # Backup: Gemini Flash Latest (Generic Tag) - Used if specific version fails/deprecates.
        self.primary_model_name = "gemini-2.0-flash"
        self.backup_model_name = "gemini-flash-latest"
        
        # --- PERFORMANCE: IN-MEMORY CACHE ---
        # We store the results of the last 1000 analyses for 1 hour (3600s).
        # This prevents re-querying the AI for the same NOTAM text multiple times.
        self.cache = TTLCache(maxsize=1000, ttl=3600)
        
        # Initialize the primary model immediately.
        self.model = self._init_model(self.primary_model_name)

    def _init_model(self, model_name: str):
        """
        Safe Model Loader: Attempts to connect to Google Brain.
        Returns None instead of crashing, allowing the main logic to handle failovers.
        """
        try:
            print(f"🧠 AI Engine: Loading {model_name}...")
            return genai.GenerativeModel(model_name)
        except Exception as e:
            print(f"⚠️ Init Failed for {model_name}: {e}")
            return None

    def analyze_risk(self, raw_text: str) -> AIAnalysisResult:
        """
        Public Entry Point: Analyze a NOTAM string.
        
        ARCHITECTURE: SELF-HEALING FAILOVER WITH CACHING
        0. Checks Cache (Hit -> Return Instant Result).
        1. Checks if Primary Model is active.
        2. If Primary crashes/timeouts, hot-swaps to Backup Model.
        3. If both fail, raises Critical Exception.
        4. Saves result to Cache.
        """
        
        # PHASE 0: Cache Lookup (Optimization)
        # We create a "fingerprint" (hash) of the text. If we've seen this exact
        # text before, we return the stored answer instantly.
        cache_key = self._generate_cache_key(raw_text)
        
        if cache_key in self.cache:
            print(f"⚡ CACHE HIT: Serving AI analysis for key {cache_key[:8]}... (Zero Latency)")
            return self.cache[cache_key]
        
        # PHASE 1: Initialization Check
        if not self.model:
             print("⚠️ Primary model missing. Attempting initialization of backup...")
             self.model = self._init_model(self.backup_model_name)
             if not self.model:
                raise AIAnalysisException("AI Engine Offline. No models available.")

        # PHASE 2: Execution & Failover
        result = None
        try:
            # Attempt 1: Execute with Primary
            result = self._execute_analysis(raw_text, self.model)
        except Exception as e:
            print(f"⚠️ Primary Model Failed ({e}). Switching to Fallback...")
            
            # Attempt 2: Hot-swap to Backup Model (Redundancy)
            try:
                backup = genai.GenerativeModel(self.backup_model_name)
                result = self._execute_analysis(raw_text, backup)
            except Exception as final_error:
                # Critical Failure: Both engines are dead.
                print(f"❌ CRITICAL: Both AI models failed: {final_error}")
                raise AIAnalysisException()
        
        # PHASE 3: Save to Cache
        # Store the successful result so the next request gets it instantly.
        self.cache[cache_key] = result
        return result

    def _generate_cache_key(self, text: str) -> str:
        """
        Utility: Creates a compact MD5 hash of the text.
        Using a hash is more memory-efficient than storing the full text string as a key.
        """
        return hashlib.md5(text.encode('utf-8')).hexdigest()

    def _execute_analysis(self, raw_text: str, model_instance) -> AIAnalysisResult:
        """
        Internal Logic: Prompt Engineering & JSON Parsing.
        """
        
        # --- PROMPT ENGINEERING ---
        # Persona: "Senior Check Airman" ensures authoritative, concise tone.
        # Context: "Boeing 737 Crew" limits the scope to relevant airline ops.
        # Format: Strict JSON enforcement to prevent Markdown pollution.
        prompt = f"""
        Act as a Senior Check Airman. Analyze this NOTAM for a Boeing 737 Crew.
        
        NOTAM: "{raw_text}"
        
        RETURN JSON ONLY (No Markdown):
        {{
            "summary": "One sentence technical summary (max 15 words).",
            "impact": "Operational consequence (The So What).",
            "action": "Pilot Directive (The Now What).",
            "risk_score": Integer 0-100.
        }}
        """
        
        try:
            # 1. Generate Content
            response = model_instance.generate_content(prompt)
            clean_json = response.text.strip()
            
            # 2. JSON Hygiene (Sanitization)
            # LLMs often wrap output in ```json fences. We must strip them 
            # to avoid JSONDecodeError.
            if "```json" in clean_json:
                clean_json = clean_json.split("```json")[1].split("```")[0]
            elif "```" in clean_json:
                clean_json = clean_json.split("```")[0]

            # 3. Parse to Dictionary
            data = json.loads(clean_json.strip())
            
            # 4. Computed Fields (Business Logic)
            # If the AI forgets 'risk_level', we calculate it mathematically based on score.
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