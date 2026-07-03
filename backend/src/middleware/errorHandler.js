export default (err, req, res, next) => {
  console.error('Centralized Error Handler:', err);
  
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return res.status(statusCode).json({
    success: false,
    message: message
  });
};
