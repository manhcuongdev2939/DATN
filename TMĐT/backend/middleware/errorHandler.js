import { errorResponse } from "../utils/response.js";

export const notFoundHandler = (req, res) => {
  errorResponse(res, `Route ${req.originalUrl} không tồn tại`, 404);
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "Đã xảy ra lỗi hệ thống";

  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }

  errorResponse(
    res,
    message,
    statusCode,
    process.env.NODE_ENV === "production" ? undefined : err.details
  );
};
