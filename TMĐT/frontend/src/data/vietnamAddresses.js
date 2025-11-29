// Dữ liệu địa chỉ Việt Nam
// Bao gồm các tỉnh/thành phố, quận/huyện, và xã/phường

export const vietnamProvinces = [
  { code: '01', name: 'Hà Nội' },
  { code: '02', name: 'Hồ Chí Minh' },
  { code: '03', name: 'Hải Phòng' },
  { code: '04', name: 'Đà Nẵng' },
  { code: '05', name: 'An Giang' },
  { code: '06', name: 'Bà Rịa - Vũng Tàu' },
  { code: '07', name: 'Bạc Liêu' },
  { code: '08', name: 'Bắc Kạn' },
  { code: '09', name: 'Bắc Giang' },
  { code: '10', name: 'Bắc Ninh' },
  { code: '11', name: 'Bến Tre' },
  { code: '12', name: 'Bình Định' },
  { code: '13', name: 'Bình Dương' },
  { code: '14', name: 'Bình Phước' },
  { code: '15', name: 'Bình Thuận' },
  { code: '16', name: 'Cà Mau' },
  { code: '17', name: 'Cao Bằng' },
  { code: '18', name: 'Cần Thơ' },
  { code: '19', name: 'Đắk Lắk' },
  { code: '20', name: 'Đắk Nông' },
  { code: '21', name: 'Điện Biên' },
  { code: '22', name: 'Đồng Nai' },
  { code: '23', name: 'Đồng Tháp' },
  { code: '24', name: 'Gia Lai' },
  { code: '25', name: 'Hà Giang' },
  { code: '26', name: 'Hà Nam' },
  { code: '27', name: 'Hà Tĩnh' },
  { code: '28', name: 'Hải Dương' },
  { code: '29', name: 'Hậu Giang' },
  { code: '30', name: 'Hòa Bình' },
  { code: '31', name: 'Hưng Yên' },
  { code: '32', name: 'Khánh Hòa' },
  { code: '33', name: 'Kiên Giang' },
  { code: '34', name: 'Kon Tum' },
  { code: '35', name: 'Lai Châu' },
  { code: '36', name: 'Lâm Đồng' },
  { code: '37', name: 'Lạng Sơn' },
  { code: '38', name: 'Lào Cai' },
  { code: '39', name: 'Long An' },
  { code: '40', name: 'Nam Định' },
  { code: '41', name: 'Nghệ An' },
  { code: '42', name: 'Ninh Bình' },
  { code: '43', name: 'Ninh Thuận' },
  { code: '44', name: 'Phú Thọ' },
  { code: '45', name: 'Phú Yên' },
  { code: '46', name: 'Quảng Bình' },
  { code: '47', name: 'Quảng Nam' },
  { code: '48', name: 'Quảng Ngãi' },
  { code: '49', name: 'Quảng Ninh' },
  { code: '50', name: 'Quảng Trị' },
  { code: '51', name: 'Sóc Trăng' },
  { code: '52', name: 'Sơn La' },
  { code: '53', name: 'Tây Ninh' },
  { code: '54', name: 'Thái Bình' },
  { code: '55', name: 'Thái Nguyên' },
  { code: '56', name: 'Thanh Hóa' },
  { code: '57', name: 'Thừa Thiên Huế' },
  { code: '58', name: 'Tiền Giang' },
  { code: '59', name: 'Trà Vinh' },
  { code: '60', name: 'Tuyên Quang' },
  { code: '61', name: 'Vĩnh Long' },
  { code: '62', name: 'Vĩnh Phúc' },
  { code: '63', name: 'Yên Bái' },
];

