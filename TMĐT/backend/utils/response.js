export const successResponse = (res, data = {}, meta = {}, status = 200) => {
  return res.status(status).json({
    success: true,
    data,
    meta,
  });
};

export const errorResponse = (res, message, status = 500, details) => {
  return res.status(status).json({
    success: false,
    error: {
      message,
      ...(details ? { details } : {}),
    },
  });
};

export const buildPagination = ({ page, limit, total }) => {
  const safeLimit = Number(limit) || 0;
  const safePage = Number(page) || 1;
  return {
    page: safePage,
    limit: safeLimit,
    total,
    totalPages: safeLimit > 0 ? Math.ceil(total / safeLimit) : 0,
  };
};

