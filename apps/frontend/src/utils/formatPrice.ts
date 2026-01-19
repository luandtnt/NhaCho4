/**
 * Format price according to Vietnamese standards
 */

export const formatPrice = (price: number, unit: string): string => {
  const formatted = new Intl.NumberFormat('vi-VN').format(price);
  const unitMap: Record<string, string> = {
    'MONTH': 'tháng',
    'NIGHT': 'đêm',
    'HOUR': 'giờ',
    'DAY': 'ngày',
    'WEEK': 'tuần',
    'YEAR': 'năm',
  };
  
  const unitText = unitMap[unit] || unit.toLowerCase();
  return `${formatted} ₫/${unitText}`;
};

/**
 * Format price with short notation (millions)
 * Example: 12000000 -> "12 triệu/tháng"
 */
export const formatPriceShort = (price: number, unit: string): string => {
  const unitMap: Record<string, string> = {
    'MONTH': 'tháng',
    'NIGHT': 'đêm',
    'HOUR': 'giờ',
    'DAY': 'ngày',
    'WEEK': 'tuần',
    'YEAR': 'năm',
  };
  
  const unitText = unitMap[unit] || unit.toLowerCase();
  
  // >= 1 billion (tỷ)
  if (price >= 1000000000) {
    const billions = price / 1000000000;
    return `${billions.toFixed(billions >= 10 ? 0 : 1)} tỷ/${unitText}`;
  }
  
  // >= 1 million (triệu)
  if (price >= 1000000) {
    const millions = price / 1000000;
    return `${millions.toFixed(millions >= 10 ? 0 : 1)} triệu/${unitText}`;
  }
  
  // < 1 million (nghìn)
  if (price >= 1000) {
    const thousands = price / 1000;
    return `${thousands.toFixed(0)} nghìn/${unitText}`;
  }
  
  // < 1000
  return `${price} ₫/${unitText}`;
};

/**
 * Format location to short form
 * Example: "123 Nguyen Hue, Ward 1, District 1, Ho Chi Minh" -> "Quận 1, TP.HCM"
 */
export const formatLocation = (province?: string, district?: string): string => {
  if (!province && !district) return '';
  
  const parts: string[] = [];
  
  if (district) {
    parts.push(district);
  }
  
  if (province) {
    // Shorten common province names
    const provinceShort = province
      .replace('Thành phố', 'TP.')
      .replace('Tỉnh', '')
      .trim();
    parts.push(provinceShort);
  }
  
  return parts.join(', ');
};
