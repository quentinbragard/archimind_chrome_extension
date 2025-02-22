export async function getUserId() {
  console.log("===========Get User Id");
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get('userId', (storageData) => {
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError);
        }
        resolve(storageData.userId || null);
      });
    });
  }
  