// Dữ liệu quận/huyện theo tỉnh/thành phố
export const districts = {
  '01': [ // Hà Nội
    { code: '001', name: 'Ba Đình' },
    { code: '002', name: 'Hoàn Kiếm' },
    { code: '003', name: 'Tây Hồ' },
    { code: '004', name: 'Long Biên' },
    { code: '005', name: 'Cầu Giấy' },
    { code: '006', name: 'Đống Đa' },
    { code: '007', name: 'Hai Bà Trưng' },
    { code: '008', name: 'Hoàng Mai' },
    { code: '009', name: 'Thanh Xuân' },
    { code: '010', name: 'Sóc Sơn' },
    { code: '011', name: 'Đông Anh' },
    { code: '012', name: 'Gia Lâm' },
    { code: '013', name: 'Nam Từ Liêm' },
    { code: '014', name: 'Bắc Từ Liêm' },
    { code: '015', name: 'Mê Linh' },
    { code: '016', name: 'Hà Đông' },
    { code: '017', name: 'Sơn Tây' },
    { code: '018', name: 'Ba Vì' },
    { code: '019', name: 'Phúc Thọ' },
    { code: '020', name: 'Đan Phượng' },
    { code: '021', name: 'Hoài Đức' },
    { code: '022', name: 'Quốc Oai' },
    { code: '023', name: 'Thạch Thất' },
    { code: '024', name: 'Chương Mỹ' },
    { code: '025', name: 'Thanh Oai' },
    { code: '026', name: 'Thường Tín' },
    { code: '027', name: 'Phú Xuyên' },
    { code: '028', name: 'Ứng Hòa' },
    { code: '029', name: 'Mỹ Đức' },
  ],
  '02': [ // Hồ Chí Minh
    { code: '001', name: 'Quận 1' },
    { code: '002', name: 'Quận 2' },
    { code: '003', name: 'Quận 3' },
    { code: '004', name: 'Quận 4' },
    { code: '005', name: 'Quận 5' },
    { code: '006', name: 'Quận 6' },
    { code: '007', name: 'Quận 7' },
    { code: '008', name: 'Quận 8' },
    { code: '009', name: 'Quận 9' },
    { code: '010', name: 'Quận 10' },
    { code: '011', name: 'Quận 11' },
    { code: '012', name: 'Quận 12' },
    { code: '013', name: 'Bình Thạnh' },
    { code: '014', name: 'Tân Bình' },
    { code: '015', name: 'Tân Phú' },
    { code: '016', name: 'Phú Nhuận' },
    { code: '017', name: 'Gò Vấp' },
    { code: '018', name: 'Bình Tân' },
    { code: '019', name: 'Tân Phú' },
    { code: '020', name: 'Thủ Đức' },
    { code: '021', name: 'Củ Chi' },
    { code: '022', name: 'Hóc Môn' },
    { code: '023', name: 'Bình Chánh' },
    { code: '024', name: 'Nhà Bè' },
    { code: '025', name: 'Cần Giờ' },
  ],
  '03': [ // Hải Phòng
    { code: '001', name: 'Hồng Bàng' },
    { code: '002', name: 'Ngô Quyền' },
    { code: '003', name: 'Lê Chân' },
    { code: '004', name: 'Hải An' },
    { code: '005', name: 'Kiến An' },
    { code: '006', name: 'Đồ Sơn' },
    { code: '007', name: 'Dương Kinh' },
    { code: '008', name: 'Thuỷ Nguyên' },
    { code: '009', name: 'An Dương' },
    { code: '010', name: 'An Lão' },
    { code: '011', name: 'Kiến Thuỵ' },
    { code: '012', name: 'Tiên Lãng' },
    { code: '013', name: 'Vĩnh Bảo' },
    { code: '014', name: 'Cát Hải' },
    { code: '015', name: 'Bạch Long Vĩ' },
  ],
  '04': [ // Đà Nẵng
    { code: '001', name: 'Hải Châu' },
    { code: '002', name: 'Thanh Khê' },
    { code: '003', name: 'Sơn Trà' },
    { code: '004', name: 'Ngũ Hành Sơn' },
    { code: '005', name: 'Liên Chiểu' },
    { code: '006', name: 'Cẩm Lệ' },
    { code: '007', name: 'Hòa Vang' },
    { code: '008', name: 'Hoàng Sa' },
  ],
  '13': [ // Bình Dương
    { code: '001', name: 'Thủ Dầu Một' },
    { code: '002', name: 'Dầu Tiếng' },
    { code: '003', name: 'Bến Cát' },
    { code: '004', name: 'Tân Uyên' },
    { code: '005', name: 'Dĩ An' },
    { code: '006', name: 'Thuận An' },
  ],
  '22': [ // Đồng Nai
    { code: '001', name: 'Biên Hòa' },
    { code: '002', name: 'Long Khánh' },
    { code: '003', name: 'Tân Phú' },
    { code: '004', name: 'Vĩnh Cửu' },
    { code: '005', name: 'Định Quán' },
    { code: '006', name: 'Trảng Bom' },
  ],
  '32': [ // Khánh Hòa
    { code: '001', name: 'Nha Trang' },
    { code: '002', name: 'Cam Ranh' },
    { code: '003', name: 'Cam Lâm' },
    { code: '004', name: 'Vạn Ninh' },
    { code: '005', name: 'Ninh Hòa' },
  ],
  '36': [ // Lâm Đồng
    { code: '001', name: 'Đà Lạt' },
    { code: '002', name: 'Bảo Lộc' },
    { code: '003', name: 'Đơn Dương' },
    { code: '004', name: 'Đức Trọng' },
  ],
  '49': [ // Quảng Ninh
    { code: '001', name: 'Hạ Long' },
    { code: '002', name: 'Móng Cái' },
    { code: '003', name: 'Cẩm Phả' },
    { code: '004', name: 'Uông Bí' },
  ],
};

