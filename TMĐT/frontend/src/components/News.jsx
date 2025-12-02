import React from 'react';
import { Link } from 'react-router-dom';
import sampleArticles from '../data/newsData';

// sampleArticles imported from data/newsData

export default function News() {
  const [articles, setArticles] = React.useState(sampleArticles);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [selected, setSelected] = React.useState(null);
  const [page, setPage] = React.useState(1);
  const [perPage] = React.useState(12);
  const [hasMore, setHasMore] = React.useState(true);
  const [search, setSearch] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('Tất cả');

  React.useEffect(() => {
    // Frontend-only mode: always use local sample articles so page works without backend
    setArticles(sampleArticles);
    setHasMore(sampleArticles.length > perPage);
    setLoading(false);
  }, [perPage]);

  // apply search and category filter
  const lowered = search.trim().toLowerCase();
  const filtered = articles.filter(a => {
    if (categoryFilter !== 'Tất cả' && a.category !== categoryFilter) return false;
    if (!lowered) return true;
    return (a.title || '').toLowerCase().includes(lowered) || (a.excerpt || '').toLowerCase().includes(lowered) || (a.tags || []).join(' ').toLowerCase().includes(lowered);
  });
  const visible = filtered.slice(0, page * perPage);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-4">Tin tức</h1>
      {loading && <div className="text-gray-600">Đang tải...</div>}
      {error && <div className="text-sm text-yellow-700 mb-4">{error}</div>}

      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Tìm tin theo tiêu đề, nội dung hoặc tag..." className="w-full border rounded px-3 py-2" />
        </div>
        <div className="w-56">
          <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }} className="w-full border rounded px-3 py-2">
            <option>Tất cả</option>
            {[...new Set(articles.map(a => a.category).filter(Boolean))].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visible.map((a, idx) => (
          <article
            key={a.id}
            className="bg-white rounded shadow-sm hover:shadow-md overflow-hidden transform hover:-translate-y-1 transition-transform duration-200 ease-out animate-scale-in"
            style={{ animationDelay: `${(idx % perPage) * 80}ms` }}
          >
            <div className="h-40 w-full bg-gray-100 overflow-hidden">
              <img src={a.image || sampleArticles[0].image} alt="thumb" className="w-full h-full object-cover" loading="lazy" />
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-md font-semibold line-clamp-2">{a.title}</h3>
                  <div className="text-xs text-gray-500 mt-1">{a.category} • {a.readTime}</div>
                </div>
                <time className="text-sm text-gray-400">{a.date ? new Date(a.date).toLocaleDateString('vi-VN') : ''}</time>
              </div>
              <p className="text-gray-700 mt-3 text-sm line-clamp-3">{a.excerpt}</p>
                <div className="mt-3 flex items-center justify-between">
                <div className="flex gap-2">
                  {(a.tags || []).slice(0,3).map(tag => (
                    <span key={tag} className="text-xs bg-gray-100 px-2 py-1 rounded">{tag}</span>
                  ))}
                </div>
                <Link to={`/news/${a.id}`} className="text-brand-600 text-sm font-medium hover:underline">Đọc tiếp →</Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6 flex justify-center">
        {visible.length < articles.length && (
          <button onClick={() => setPage(p => p + 1)} className="px-4 py-2 bg-brand-600 text-white rounded">Tải thêm</button>
        )}
        {visible.length >= articles.length && (
          <div className="text-sm text-gray-500">Không còn tin nào khác.</div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white max-w-3xl w-full p-6 rounded shadow-lg animate-scale-in">
            <div className="flex justify-between items-start">
              <h3 className="text-xl font-bold">{selected.title}</h3>
              <button onClick={() => setSelected(null)} className="text-gray-500">Đóng</button>
            </div>
            <p className="text-sm text-gray-500 mt-1">{selected.date ? new Date(selected.date).toLocaleDateString('vi-VN') : ''}</p>
            <div className="mt-4 text-gray-800 whitespace-pre-wrap">{selected.content}</div>
          </div>
        </div>
      )}
    </div>
  );
}
