import { GoogleGenAI, Type } from "@google/genai";

const base64Key = (import.meta as any).env.VITE_GEMINI_API_KEY_BASE64;
const apiKey = base64Key ? atob(base64Key) : "";
const ai = new GoogleGenAI({ apiKey: apiKey });

export async function generateEventChecklist(eventType: string, eventDescription: string, lang: 'id' | 'en' = 'id') {
  if (!apiKey) {
    console.error("API Key Gemini tidak ditemukan!");
    return { tasks: [] }; 
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
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tasks: { // <-- Ini kunci utamanya, kita bungkus dalam "tasks"
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  task: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    // Mengembalikan data JSON yang sudah sesuai harapan UI
    return JSON.parse(response.text || '{"tasks": []}');

  } catch (e) {
    console.error("Gagal mengambil saran AI:", e);
    return { tasks: [] };
  }
}