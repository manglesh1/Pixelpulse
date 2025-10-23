const retryWithTimeout = async (requestHandler, retries, timeoutMs) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      console.log(`Attempt ${attempt}`);
      try {
        const result = await Promise.race([
          requestHandler(), 
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request Timeout')), timeoutMs)
          ),
        ]);  
        return result;
      } catch (error) {
        console.error(`Request failed (Attempt ${attempt}): ${error.message}`);
        if (attempt === retries) {
          throw new Error('Max retries reached. Operation failed.');
        }
      }
    }
  };
  
  module.exports = retryWithTimeout;
  