import React from 'react';

export default function Contact() {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState(null);
  const [faqOpen, setFaqOpen] = React.useState(null);

  const FAQS = [
    { q: 'Làm sao để đổi trả sản phẩm?', a: 'Bạn có thể mang sản phẩm đến cửa hàng trong vòng 7 ngày hoặc liên hệ hòm thư hỗ trợ để được hướng dẫn thủ tục đổi trả.' },
    { q: 'Thời gian giao hàng mất bao lâu?', a: 'Giao hàng trong 2-5 ngày làm việc tuỳ khu vực. Khu vực nội thành có thể giao trong ngày.' },
    { q: 'Cửa hàng có hỗ trợ trả góp?', a: 'Có. Chúng tôi hỗ trợ trả góp qua nhiều đối tác tài chính với hồ sơ nhanh gọn.' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !message) {
      setResult({ error: 'Vui lòng nhập email và nội dung' });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      // Try to call backend if exists; otherwise simulate success
      if (window.fetch && window.location.hostname === 'localhost') {
        const res = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, message }),
        });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(payload?.error || 'Lỗi gửi liên hệ');
        setResult({ success: payload.message || 'Gửi thành công. Chúng tôi sẽ liên hệ sớm.' });
      } else {
        // Frontend-only mode: simulate
        await new Promise(r => setTimeout(r, 600));
        setResult({ success: 'Gửi thành công (chế độ demo).' });
      }
      setName(''); setEmail(''); setMessage('');
    } catch (err) {
      setResult({ error: err.message || 'Có lỗi' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <h1 className="text-3xl font-bold mb-2">Liên hệ TechStore</h1>
          <p className="text-gray-600 mb-6">Chúng tôi sẵn sàng hỗ trợ bạn — hỏi đáp, khiếu nại, hợp tác kinh doanh và tư vấn sản phẩm.</p>

          <div className="space-y-4 bg-white p-6 rounded-lg shadow">
            <div>
              <h3 className="text-sm font-semibold text-gray-700">Địa chỉ</h3>
              <p className="text-gray-600">Số 123, Đường Công nghệ, Quận Hai Bà Trưng, Hà Nội</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700">Điện thoại</h3>
              <p className="text-gray-600">(024) 0123 4567 — Hotline: 0909 123 456</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700">Email</h3>
              <p className="text-gray-600">support@techstore.example</p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700">Giờ mở cửa</h3>
              <ul className="text-gray-600 text-sm mt-2 space-y-1">
                <li>Thứ 2 - Thứ 6: 08:30 — 20:00</li>
                <li>Thứ 7: 09:00 — 18:00</li>
                <li>Chủ nhật: 09:00 — 17:00</li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-700">Kênh hỗ trợ</h3>
              <div className="flex items-center gap-3 mt-2">
                <a className="text-sm text-gray-500 hover:text-brand-600">Facebook</a>
                <a className="text-sm text-gray-500 hover:text-brand-600">Zalo</a>
                <a className="text-sm text-gray-500 hover:text-brand-600">Instagram</a>
              </div>
            </div>
          </div>

          <div className="mt-6 bg-white rounded-lg shadow overflow-hidden">
            <iframe
              title="TechStore location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3723.5!2d105.8406!3d21.0056!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ab8e4b0c4bcd%3A0x1234567890abcdef!2sHanoi!5e0!3m2!1sen!2s!4v1600000000000!5m2!1sen!2s"
              className="w-full h-48 border-0"
              loading="lazy"
            />
          </div>

          <div className="mt-6 bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-3">Câu hỏi thường gặp</h3>
            <div className="space-y-2">
              {FAQS.map((f, i) => (
                <div key={i} className="border rounded">
                  <button
                    onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                    className="w-full text-left px-4 py-3 flex items-center justify-between"
                  >
                    <span className="font-medium">{f.q}</span>
                    <span className="text-gray-500">{faqOpen === i ? '−' : '+'}</span>
                  </button>
                  {faqOpen === i && (
                    <div className="px-4 pb-3 text-gray-600">{f.a}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-2">Gửi yêu cầu hỗ trợ</h2>
            <p className="text-gray-600 mb-6">Mô tả chi tiết vấn đề để chúng tôi hỗ trợ nhanh nhất.</p>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700">Tên</label>
                <input value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" placeholder="Tên của bạn" />
              </div>

              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input value={email} onChange={e => setEmail(e.target.value)} type="email" className="mt-1 w-full border rounded px-3 py-2" placeholder="Email liên hệ" required />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Tiêu đề</label>
                <input className="mt-1 w-full border rounded px-3 py-2" placeholder="Tiêu đề vấn đề (ví dụ: Yêu cầu bảo hành)" />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Nội dung</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} rows={8} className="mt-1 w-full border rounded px-3 py-2" placeholder="Mô tả chi tiết vấn đề, kèm theo số đơn hàng nếu có" required />
              </div>

              <div className="md:col-span-2 flex items-center gap-3">
                <button type="submit" disabled={loading} className="px-6 py-3 bg-brand-600 text-white rounded hover:bg-brand-700 disabled:opacity-60">
                  {loading ? 'Đang gửi...' : 'Gửi yêu cầu'}
                </button>
                <button type="button" onClick={() => { setName(''); setEmail(''); setMessage(''); setResult(null); }} className="px-4 py-3 border rounded">Xóa</button>
                {result?.success && <div className="text-green-700">{result.success}</div>}
                {result?.error && <div className="text-red-700">{result.error}</div>}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
