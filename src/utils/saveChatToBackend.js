import { getAuthToken } from './auth.js';

/**
 * Saves chat metadata (title, ID, provider) to the backend.
 */
export async function saveChatToBackend({ chatId, chatTitle, providerName }) {
  try {
    const token = await getAuthToken();

    const payload = {
      provider_chat_id: chatId,
      title: chatTitle,
      provider_name: providerName,
    };

    console.log("🔄 Sending chat payload:", payload);

    const response = await fetch('http://127.0.0.1:8000/save/chat', {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.warn(`⚠️ Failed request (${response.status}):`, await response.text());
      throw new Error("Failed to save chat.");
    }

    const data = await response.json();
    console.log("✅ Chat saved successfully:", data);
  } catch (error) {
    console.error("❌ Error in saveChatToBackend:", error);
  }
}
