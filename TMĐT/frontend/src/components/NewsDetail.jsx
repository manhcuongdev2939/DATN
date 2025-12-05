import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import sampleArticles from '../data/newsData';

export default function NewsDetail() {
  const { id } = useParams();
  const location = useLocation();
  const [article, setArticle] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 1. Try to get the article from the state passed via React Router Link
    if (location.state?.article) {
      setArticle(location.state.article);
      return;
    }

    // 2. Fallback: Find the article in the local data if not passed in state
    const foundArticle = sampleArticles.find(a => String(a.id) === id);
    
    if (foundArticle) {
      setArticle(foundArticle);
    } else {
      setError('Không tìm thấy bài viết bạn yêu cầu.');
    }
    
    // Scroll to top on component mount
    window.scrollTo(0, 0);

  }, [id, location.state]);

  if (error || !article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-4 text-red-600">Lỗi</h1>
        <p className="text-gray-600 mb-4">{error || 'Không tìm thấy bài viết.'}</p>
        <Link to="/news" className="px-4 py-2 bg-brand-600 text-white rounded hover:bg-brand-700">
          Quay lại trang Tin tức
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12 animate-fade-in">
      <Link to="/news" className="text-sm text-brand-600 hover:underline">← Quay lại danh sách</Link>
      
      <article className="mt-4">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">{article.title}</h1>
        
        <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
          <span>{article.category}</span>
          <span>•</span>
          <time>{article.date ? new Date(article.date).toLocaleDateString('vi-VN') : ''}</time>
          <span>•</span>
          <span>{article.readTime}</span>
        </div>

        {article.image && (
          <img 
            src={article.image} 
            alt={article.title} 
            className="w-full h-auto max-h-96 object-cover rounded-lg mt-6 shadow-lg"
          />
        )}

        <div 
          className="prose prose-lg max-w-none mt-8 text-gray-800"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        <div className="mt-8 pt-6 border-t">
          <h3 className="text-lg font-bold">Tags</h3>
          <div className="flex flex-wrap gap-2 mt-2">
            {(article.tags || []).map(tag => (
              <span key={tag} className="text-xs bg-gray-100 px-3 py-1 rounded-full text-gray-600">{tag}</span>
            ))}
          </div>
        </div>
      </article>
    </div>
  );
}
