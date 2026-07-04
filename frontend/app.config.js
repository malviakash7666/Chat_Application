module.exports = ({ config }) => {
  return {
    ...config,
    extra: {
      ...config.extra,
      apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://chat-application-3izs.onrender.com'
    }
  };
};
