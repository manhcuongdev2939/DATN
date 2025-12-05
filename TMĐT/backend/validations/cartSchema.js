import * as yup from "yup";

export const addCartSchema = yup.object({
  ID_San_pham: yup
    .number()
    .typeError("ID_San_pham phải là số")
    .required("ID_San_pham là bắt buộc"),

  So_luong: yup
    .number()
    .typeError("So_luong phải là số")
    .min(1, "Số lượng phải >= 1")
    .default(1)
});
export const updateCartSchema = yup.object({
    So_luong: yup
      .number()
      .typeError("So_luong phải là số")
      .min(1, "Số lượng phải >= 1")
      .required("So_luong là bắt buộc")
  });
  