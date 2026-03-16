import { GoogleGenAI, Type } from "@google/genai";

// Ambil kunci yang disandikan dari .env
const base64Key = (import.meta as any).env.VITE_GEMINI_API_KEY_BASE64;

// Buka sandinya (decode) menggunakan atob()
const apiKey = base64Key ? atob(base64Key) : "";

// Inisialisasi AI
const ai = new GoogleGenAI({ apiKey: apiKey });

// ... (sisa kodemu di bawahnya biarkan sama, pastikan modelnya "gemini-2.5-flash")