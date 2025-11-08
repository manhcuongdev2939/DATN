import React from 'react';
import './App.css';

export default function App() {
  return (
    <>
      {/* Brands */}
      <section className="brands">
        <div className="container">
          <div className="brand-list">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg"
              alt="Apple"
              className="brand-logo apple"
            />
            <span className="brand-name samsung">SAMSUNG</span>
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/2/29/Xiaomi_logo.svg"
              alt="Xiaomi"
              className="brand-logo xiaomi"
            />
            <span className="brand-name oppo">OPPO</span>
            <img
              src="https://images.seeklogo.com/logo-png/34/1/realme-logo-png_seeklogo-349344.png"
              alt="Realme"
              className="brand-logo realme"
            />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="main">
        <div className="container">
          <div className="content-grid">
            <section className="contact-info">
              <p className="desc">
                Đang tìm thế – mcm – với trang liên hệ của mcm – pci chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ mọi
                thắc mắc của quý khách hàng. Nếu bạn cần tư vấn về sản phẩm hoặc có bất kỳ thắc mắc nào, trong mua vực
                thiết bị điện tử, tại sựtượng và hài lòng của khách hàng là yếu tố quan trọng nhất, vì vậy, hãy luôn
                mang lại trải nghiệm dịch vụ hoàn hảo. Kết nối chúng tôi an, để chúng tôi là trái nghiệm dịch vụ tốt
                nhất!
              </p>
              <div className="info-block">
                <h3>Khách hàng có thể liên hệ trực tiếp với chúng tôi qua</h3>
                <p>
                  <strong>Địa chỉ trụ sở chính:</strong>
                  <br />
                  Ha 25 đường Phạm Văn Đồng, quận Cầu Giấy, Hà Nội, Việt Nam
                  <br />
                  <strong>Hotline hỗ trợ khách hàng:</strong>
                  <br />
                  1800 6668 (miễn phí cước gọi)
                  <br />
                  <strong>Thời gian làm việc:</strong> 8h00 – 22h00 tất cả các ngày trong tuần, kể cả Chủ nhật và ngày
                  lễ
                  <br />
                  <strong>Email:</strong>
                  <br />
                  support@mcm.vn – Hỗ trợ kỹ thuật, bảo hành
                  <br />
                  contact@mcm.vn – Hợp tác kinh doanh, góp ý dịch vụ
                </p>
                <div className="social">
                  <p>Fanpage:</p>
                  <p className="link">facebook.com/mcm.vietnam</p>
                  <p>Tài khoản hỗ trợ khách hàng:</p>
                  <p className="link">Zalo mcm official</p>
                </div>
              </div>
            </section>

            <aside className="form-card">
              <h3>Liên hệ với chúng tôi qua</h3>
              <form>
                <input type="text" placeholder="Họ và tên" />
                <input type="email" placeholder="Email" />
                <input type="tel" placeholder="Số điện thoại" />
                <textarea placeholder="Nội dung cần liên hệ" rows="4"></textarea>
                <button type="submit" className="submit-btn">
                  Gửi
                </button>
              </form>
            </aside>
          </div>
        </div>
      </main>

      <footer className="footer-note">
        Activate Windows
        <br />
        Go to Settings to activate Windows.
      </footer>
    </>
  );
}
