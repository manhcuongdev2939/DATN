import React from 'react';

const sampleArticles = [
  {
    id: '1',
    title: 'Mở bán laptop mới - Ưu đãi hấp dẫn',
    date: '2025-11-20',
    excerpt: 'Chúng tôi vừa cập nhật bộ sưu tập laptop mới với nhiều ưu đãi cho khách hàng đầu tiên.',
    content: 'Chi tiết về chương trình khuyến mãi, thông số kỹ thuật và hướng dẫn mua hàng.'
  },
  {
    id: '2',
    title: 'Hướng dẫn bảo quản pin điện thoại',
    date: '2025-10-05',
    excerpt: 'Một vài mẹo đơn giản giúp pin điện thoại của bạn bền hơn theo thời gian.',
    content: 'Nội dung đầy đủ về cách sạc, nhiệt độ bảo quản và các lưu ý khi sử dụng.'
  }
];

export default function News() {
  const [articles, setArticles] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [selected, setSelected] = React.useState(null);

  React.useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch('/api/news');
        if (!res.ok) throw new Error('Không có nguồn tin');
        const data = await res.json();
        if (mounted && Array.isArray(data)) {
          setArticles(data);
        } else if (mounted) {
          setArticles(sampleArticles);
        }
      } catch (err) {
        if (mounted) {
          setError('Không tải được tin; đang hiển thị nội dung mẫu');
          setArticles(sampleArticles);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-4">Tin tức</h1>
      {loading && <div className="text-gray-600">Đang tải...</div>}
      {error && <div className="text-sm text-yellow-700 mb-4">{error}</div>}
      <div className="space-y-4">
        {articles.map(a => (
          <article key={a.id} className="p-4 border rounded hover:shadow">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-semibold">{a.title}</h2>
              <time className="text-sm text-gray-500">{new Date(a.date).toLocaleDateString('vi-VN')}</time>
            </div>
            <p className="text-gray-700 mt-2">{a.excerpt}</p>
            <div className="mt-3">
              <button onClick={() => setSelected(a)} className="text-brand-600 text-sm font-medium hover:underline">Đọc tiếp →</button>
            </div>
          </article>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white max-w-2xl w-full p-6 rounded shadow-lg">
            <div className="flex justify-between items-start">
              <h3 className="text-xl font-bold">{selected.title}</h3>
              <button onClick={() => setSelected(null)} className="text-gray-500">Đóng</button>
            </div>
            <p className="text-sm text-gray-500 mt-1">{new Date(selected.date).toLocaleDateString('vi-VN')}</p>
            <div className="mt-4 text-gray-800 whitespace-pre-wrap">{selected.content}</div>
          </div>
        </div>
      )}
    </div>
  );
}
