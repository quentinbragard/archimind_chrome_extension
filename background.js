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

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Hello World'); // Log message when a message is received
  console.log('Received message from content script:', request);

  if (request.type === 'SAVE_MESSAGE') {
    // Retrieve user ID from storage (set via your popup)
    chrome.storage.sync.get('supabaseUserId', async (storageData) => {
      const userId = storageData.supabaseUserId || 'default_user';
      console.log('Retrieved user ID:', userId);

      if (!userId) {
        console.error('Supabase user ID not set.');
        sendResponse({ success: false, error: 'User ID missing' });
        return;
      }

      // Destructure message data sent from the content script
      const { messageType, message, rank, messageId } = request.data;
      console.log('Message data:', { messageType, message, rank, messageId });

      // Check if the message ID already exists
      const checkEndpoint = `${SUPABASE_URL}/rest/v1/messages?message_id=eq.${messageId}`;
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
          console.log('Message ID already exists, skipping save.');
          sendResponse({ success: true, data: "Message already exists" });
          return;
        }
      } catch (error) {
        console.error('Error checking message ID:', error);
        sendResponse({ success: false, error: error.message });
        return;
      }

      // Determine the endpoint based on the message type
      const endpoint = `${SUPABASE_URL}/rest/v1/messages`;

      // Prepare the payload
      const payload = {
        user_id: userId,
        content: message,
        role: messageType,
        rank: rank,
        message_id: messageId,
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
  }
});
