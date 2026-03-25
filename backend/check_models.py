import google.generativeai as genai
import os
from pathlib import Path
from dotenv import load_dotenv

current_dir = Path(__file__).parent
env_path = current_dir / ".env"
load_dotenv(dotenv_path=env_path)

api_key = os.getenv("GEMINI_API_KEY")

print(f"📂 Looking for .env at: {env_path}")

if not api_key:
    print("❌ Error: GEMINI_API_KEY not found. Check your .env file content.")
else:
    print(f"🔑 API Key Loaded: {api_key[:5]}...******")
    
    genai.configure(api_key=api_key)
    print("📡 Connecting to Google Brain...")
    
    try:
        print("\n✅ AVAILABLE MODELS FOR YOU:")
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f"   - {m.name}")
    except Exception as e:
        print(f"❌ Connection Failed: {e}")