// Dữ liệu xã/phường theo quận/huyện (mẫu cho một số quận)
export const wards = {
  '01-001': [ // Ba Đình, Hà Nội
    { code: '00001', name: 'Phường Cống Vị' },
    { code: '00002', name: 'Phường Điện Biên' },
    { code: '00003', name: 'Phường Đội Cấn' },
    { code: '00004', name: 'Phường Giảng Võ' },
    { code: '00005', name: 'Phường Kim Mã' },
    { code: '00006', name: 'Phường Liễu Giai' },
    { code: '00007', name: 'Phường Ngọc Hà' },
    { code: '00008', name: 'Phường Ngọc Khánh' },
    { code: '00009', name: 'Phường Nguyễn Trung Trực' },
    { code: '00010', name: 'Phường Phúc Xá' },
    { code: '00011', name: 'Phường Quán Thánh' },
    { code: '00012', name: 'Phường Thành Công' },
    { code: '00013', name: 'Phường Trúc Bạch' },
    { code: '00014', name: 'Phường Vĩnh Phúc' },
  ],
  '01-002': [ // Hoàn Kiếm, Hà Nội
    { code: '00015', name: 'Phường Chương Dương Độ' },
    { code: '00016', name: 'Phường Cửa Đông' },
    { code: '00017', name: 'Phường Cửa Nam' },
    { code: '00018', name: 'Phường Đồng Xuân' },
    { code: '00019', name: 'Phường Hàng Bạc' },
    { code: '00020', name: 'Phường Hàng Bồ' },
    { code: '00021', name: 'Phường Hàng Bông' },
    { code: '00022', name: 'Phường Hàng Buồm' },
    { code: '00023', name: 'Phường Hàng Đào' },
    { code: '00024', name: 'Phường Hàng Gai' },
    { code: '00025', name: 'Phường Hàng Mã' },
    { code: '00026', name: 'Phường Hàng Trống' },
    { code: '00027', name: 'Phường Lý Thái Tổ' },
    { code: '00028', name: 'Phường Phan Chu Trinh' },
    { code: '00029', name: 'Phường Phúc Tân' },
    { code: '00030', name: 'Phường Tràng Tiền' },
  ],
  '02-001': [ // Quận 1, HCM
    { code: '00031', name: 'Phường Bến Nghé' },
    { code: '00032', name: 'Phường Bến Thành' },
    { code: '00033', name: 'Phường Cô Giang' },
    { code: '00034', name: 'Phường Đa Kao' },
    { code: '00035', name: 'Phường Nguyễn Cư Trinh' },
    { code: '00036', name: 'Phường Nguyễn Thái Bình' },
    { code: '00037', name: 'Phường Phạm Ngũ Lão' },
    { code: '00038', name: 'Phường Tân Định' },
  ],
  '02-013': [ // Bình Thạnh, HCM
    { code: '00040', name: 'Phường 1' },
    { code: '00041', name: 'Phường 2' },
    { code: '00042', name: 'Phường 3' },
    { code: '00043', name: 'Phường 5' },
    { code: '00044', name: 'Phường 6' },
    { code: '00045', name: 'Phường 7' },
    { code: '00046', name: 'Phường 11' },
    { code: '00047', name: 'Phường 12' },
    { code: '00048', name: 'Phường 13' },
    { code: '00049', name: 'Phường 14' },
    { code: '00050', name: 'Phường 15' },
    { code: '00051', name: 'Phường 17' },
    { code: '00052', name: 'Phường 19' },
    { code: '00053', name: 'Phường 21' },
    { code: '00054', name: 'Phường 22' },
    { code: '00055', name: 'Phường 24' },
    { code: '00056', name: 'Phường 25' },
    { code: '00057', name: 'Phường 26' },
    { code: '00058', name: 'Phường 27' },
    { code: '00059', name: 'Phường 28' },
  ],
  '01-005': [ // Cầu Giấy, Hà Nội
    { code: '00060', name: 'Phường Dịch Vọng' },
    { code: '00061', name: 'Phường Dịch Vọng Hậu' },
    { code: '00062', name: 'Phường Mai Dịch' },
    { code: '00063', name: 'Phường Nghĩa Đô' },
    { code: '00064', name: 'Phường Nghĩa Tân' },
    { code: '00065', name: 'Phường Quan Hoa' },
    { code: '00066', name: 'Phường Trung Hòa' },
    { code: '00067', name: 'Phường Yên Hòa' },
  ],
  // Lưu ý: Dữ liệu địa chỉ đầy đủ sẽ cần thêm nhiều quận/huyện và xã/phường
  // Hiện tại chỉ có dữ liệu mẫu cho một số khu vực phổ biến
};

// Helper functions
export const getDistrictsByProvince = (provinceCode) => {
  return districts[provinceCode] || [];
};

export const getWardsByDistrict = (provinceCode, districtCode) => {
  const key = `${provinceCode}-${districtCode}`;
  return wards[key] || [];
};

export const searchProvinces = (query) => {
  if (!query) return vietnamProvinces;
  const lowerQuery = query.toLowerCase();
  return vietnamProvinces.filter(p => 
    p.name.toLowerCase().includes(lowerQuery) ||
    p.code.includes(query)
  );
};

export const searchDistricts = (provinceCode, query) => {
  const districtList = getDistrictsByProvince(provinceCode);
  if (!query) return districtList;
  const lowerQuery = query.toLowerCase();
  return districtList.filter(d => 
    d.name.toLowerCase().includes(lowerQuery) ||
    d.code.includes(query)
  );
};

export const searchWards = (provinceCode, districtCode, query) => {
  const wardList = getWardsByDistrict(provinceCode, districtCode);
  if (!query) return wardList;
  const lowerQuery = query.toLowerCase();
  return wardList.filter(w => 
    w.name.toLowerCase().includes(lowerQuery) ||
    w.code.includes(query)
  );
};

