const apiResponse = (status, message, data = null) => {
  return {
    success: status >= 200 && status < 300,
    status: status,
    message: message,
    data: data,
  };
};

module.exports = {
  apiResponse,
};
