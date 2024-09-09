// retryWithTimeout.js (utility file)
const retryWithTimeout = async (requestHandler, retries, timeoutMs) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      console.log(`Attempt ${attempt}`);
      try {
        // Create a promise that either resolves the request or rejects after timeout
        const result = await Promise.race([
          requestHandler(), // Your actual request handler function
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request Timeout')), timeoutMs)
          ),
        ]);
  
        // If the request succeeded within the timeout, return the result
        return result;
      } catch (error) {
        // Log failure and retry if attempts are left
        console.error(`Request failed (Attempt ${attempt}): ${error.message}`);
        if (attempt === retries) {
          throw new Error('Max retries reached. Operation failed.');
        }
      }
    }
  };
  
  module.exports = retryWithTimeout;
  