import * as yup from "yup";

export const validateBody = (schema) => async (req, res, next) => {
  try {
    req.body = await schema.validate(req.body, { abortEarly: false });
    next();
  } catch (err) {
    return res.status(400).json({
      error: "Dữ liệu không hợp lệ",
      messages: err.errors
    });
  }
};
