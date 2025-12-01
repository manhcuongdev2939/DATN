import Joi from 'joi';
import { errorResponse } from '../utils/response.js';

export const validateBody = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const details = error.details.map((detail) => detail.message);
      return errorResponse(res, 'Dữ liệu không hợp lệ', 400, details);
    }

    req.body = value;
    next();
  };
};

export const authSchemas = {
  requestOtp: Joi.object({
    Email: Joi.string().email().required(),
  }),
  loginOtp: Joi.object({
    Email: Joi.string().email().required(),
    otp: Joi.string().length(6).pattern(/^\d+$/).required(),
  }),
  registerOtp: Joi.object({
    Email: Joi.string().email().required(),
  }),
  register: Joi.object({
    Ten_khach_hang: Joi.string().min(3).max(100).required(),
    Email: Joi.string().email().required(),
    Mat_khau: Joi.string().min(6).max(128).required(),
    So_dien_thoai: Joi.string().allow(null, '').optional(),
    Dia_chi_mac_dinh: Joi.string().allow(null, '').optional(),
    otp: Joi.string().length(6).pattern(/^\d+$/).required(),
  }),
  login: Joi.object({
    Email: Joi.string().email().required(),
    Mat_khau: Joi.string().min(6).max(128).required(),
  }),
};

