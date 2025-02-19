// background.js

// Your Supabase config
const SUPABASE_URL = 'https://gjszbwfzgnwblvdehzcq.supabase.co';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdqc3pid2Z6Z253Ymx2ZGVoemNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzczNzc1MTgsImV4cCI6MjA1Mjk1MzUxOH0.j8IsFttSHrHCm5K_Z7A19pMftuNwDfpKww2dBAYaXUQ';

// Error code mapping
const errorCodeMap = {
  400: 'InvalidRequest: The request is not properly formed.',
  401: 'InvalidJWT: The provided JWT (JSON Web Token) is invalid.',
  403: 'AccessDenied: Access to the specified resource is denied.',
  404: 'NoSuchBucket: The specified bucket does not exist.',
  409: 'ResourceAlreadyExists: The specified resource already exists.',
  411: 'MissingContentLength: The Content-Length header is missing.',
  413: 'EntityTooLarge: The entity being uploaded is too large.',
  416: 'InvalidRange: The specified range is not valid.',
  423: 'ResourceLocked: The specified resource is locked.',
  500: 'InternalError: An internal server error occurred.',
  503: 'SlowDown: The request rate is too high and has been throttled.',
  504: 'DatabaseTimeout: Timeout occurred while accessing the database.',
  // Add more mappings as needed
};

// Open welcome page on installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.tabs.create({ url: 'welcome.html' });
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received message from content script:', request);

  if (request.type === 'SAVE_MESSAGE') {
    chrome.storage.sync.get('supabaseUserId', async (storageData) => {
      const userId = storageData.supabaseUserId || 'default_user';
      console.log('Retrieved user ID:', userId);

      if (!userId) {
        console.error('Supabase user ID not set.');
        sendResponse({ success: false, error: 'User ID missing' });
        return;
      }

      // Destructure message data sent from the content script
      const { role, message, rank, message_id, provider_chat_id, model, thinking_time } = request.data;
      console.log('Message data:', { role, message, rank, message_id, provider_chat_id, model, thinking_time });

      // Check if the message ID already exists
      const checkEndpoint = `${SUPABASE_URL}/rest/v1/messages?user_id=eq.${userId}&message_id=eq.${message_id}`;
      try {
        const checkResponse = await fetch(checkEndpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            apikey: API_KEY,
            Authorization: `Bearer ${API_KEY}`,
          },
        });

        const existingMessages = await checkResponse.json();
        if (existingMessages.length > 0) {
          console.log('Message ID already exists, updating record.');
          const updateEndpoint = `${SUPABASE_URL}/rest/v1/messages?id=eq.${existingMessages[0].id}`;
          const updatePayload = {
            content: message,
            role: role,
            rank: rank,
            provider_chat_id: provider_chat_id,
            model: model,
          };

          console.log('Update payload:', updatePayload);  

          const updateResponse = await fetch(updateEndpoint, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              apikey: API_KEY,
              Authorization: `Bearer ${API_KEY}`,
            },
            body: JSON.stringify(updatePayload),
          });

          if (!updateResponse.ok) {
            const errorDescription = errorCodeMap[updateResponse.status] || 'Unknown error occurred';
            console.error(`Error updating message: ${errorDescription}`);
            sendResponse({ success: false, error: errorDescription });
          } else {
            console.log('Message updated successfully:');
            sendResponse({ success: true, data: "Message updated successfully" });
          }
          return;
        }
      } catch (error) {
        console.error('Error checking message ID:', error);
        sendResponse({ success: false, error: error.message });
        return;
      }

      // If no existing message, insert a new one
      const endpoint = `${SUPABASE_URL}/rest/v1/messages`;
      const payload = {
        user_id: userId,
        content: message,
        role: role,
        rank: rank,
        message_id: message_id,
        provider_chat_id: provider_chat_id,
        model: model,
        thinking_time: thinking_time,
        created_at: new Date().toISOString(),
      };
      console.log('Payload prepared for Supabase:', payload);

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: API_KEY,
            Authorization: `Bearer ${API_KEY}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorDescription = errorCodeMap[response.status] || 'Unknown error occurred';
          console.error(`Error saving message: ${errorDescription}`);
          sendResponse({ success: false, error: errorDescription });
        } else {
          console.log('Message saved successfully:');
          sendResponse({ success: true, data: "Message saved successfully" });
        }
      } catch (error) {
        console.error('Fetch error:', error);
        sendResponse({ success: false, error: error.message });
      }
    });

    // Return true to signal that we want to send an asynchronous response.
    return true;
  } else if (request.type === 'SAVE_CHAT') {
    const { user_id, provider_chat_id, title, provider_name } = request.data;
    console.log('Chat data:', { user_id, provider_chat_id, title, provider_name });

    // Check if the chat already exists
    const checkChatEndpoint = `${SUPABASE_URL}/rest/v1/chats?provider_chat_id=eq.${provider_chat_id}&user_id=eq.${user_id}`;
    fetch(checkChatEndpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        apikey: API_KEY,
        Authorization: `Bearer ${API_KEY}`,
      },
    })
      .then(response => response.json())
      .then(existingChats => {
        if (existingChats.length > 0) {
          const existingChat = existingChats[0];
          if (existingChat.title !== title) {
            // Update the chat title if it's different
            const updateChatEndpoint = `${SUPABASE_URL}/rest/v1/chats?id=eq.${existingChat.id}`;
            fetch(updateChatEndpoint, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                apikey: API_KEY,
                Authorization: `Bearer ${API_KEY}`,
              },
              body: JSON.stringify({ title }),
            })
              .then(updateResponse => {
                if (!updateResponse.ok) {
                  const errorDescription = errorCodeMap[updateResponse.status] || 'Unknown error occurred';
                  console.error(`Error updating chat: ${errorDescription}`);
                  sendResponse({ success: false, error: errorDescription });
                } else {
                  console.log('Chat updated successfully:');
                  sendResponse({ success: true, data: "Chat updated successfully" });
                }
              })
              .catch(error => {
                console.error('Fetch error:', error);
                sendResponse({ success: false, error: error.message });
              });
          } else {
            console.log('Chat already exists with the same title, no update needed.');
            sendResponse({ success: true, data: "Chat already exists with the same title" });
          }
        } else {
          // Insert new chat if it doesn't exist
          const chatPayload = {
            user_id,
            provider_chat_id,
            title,
            provider_name,
            created_at: new Date().toISOString(),
          };
          console.log('Payload prepared for Supabase (chat):', chatPayload);

          const chatEndpoint = `${SUPABASE_URL}/rest/v1/chats`;
          fetch(chatEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: API_KEY,
              Authorization: `Bearer ${API_KEY}`,
            },
            body: JSON.stringify(chatPayload),
          })
            .then(response => {
              if (!response.ok) {
                const errorDescription = errorCodeMap[response.status] || 'Unknown error occurred';
                console.error(`Error saving chat: ${errorDescription}`);
                sendResponse({ success: false, error: errorDescription });
              } else {
                console.log('Chat saved successfully:');
                sendResponse({ success: true, data: "Chat saved successfully" });
              }
            })
            .catch(error => {
              console.error('Fetch error:', error);
              sendResponse({ success: false, error: error.message });
            });
        }
      })
      .catch(error => {
        console.error('Error checking chat existence:', error);
        sendResponse({ success: false, error: error.message });
      });

    // Return true to signal that we want to send an asynchronous response.
    return true;
  }
});
