import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth.jsx";
import { useState, useEffect } from "react";

const API_BASE = "http://localhost:4000/api";

export default function Landing() {
    const { me } = useAuth();
    const navigate = useNavigate();
    const isLoggedIn = !!me;

    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [latestPosts, setLatestPosts] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(true);
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [activeTab, setActiveTab] = useState('top');

    useEffect(() => {
        // Fetch sự kiện sắp diễn ra (public API, không cần token)
        fetch(`${API_BASE}/events?status=upcoming&limit=3`)
            .then(r => r.ok ? r.json() : { data: [] })
            .then(data => {
                const events = Array.isArray(data) ? data : (data.data || data.events || []);
                setUpcomingEvents(events.slice(0, 3));
            })
            .catch(() => setUpcomingEvents([]))
            .finally(() => setLoadingEvents(false));

        // Fetch bài viết/tin tức công khai (public API, không cần token)
        fetch(`${API_BASE}/posts?limit=3`)
            .then(r => r.ok ? r.json() : { data: [] })
            .then(data => {
                const posts = Array.isArray(data) ? data : (data.data || data.posts || []);
                setLatestPosts(posts.slice(0, 3));
            })
            .catch(() => setLatestPosts([]))
            .finally(() => setLoadingPosts(false));
    }, []);

    const handleLoginClick = (e) => {
        if (isLoggedIn) {
            e.preventDefault();
            navigate("/dashboard");
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
    };

    return (
        <div className="landing-page-modern">
            {/* HEADER - Floating Pill */}
            <header className="modern-header">
                <div className="logo-area-modern">
                    <img src="/logo-gia-pha.png" alt="Logo Gia Phả Đại Việt" className="logo-img-modern" onError={(e) => { e.target.style.display = 'none'; }} />
                </div>

                <nav className="modern-nav">
                    <ul className="nav-links-modern">
                        <li><a href="#top" className={activeTab === 'top' ? 'active' : ''} onClick={() => setActiveTab('top')}>Cơ bản</a></li>
                        <li><a href="#features" className={activeTab === 'features' ? 'active' : ''} onClick={() => setActiveTab('features')}>Tính năng</a></li>
                        <li><a href="#features-table" className={activeTab === 'details' ? 'active' : ''} onClick={() => setActiveTab('details')}>Chi tiết</a></li>
                    </ul>
                </nav>

                <div className="header-right-modern">
                    {isLoggedIn ? (
                        <Link to="/dashboard" className="btn-modern-solid">Hệ thống</Link>
                    ) : (
                        <Link to="/login" className="btn-modern-solid" onClick={handleLoginClick}>Đăng nhập</Link>
                    )}
                </div>
            </header>

            {/* HERO SECTION - Centered Showcase */}
            <section id="top" className="hero-section-modern">
                <div className="landing-container hero-inner-modern">
                    <div className="hero-content-modern">
                        <h3 className="subtitle-modern">Nền tảng Gia phả Thông minh</h3>
                        <h1 className="title-modern">Kết nối mọi thế hệ vượt không gian và thời gian.</h1>
                        <ul className="features-list-modern">
                            <li><i className="bi bi-check-circle-fill"></i> Nhanh chóng</li>
                            <li><i className="bi bi-check-circle-fill"></i> Bảo mật</li>
                            <li><i className="bi bi-check-circle-fill"></i> Đa nền tảng</li>
                        </ul>
                        <div className="hero-buttons-modern">
                            {isLoggedIn ? (
                                <Link to="/dashboard" className="btn-modern-solid">Truy cập hệ thống quản lý</Link>
                            ) : (
                                <>
                                    <Link to="/login" className="btn-modern-solid">Bắt đầu ngay</Link>
                                    <a href="#features" className="btn-modern-outline">Khám phá tính năng</a>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="hero-image-modern">
                        <img src="/banner-intro-1.png" alt="Giao diện phần mềm Gia phả Đại Việt" className="hero-mockup-img-modern"
                            onError={(e) => { e.target.src = '/logo-gia-pha.png'; e.target.style.opacity = '0.3'; }} />
                    </div>
                </div>
            </section>

            {/* FEATURES CHIPS */}
            <section id="features" className="features-section-modern">
                <div className="features-bg-ornament"></div>
                <div className="landing-container position-relative">
                    <h2 className="section-title-modern">Tạo và quản lý phả đồ</h2>
                    <div className="feature-grid-modern">
                        <div className="modern-pill"><i className="bi bi-diagram-3"></i> Cây phả đồ</div>
                        <div className="modern-pill"><i className="bi bi-person-badge"></i> Thông tin thành viên</div>
                        <div className="modern-pill"><i className="bi bi-arrow-down-circle"></i> Xem đời sau</div>
                        <div className="modern-pill"><i className="bi bi-people"></i> Thông tin vợ, chồng, con</div>
                        <div className="modern-pill"><i className="bi bi-zoom-in"></i> Thu nhỏ, phóng to cây</div>
                        <div className="modern-pill"><i className="bi bi-arrows-move"></i> Kéo thả cây gia phả</div>
                        <div className="modern-pill"><i className="bi bi-layout-sidebar-nested"></i> Thu gọn/Mở rộng nhánh</div>
                        <div className="modern-pill"><i className="bi bi-shield-lock"></i> Mã bảo mật phả đồ</div>
                    </div>
                </div>
            </section>

            {/* TỔNG HỢP TÍNH NĂNG */}
            <section id="features-table" className="features-table-section">
                <div className="landing-container">
                    <div className="table-responsive feature-table-wrapper">
                        <table className="feature-detailed-table">
                            <thead>
                                <tr>
                                    <th colSpan="2" className="table-main-header">
                                        <h4>Tổng hợp tính năng nổi bật</h4>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Phả Đồ */}
                                <tr>
                                    <td rowSpan="8" className="category-header">Phả đồ thông minh</td>
                                    <td>Thêm đời đầu và khởi tạo dòng họ dễ dàng</td>
                                </tr>
                                <tr><td>Quản lý chi tiết thành viên: Con cái, Vợ chồng, Bố mẹ, Vợ (chồng) cả, vợ lẽ...</td></tr>
                                <tr><td>Tiểu sử số: Tích hợp ảnh chân dung, thông tin chi tiết, ngày sinh, ngày mất, nơi an nghỉ</td></tr>
                                <tr><td>Sắp xếp thứ tự linh hoạt: Đổi vị trí anh em, con trưởng, con thứ theo mong muốn</td></tr>
                                <tr><td>Sơ đồ hôn phối đa dạng: Hiển thị rõ ràng các mối quan hệ phức tạp</td></tr>
                                <tr><td>Bảo mật Phả đồ: Chế độ riêng tư, chỉ người có mã mật khẩu mới được xem</td></tr>
                                <tr><td>Xưng hô tự động: Xem quan hệ xưng hô chuẩn xác giữa 2 người bất kỳ trên phả đồ</td></tr>
                                <tr><td>Chia sẻ một chạm: Copy link gửi qua Zalo, Facebook để người thân xem ngay</td></tr>

                                {/* Danh sách & Tìm kiếm */}
                                <tr>
                                    <td rowSpan="4" className="category-header">Quản lý nhân khẩu</td>
                                    <td>Danh sách thành viên tập trung, hiển thị chi tiết và khoa học</td>
                                </tr>
                                <tr><td>Tìm kiếm thông minh: Tìm theo tên, địa chỉ, đời, hoặc tên viết tắt</td></tr>
                                <tr><td>Kết nối sơ đồ: Từ danh sách nhảy thẳng đến vị trí người đó trên cây gia phả</td></tr>
                                <tr><td>Trích xuất dữ liệu: Xuất file Excel toàn bộ dòng họ để lưu trữ offline</td></tr>

                                {/* Sự kiện & Truyền thông */}
                                <tr>
                                    <td rowSpan="6" className="category-header">Sự kiện & Kết nối</td>
                                    <td>**Lịch Âm Dương**: Tích hợp lịch vạn niên, tự động nhắc lịch giỗ chạp, lễ tết của dòng họ</td>
                                </tr>
                                <tr><td>**Livestream sự kiện**: Phát trực tiếp các buổi lễ, họp họ cho con cháu ở xa tham gia</td></tr>
                                <tr><td>**Thông báo thông minh**: Tự động gửi thông báo về ngày giỗ, sự kiện sắp diễn ra qua hệ thống</td></tr>
                                <tr><td>Tin tức & Kỷ niệm: Đăng bài viết, chia sẻ cảm xúc, hình ảnh, video kỷ niệm gia đình</td></tr>
                                <tr><td>Thư viện ảnh/video: Lưu trữ kho tư liệu quý giá của dòng họ theo thời gian</td></tr>
                                <tr><td>Bình luận & Tương tác: Gắn kết tình cảm giữa các thành viên trong cộng đồng dòng họ</td></tr>

                                {/* Cấu hình & Chuyên sâu */}
                                <tr>
                                    <td rowSpan="4" className="category-header">Cấu hình & Quản trị</td>
                                    <td>Tạo Phả ký: Ghi chép lịch sử dòng họ một cách trang trọng và chi tiết</td>
                                </tr>
                                <tr><td>Tùy biến hiển thị: Chế độ sơ đồ nằm ngang, đường cong, đường thẳng theo ý thích</td></tr>
                                <tr><td>Cá nhân hóa: Chỉnh sửa Tên, Logo, Banner, vị trí nhà thờ Tộc trên Google Map</td></tr>
                                <tr><td>Tên miền riêng: Sử dụng địa chỉ web riêng (ví dụ: giaphahoNguyen.com) cực kỳ chuyên nghiệp</td></tr>

                                {/* Quản trị & Bảo mật */}
                                <tr>
                                    <td rowSpan="3" className="category-header">Quản trị tối ưu</td>
                                    <td>Phân quyền linh hoạt: Thêm quản trị viên quản lý toàn họ hoặc chỉ quản lý từng nhánh</td>
                                </tr>
                                <tr><td>Bảo vệ dữ liệu: Thành viên được phân quyền không thể tự ý xóa gia phả trái phép</td></tr>
                                <tr><td>Nhật ký hoạt động: Theo dõi mọi thay đổi để đảm bảo tính chính xác và an toàn</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>


            {/* SỰ KIỆN SẮP DIỄN RA */}
            <section id="events" className="events-section-modern">
                <div className="landing-container">

                    <h2 className="section-title-modern">Sự kiện sắp diễn ra</h2>
                    {loadingEvents ? (
                        <div className="loading-placeholder">
                            <div className="spinner-dots"><span></span><span></span><span></span></div>
                            <p>Đang tải sự kiện...</p>
                        </div>
                    ) : upcomingEvents.length === 0 ? (
                        <div className="empty-state-modern">
                            <i className="bi bi-calendar3"></i>
                            <p>Chưa có sự kiện nào được lên lịch. Đăng nhập để tạo sự kiện gia tộc đầu tiên!</p>
                            <Link to="/login" className="btn-modern-solid" style={{ marginTop: '12px', display: 'inline-flex' }}>
                                <i className="bi bi-plus-circle"></i> Tạo sự kiện
                            </Link>
                        </div>
                    ) : (
                        <div className="events-grid">
                            {upcomingEvents.map(ev => (
                                <div key={ev._id || ev.id} className="event-card-modern">
                                    <div className="event-date-badge">
                                        <span className="event-day">{ev.date ? new Date(ev.date).getDate() : '??'}</span>
                                        <span className="event-month">{ev.date ? new Date(ev.date).toLocaleString('vi-VN', { month: 'short' }) : ''}</span>
                                    </div>
                                    <div className="event-info">
                                        <h4 className="event-title">{ev.title || 'Sự kiện gia tộc'}</h4>
                                        <p className="event-desc">{(ev.description || 'Không có mô tả').substring(0, 80)}...</p>
                                        <span className={`event-badge event-type-${ev.type || 'general'}`}>{ev.type || 'Chung'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* TIN TỨC / BÀI VIẾT */}
            <section id="news" className="news-section-modern">
                <div className="landing-container">
                    <h2 className="section-title-modern">Tin tức &amp; chia sẻ cộng đồng</h2>
                    {loadingPosts ? (
                        <div className="loading-placeholder">
                            <div className="spinner-dots"><span></span><span></span><span></span></div>
                            <p>Đang tải bài viết...</p>
                        </div>
                    ) : latestPosts.length === 0 ? (
                        <div className="empty-state-modern">
                            <i className="bi bi-newspaper"></i>
                            <p>Chưa có bài viết nào. Đăng nhập để chia sẻ câu chuyện gia tộc của bạn!</p>
                            <Link to="/login" className="btn-modern-solid" style={{ marginTop: '12px', display: 'inline-flex' }}>
                                <i className="bi bi-pencil"></i> Viết bài
                            </Link>
                        </div>
                    ) : (
                        <div className="news-grid">
                            {latestPosts.map(post => (
                                <div key={post._id || post.id} className="news-card-modern">
                                    {post.imageUrl && (
                                        <div className="news-card-img">
                                            <img src={post.imageUrl} alt={post.title || 'Bài viết'} />
                                        </div>
                                    )}
                                    <div className="news-card-body">
                                        <p className="news-date">{formatDate(post.createdAt)}</p>
                                        <h4 className="news-title">{post.title || (post.content || '').substring(0, 50) || 'Bài viết gia tộc'}</h4>
                                        <p className="news-excerpt">{(post.content || '').substring(0, 100)}...</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* LIÊN HỆ */}
            <section id="contact" className="contact-section-modern">
                <div className="landing-container contact-inner">
                    <div className="contact-text">
                        <h2>Sẵn sàng lưu giữ lịch sử dòng họ?</h2>
                        <p>Liên hệ với chúng tôi để được hướng dẫn tạo gia phả trực tuyến cho dòng họ của bạn.</p>
                        <div className="contact-info-list">
                            <div className="contact-info-item">
                                <i className="bi bi-telephone-fill" style={{ color: '#00A13A' }}></i>
                                <a href="tel:0888880043">08 8888 0043</a> – Giờ làm việc 8:30 – 17:30
                            </div>
                            <div className="contact-info-item">
                                <i className="bi bi-envelope-fill" style={{ color: '#d96b3a' }}></i>
                                <a href="mailto:hotro@giaphadaiviet.vn">hotro@giaphadaiviet.vn</a>
                            </div>
                            <div className="contact-info-item">
                                <i className="bi bi-geo-alt-fill" style={{ color: '#e74c3c' }}></i>
                                57 Nguyễn Thị Định, An Hải Bắc, Sơn Trà, TP. Đà Nẵng
                            </div>
                        </div>
                    </div>
                    <div className="contact-cta">
                        {isLoggedIn ? (
                            <Link to="/dashboard" className="btn-cta-large"><i className="bi bi-speedometer2"></i> Vào hệ thống</Link>
                        ) : (
                            <Link to="/login" className="btn-cta-large"><i className="bi bi-person-plus"></i> Đăng nhập ngay</Link>
                        )}
                        <p className="cta-note">Miễn phí tư vấn – Hỗ trợ tận tình</p>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="footer-modern-detailed">
                <div className="footer-bg-image"></div>
                <div className="landing-container footer-content-wrapper">
                    <div className="footer-row">
                        <div className="footer-col footer-col-info">
                            <div className="footer-logo">
                                <Link to="/">
                                    <img src="/logo-gia-pha.png" alt="Logo Gia Phả" className="footer-logo-img"
                                        onError={(e) => { e.target.style.display = 'none'; }} />
                                    <span className="footer-logo-text">GIA PHẢ ĐẠI VIỆT <span className="logo-cursive">Online</span></span>
                                </Link>
                            </div>
                            <div className="footer-description">
                                <p>Giữ gìn và phát huy gia phả là giữ lấy cho con cháu đời sau một mảng văn hóa độc đáo gắn liền với đạo hiếu.</p>
                                <p>Các dòng họ là một phần của lịch sử dân tộc, qua đó, những người dựng gia phả đã giải tỏa nhiều tồn nghi do quá khứ để lại hay tìm được mộ phần của những người có công với nước vốn thất lạc hàng trăm năm.</p>
                                <a href="http://online.gov.vn/Home/WebDetails/125707" target="_blank" rel="noreferrer">
                                    <img src="/bct-logo.png" alt="Đã thông báo Bộ Công Thương" className="bct-logo"
                                        onError={(e) => { e.target.style.display = 'none'; }} />
                                </a>
                            </div>
                        </div>

                        <div className="footer-col footer-col-links">
                            <h3 className="footer-title">Thông tin chung</h3>
                            <ul className="footer-menu">
                                <li><a href="#payment">Chính sách thanh toán</a></li>
                                <li><a href="#tos">Quy định sử dụng dịch vụ</a></li>
                                <li><a href="#privacy">Chính sách bảo mật</a></li>
                                <li><a href="#refund">Chính sách hoàn tiền</a></li>
                                <li><a href="#contact">Liên hệ</a></li>
                            </ul>
                        </div>

                        <div className="footer-col footer-col-fb">
                            <h3 className="footer-title">Facebook liên hệ</h3>
                            <div className="fb-iframe-wrapper">
                                <iframe
                                    src="https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2Fpham.uc.quann&tabs&width=340&height=130&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true"
                                    width="340" height="130"
                                    style={{ border: 'none', overflow: 'hidden' }}
                                    scrolling="no" frameBorder="0"
                                    allowFullScreen={true}
                                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                                    title="Facebook Cá Nhân"
                                ></iframe>
                            </div>
                        </div>
                    </div>

                    <div className="footer-company-info text-center">
                        <p>Công ty TNHH MTV Công nghệ Đại Việt Số <br />
                            GPKD số 0401765630 - Sở KH &amp; ĐT TP Đà Nẵng cấp ngày: 18/05/2016 <br />
                            Địa Chỉ: 257 Lê Duẩn, P. Chính Gián, Q. Thanh khê, Tp. Đà Nẵng
                        </p>
                    </div>

                    <div className="footer-copyright text-center">
                        Copyright 2024 © <a href="https://cloudzone.vn" target="_blank" rel="noreferrer" className="fw-bold">Cloudzone</a>. All Rights Reserved
                    </div>
                </div>
            </footer>
        </div >
    );
}
