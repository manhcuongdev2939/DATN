import Joi from "joi";
import { errorResponse } from "../utils/response.js";

export const validateBody = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return errorResponse(
      res,
      "Dữ liệu không hợp lệ",
      400,
      error.details.map((d) => d.message)
    );
  }

  req.body = value;
  next();
};

// Common rules
const email = Joi.string().email({ tlds: false }).trim().required();
const otp = Joi.string()
  .pattern(/^\d{6}$/)
  .required();

export const authSchemas = {
  requestOtp: Joi.object({
    Email: email,
  }),

  loginOtp: Joi.object({
    Email: email,
    otp,
  }),

  registerOtp: Joi.object({
    Email: email,
  }),

  verifyRegisterOtp: Joi.object({
    Email: email,
    otp,
  }),

  register: Joi.object({
    Ten_khach_hang: Joi.string().min(3).max(100).trim().required(),
    Email: email,
    Mat_khau: Joi.string().min(6).max(128).required(),
    So_dien_thoai: Joi.string().allow("", null),
    Dia_chi_mac_dinh: Joi.string().allow("", null),
    Phuong_Xa: Joi.string().allow("", null),
    Quan_Huyen: Joi.string().allow("", null),
    Tinh_Thanh: Joi.string().allow("", null),
    otp,
  }),

  login: Joi.object({
    Email: email,
    Mat_khau: Joi.string().min(6).max(128).required(),
  }),
};

export const contactSchema = Joi.object({
  name: Joi.string().trim().max(100).allow("", null),
  email: email,
  message: Joi.string().trim().min(10).max(5000).required(),
});

export const newsletterSchema = Joi.object({
  email: email,
});
