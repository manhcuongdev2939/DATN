import { errorResponse } from '../utils/response.js';

export const notFoundHandler = (req, res, next) => {
  errorResponse(res, `Route ${req.originalUrl} không tồn tại`, 404);
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Đã xảy ra lỗi không xác định';

  if (req.log) {
    req.log.error({ err }, 'Unhandled error');
  } else {
    console.error(err);
  }

  errorResponse(res, message, statusCode, err.details);
};

