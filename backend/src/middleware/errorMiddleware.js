export function errorMiddleware(err, req, res, next) {
  console.error(
    JSON.stringify({
      type: 'error',
      requestId: req.requestId,
      method: req.method,
      path: req.originalUrl,
      errorName: err.name,
      errorCode: err.code,
      message: err.message,
      stack: err.stack,
    })
  );

  if (err.code === 'EMAIL_ALREADY_EXISTS') {
    return res.status(409).json({
      success: false,
      message: 'Email is already registered',
    });
  }

  if (err.code === 'INVALID_CREDENTIALS') {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
  }

  if (err.code === 'NO_UPDATE_FIELDS') {
    return res.status(400).json({
      success: false,
      message: 'No fields provided for update',
    });
  }

  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
}