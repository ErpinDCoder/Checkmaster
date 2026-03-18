
export async function generateEventChecklist(eventType: string, eventDescription: string, lang: 'id' | 'en' = 'id') {
  try {
    const response = await fetch("/api/ai-suggest", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ eventType, eventDescription, lang }),
    });

    if (!response.ok) {
      throw new Error("Gagal mengambil saran dari server");
    }

    return await response.json();
  } catch (e) {
    console.error("Gagal mengambil saran AI", e);
    return [];
  }
}
