import { GoogleGenAI, Type } from "@google/genai";

const base64Key = (import.meta as any).env.VITE_GEMINI_API_KEY_BASE64;
const apiKey = base64Key ? atob(base64Key) : "";
const ai = new GoogleGenAI({ apiKey: apiKey });

export async function generateEventChecklist(eventType: string, eventDescription: string, lang: 'id' | 'en' = 'id') {
  if (!apiKey) {
    console.error("API Key Gemini tidak ditemukan!");
    return []; 
  }

  const prompt = lang === 'id' 
    ? `Buatkan checklist lengkap untuk acara ${eventType}. Deskripsi: ${eventDescription}. Kelompokkan tugas ke dalam kategori yang logis.`
    : `Generate a comprehensive checklist for a ${eventType} event. Description: ${eventDescription}. Group tasks into logical categories.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        // SKEMA FINAL: Menyesuaikan persis dengan for...of di App.tsx
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              tasks: { 
                type: Type.ARRAY,
                items: { type: Type.STRING } // Array berisi teks tugas
              }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");

  } catch (e) {
    console.error("Gagal mengambil saran AI:", e);
    return [];
  }
}