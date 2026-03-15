import { GoogleGenAI, Type } from "@google/genai";

// Menggunakan trik (as any) agar TypeScript tidak mengeluh di Vite
const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;

const ai = new GoogleGenAI({ apiKey: apiKey || "" });

export async function generateEventChecklist(eventType: string, eventDescription: string, lang: 'id' | 'en' = 'id') {
  // Cegah error macet jika API key belum terbaca
  if (!apiKey) {
    console.error("API Key kosong! Pastikan kamu menulis VITE_GEMINI_API_KEY=AIza... di dalam file .env");
    return [];
  }

  const prompt = lang === 'id' 
    ? `Buatkan checklist lengkap untuk acara ${eventType}. Deskripsi: ${eventDescription}. Kelompokkan tugas ke dalam kategori logis seperti Lokasi, Konsumsi, Pemasaran, Logistik, dll. Berikan respon dalam Bahasa Indonesia.`
    : `Generate a comprehensive checklist for a ${eventType} event. Description: ${eventDescription}. Group tasks into logical categories like Venue, Catering, Marketing, Logistics, etc. Provide response in English.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              tasks: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["category", "tasks"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Gagal mengurai respons Gemini", e);
    return [];
  }
}