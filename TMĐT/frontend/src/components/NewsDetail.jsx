import React from 'react';
import { useParams, Link } from 'react-router-dom';
import sampleArticles from '../data/newsData';

export default function NewsDetail() {
  const { id } = useParams();
  const article = sampleArticles.find((a) => String(a.id) === String(id));

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold mb-4">Tin không tìm thấy</h1>
        <p className="text-gray-600 mb-4">Không tìm thấy bài viết với id này.</p>
        <Link to="/news" className="text-brand-600 hover:underline">Quay lại trang Tin tức</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link to="/news" className="text-sm text-gray-600 hover:underline">← Quay lại</Link>
      <h1 className="text-3xl font-bold mt-4">{article.title}</h1>
      <div className="flex items-center gap-3 mt-2">
        <span className="text-sm text-gray-500">{article.category}</span>
        <span className="text-sm text-gray-400">•</span>
        <time className="text-sm text-gray-500">{new Date(article.date).toLocaleDateString('vi-VN')}</time>
        <span className="ml-auto text-sm text-gray-400">{article.readTime}</span>
      </div>

      {article.image && (
        <div className="mt-6 rounded overflow-hidden">
          <img src={article.image} alt={article.title} className="w-full h-64 object-cover rounded" />
        </div>
      )}

      <div className="prose prose-sm sm:prose lg:prose-lg mt-6 text-gray-800 whitespace-pre-wrap">
        {article.content}
      </div>

      <div className="mt-6 flex gap-2">
        {(article.tags || []).map((t) => (
          <span key={t} className="text-xs bg-gray-100 px-2 py-1 rounded">{t}</span>
        ))}
      </div>
    </div>
  );
}
