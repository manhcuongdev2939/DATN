import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import sampleArticles from '../data/newsData';

const FeaturedSlider = ({ articles }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentSlide(prev => (prev === articles.length - 1 ? 0 : prev + 1));
  }, [articles.length]);

  const prevSlide = () => {
    setCurrentSlide(prev => (prev === 0 ? articles.length - 1 : prev - 1));
  };

  useEffect(() => {
    const slideInterval = setInterval(nextSlide, 5000);
    return () => clearInterval(slideInterval);
  }, [nextSlide]);

  if (!articles || articles.length === 0) {
    return null;
  }

  const activeArticle = articles[currentSlide];

  return (
    <div className="relative w-full h-96 rounded-lg overflow-hidden shadow-2xl mb-12">
      {/* Slide Image */}
      <img
        src={activeArticle.image || sampleArticles[0].image}
        alt={activeArticle.title}
        className="w-full h-full object-cover transition-transform duration-500 ease-in-out transform scale-105"
        key={currentSlide} // Re-trigger animations
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />

      {/* Slide Content */}
      <div className="absolute bottom-0 left-0 p-8 text-white">
        <span className="text-sm bg-brand-600 px-2 py-1 rounded">{activeArticle.category}</span>
        <h2 className="text-3xl font-bold mt-2 line-clamp-2">{activeArticle.title}</h2>
        <p className="mt-2 text-gray-200 line-clamp-2">{activeArticle.excerpt}</p>
        <Link to={`/news/${activeArticle.id}`} state={{ article: activeArticle }} className="mt-4 inline-block font-semibold text-white border-b-2 border-brand-500 hover:bg-brand-500 px-2 py-1 transition-colors">
          Đọc tiếp →
        </Link>
      </div>

      {/* Navigation Buttons */}
      <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition-colors z-10">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
      </button>
      <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60 transition-colors z-10">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
      </button>

      {/* Dot Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
        {articles.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full ${currentSlide === index ? 'bg-white' : 'bg-white/50'} transition-all`}
          />
        ))}
      </div>
    </div>
  );
};


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
  
  const featuredArticles = articles.slice(0, 5);

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
      <FeaturedSlider articles={featuredArticles} />

      <h1 className="text-2xl font-bold mb-4">Tất cả tin tức</h1>
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

      <div className="space-y-8">
        {visible.map((a, idx) => (
          <article
            key={a.id}
            className="bg-white rounded-lg shadow-sm hover:shadow-md overflow-hidden transform hover:-translate-y-1 transition-transform duration-300 ease-out flex flex-col md:flex-row animate-fade-in"
            style={{ animationDelay: `${(idx % perPage) * 100}ms` }}
          >
            <div className="md:w-1/3 h-48 md:h-auto overflow-hidden">
              <img src={a.image || sampleArticles[0].image} alt={a.title} className="w-full h-full object-cover" loading="lazy" />
            </div>
            <div className="p-6 flex flex-col justify-between md:w-2/3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-brand-600 font-semibold">{a.category}</span>
                  <time className="text-sm text-gray-500">{a.date ? new Date(a.date).toLocaleDateString('vi-VN') : ''}</time>
                </div>
                <h3 className="text-xl font-bold line-clamp-2 mb-2 text-gray-800">{a.title}</h3>
                <p className="text-gray-600 mt-2 text-sm line-clamp-3">{a.excerpt}</p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div className="flex gap-2">
                  {(a.tags || []).slice(0, 3).map(tag => (
                    <span key={tag} className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">{tag}</span>
                  ))}
                </div>
                <Link to={`/news/${a.id}`} state={{ article: a }} className="text-brand-600 font-semibold hover:text-brand-700 transition-colors">
                  Đọc tiếp →
                </Link>
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
