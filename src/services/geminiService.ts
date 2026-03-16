import { GoogleGenAI, Type } from "@google/genai";

// Mengambil API Key yang sudah disandikan (Base64) dari file .env
const base64Key = (import.meta as any).env.VITE_GEMINI_API_KEY_BASE64;

// Membuka sandinya (decode) menggunakan atob(). Kalau kosong, beri string kosong.
const apiKey = base64Key ? atob(base64Key) : "";

// Inisialisasi AI menggunakan kunci asli yang sudah dibuka
const ai = new GoogleGenAI({ apiKey: apiKey });

export async function generateEventChecklist(eventType: string, eventDescription: string, lang: 'id' | 'en' = 'id') {
  if (!apiKey) {
    console.error("API Key Gemini tidak ditemukan! Pastikan VITE_GEMINI_API_KEY_BASE64 sudah diatur di .env.");
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
        // Memaksa Gemini untuk selalu membalas dalam format JSON agar tidak error saat dibaca aplikasi
        responseMimeType: "application/json",
        responseSchema: {
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
    });

    // Mengubah teks JSON dari AI menjadi data yang bisa dipakai aplikasimu
    return JSON.parse(response.text || "[]");

  } catch (e) {
    console.error("Gagal mengambil saran AI:", e);
    return [];
  }
}