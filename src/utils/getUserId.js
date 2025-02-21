export async function getUserId() {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get('supabaseUserId', (storageData) => {
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError);
        }
        resolve(storageData.supabaseUserId || null);
      });
    });
  }
  