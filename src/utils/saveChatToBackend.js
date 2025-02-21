export function saveChatToBackend({userId, chatId, chatTitle, providerName}) {
    const payload = {
        user_id: userId,
        provider_chat_id: chatId,
        title: chatTitle,
        provider_name: providerName,
    };

    console.log("Payload being sent to backend:", payload);

    fetch('http://127.0.0.1:8000/save_chat', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
        console.log('Chat saved/updated successfully:', data.data);
        } else {
        console.error('Error saving chat:', data.error);
        }
    })
    .catch(error => console.error('Error in saveChatToBackend:', error));

  }
  