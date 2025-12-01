import React from 'react';

export default function Contact() {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !message) {
      setResult({ error: 'Vui lòng nhập email và nội dung' });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || 'Lỗi');
      setResult({ success: payload.message || 'Gửi thành công' });
      setName(''); setEmail(''); setMessage('');
    } catch (err) {
      setResult({ error: err.message || 'Có lỗi' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-4">Liên hệ với chúng tôi</h1>
      <p className="text-gray-600 mb-6">Nếu bạn có câu hỏi, góp ý hoặc cần hỗ trợ, hãy gửi cho chúng tôi tin nhắn.</p>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
        <div>
          <label className="block text-sm font-medium text-gray-700">Tên (không bắt buộc)</label>
          <input value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" placeholder="Tên của bạn" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" className="mt-1 w-full border rounded px-3 py-2" placeholder="Email của bạn" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Nội dung</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={6} className="mt-1 w-full border rounded px-3 py-2" placeholder="Nhập câu hỏi hoặc tin nhắn của bạn" required />
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" disabled={loading} className="px-4 py-2 bg-brand-600 text-white rounded hover:bg-brand-700 disabled:opacity-60">
            {loading ? 'Đang gửi...' : 'Gửi liên hệ'}
          </button>
          {result?.success && <div className="text-green-700">{result.success}</div>}
          {result?.error && <div className="text-red-700">{result.error}</div>}
        </div>
      </form>
    </div>
  );
}
