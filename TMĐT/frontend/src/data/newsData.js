const THEMES = [
  { category: 'Sản phẩm', img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&q=80&auto=format&fit=crop' },
  { category: 'Hướng dẫn', img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80&auto=format&fit=crop' },
  { category: 'Khuyến mãi', img: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?w=1200&q=80&auto=format&fit=crop' },
  { category: 'Cửa hàng', img: 'https://images.unsplash.com/photo-1545235617-7a0f4f9d1b9a?w=1200&q=80&auto=format&fit=crop' }
];

const projectSnippets = [
  'Ra mắt bộ sưu tập laptop hiệu năng cao cho học sinh & doanh nghiệp.',
  'Hướng dẫn chọn RAM và ổ cứng phù hợp cho nhu cầu thiết kế đồ họa.',
  'Chương trình đổi cũ lấy mới: tiết kiệm đến 30% cho khách hàng thân thiết.',
  'Mở cửa hàng mới tại Hà Nội với ưu đãi khai trương.',
  'Mẹo kéo dài thời lượng pin và bảo quản laptop trong mùa nóng.',
  'So sánh chuột gaming: chọn lựa cho từng ngân sách.',
  'Cập nhật chính sách bảo hành 2 năm cho sản phẩm điện tử.',
  'Hướng dẫn mua trả góp: giấy tờ và thủ tục nhanh gọn.'
];

export const sampleArticles = Array.from({ length: 100 }).map((_, i) => {
  const idx = i + 1;
  const theme = THEMES[i % THEMES.length];
  const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
  const category = theme.category;
  const title = `${category} - ${projectSnippets[i % projectSnippets.length].slice(0, 40)}${idx}`;
  return {
    id: `sample-${idx}`,
    title,
    date: date.toISOString(),
    excerpt: `${projectSnippets[i % projectSnippets.length]} Tin chi tiết số ${idx} dành cho khách hàng TechStore.`,
    content: `${projectSnippets[i % projectSnippets.length]}\n\nĐây là phần nội dung chi tiết dùng để giới thiệu tính năng, hướng dẫn và khuyến mãi dành cho dự án TechStore. Bài viết mẫu số ${idx} cung cấp thông tin cụ thể để khách hàng hiểu rõ hơn về sản phẩm và dịch vụ.`,
    image: `${theme.img}`,
    category,
    tags: [category, 'TechStore', idx % 2 === 0 ? 'Khuyến mãi' : 'Hướng dẫn'],
    readTime: `${4 + (i % 6)} phút`
  };
});

export default sampleArticles;
