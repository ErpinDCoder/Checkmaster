import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateEventChecklist(eventType: string, eventDescription: string, lang: 'id' | 'en' = 'id') {
  const prompt = lang === 'id' 
    ? `Buatkan checklist lengkap untuk acara ${eventType}. Deskripsi: ${eventDescription}. Kelompokkan tugas ke dalam kategori logis seperti Lokasi, Konsumsi, Pemasaran, Logistik, dll. Berikan respon dalam Bahasa Indonesia.`
    : `Generate a comprehensive checklist for a ${eventType} event. Description: ${eventDescription}. Group tasks into logical categories like Venue, Catering, Marketing, Logistics, etc. Provide response in English.`;

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

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Gagal mengurai respons Gemini", e);
    return [];
  }
}
