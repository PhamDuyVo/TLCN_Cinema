-- =====================================================================
-- DỮ LIỆU MẪU HỆ THỐNG BÁN VÉ XEM PHIM (TLCN - HCMUTE)
-- Chế độ: CODE-FIRST (Bảng CSDL được Hibernate tự sinh/cập nhật tự động)
-- File này CHỈ chứa dữ liệu mẫu (SEED DATA), không chứa lệnh DDL CREATE TABLE.
-- =====================================================================

USE movie_ticket_system_fixed1;
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------
-- 1. THỂ LOẠI PHIM (genres)
-- ---------------------------------------------------------------------
INSERT INTO genres (id, name) VALUES
(1, 'Hành động'),
(2, 'Tình cảm'),
(3, 'Kinh dị'),
(4, 'Hài kịch'),
(5, 'Hoạt hình'),
(6, 'Khoa học viễn tưởng'),
(7, 'Phiêu lưu'),
(8, 'Tâm lý')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ---------------------------------------------------------------------
-- 2. CỤM RẠP CHIẾU (cinemas)
-- ---------------------------------------------------------------------
INSERT INTO cinemas (id, name, address, city, phone, status) VALUES
(1, 'UTE Cinema Thủ Đức', 'Số 1 Võ Văn Ngân, P. Linh Chiểu, TP. Thủ Đức, TP.HCM', 'TP. Hồ Chí Minh', '02838968641', 'active'),
(2, 'UTE Cinema Vincom Đồng Khởi', 'Tầng 5, TTTM Vincom Đồng Khởi, 72 Lê Thánh Tôn, Bến Nghé, Quận 1, TP.HCM', 'TP. Hồ Chí Minh', '02838228899', 'active'),
(3, 'UTE Cinema Landmark 81', 'Tầng B1, Tòa Landmark 81, 720A Điện Biên Phủ, Phường 22, Bình Thạnh, TP.HCM', 'TP. Hồ Chí Minh', '02836229988', 'active')
ON DUPLICATE KEY UPDATE name = VALUES(name), address = VALUES(address), city = VALUES(city), phone = VALUES(phone), status = VALUES(status);

-- ---------------------------------------------------------------------
-- 3. PHÒNG CHIẾU (rooms)
-- ---------------------------------------------------------------------
INSERT INTO rooms (id, cinema_id, name, room_type, total_seats, status) VALUES
(1, 1, 'Phòng 01 (2D Standard)', '2D', 48, 'active'),
(2, 1, 'Phòng 02 (3D Digital)', '3D', 48, 'active'),
(3, 1, 'Phòng 03 (IMAX Laser)', 'IMAX', 48, 'active'),
(4, 2, 'Phòng VIP 01', '2D', 48, 'active'),
(5, 2, 'Phòng IMAX Grand', 'IMAX', 48, 'active'),
(6, 3, 'Phòng 01 (IMAX Laser)', 'IMAX', 48, 'active')
ON DUPLICATE KEY UPDATE cinema_id = VALUES(cinema_id), name = VALUES(name), room_type = VALUES(room_type), total_seats = VALUES(total_seats), status = VALUES(status);

-- ---------------------------------------------------------------------
-- 4. LOẠI GHẾ (seat_types)
-- ---------------------------------------------------------------------
INSERT INTO seat_types (id, name, price_extra) VALUES
(1, 'standard', 0.00),
(2, 'vip', 15000.00),
(3, 'couple', 35000.00)
ON DUPLICATE KEY UPDATE name = VALUES(name), price_extra = VALUES(price_extra);

-- ---------------------------------------------------------------------
-- 5. DANH SÁCH GHẾ (seats) - Có đầy đủ layout_col phục vụ mô phỏng 3D POV
-- ---------------------------------------------------------------------
-- Phòng 1: 48 ghế (Hàng A, B: Standard; C, D, E: VIP; F: Couple)
INSERT INTO seats (room_id, seat_type_id, row_label, seat_number, layout_col, status) VALUES
-- Hàng A (Standard)
(1, 1, 'A', 1, 1, 'active'), (1, 1, 'A', 2, 2, 'active'), (1, 1, 'A', 3, 3, 'active'), (1, 1, 'A', 4, 4, 'active'),
(1, 1, 'A', 5, 5, 'active'), (1, 1, 'A', 6, 6, 'active'), (1, 1, 'A', 7, 7, 'active'), (1, 1, 'A', 8, 8, 'active'),
-- Hàng B (Standard)
(1, 1, 'B', 1, 1, 'active'), (1, 1, 'B', 2, 2, 'active'), (1, 1, 'B', 3, 3, 'active'), (1, 1, 'B', 4, 4, 'active'),
(1, 1, 'B', 5, 5, 'active'), (1, 1, 'B', 6, 6, 'active'), (1, 1, 'B', 7, 7, 'active'), (1, 1, 'B', 8, 8, 'active'),
-- Hàng C (VIP)
(1, 1, 'C', 1, 1, 'active'), (1, 1, 'C', 2, 2, 'active'), (1, 1, 'C', 3, 3, 'active'), (1, 1, 'C', 4, 4, 'active'),
(1, 1, 'C', 5, 5, 'active'), (1, 1, 'C', 6, 6, 'active'), (1, 1, 'C', 7, 7, 'active'), (1, 1, 'C', 8, 8, 'active'),
-- Hàng D (VIP)
(1, 1, 'D', 1, 1, 'active'), (1, 1, 'D', 2, 2, 'active'), (1, 1, 'D', 3, 3, 'active'), (1, 1, 'D', 4, 4, 'active'),
(1, 1, 'D', 5, 5, 'active'), (1, 1, 'D', 6, 6, 'active'), (1, 1, 'D', 7, 7, 'active'), (1, 1, 'D', 8, 8, 'active'),
-- Hàng E (VIP)
(1, 1, 'E', 1, 1, 'active'), (1, 1, 'E', 2, 2, 'active'), (1, 1, 'E', 3, 3, 'active'), (1, 1, 'E', 4, 4, 'active'),
(1, 1, 'E', 5, 5, 'active'), (1, 1, 'E', 6, 6, 'active'), (1, 1, 'E', 7, 7, 'active'), (1, 1, 'E', 8, 8, 'active'),
-- Hàng F (Couple)
(1, 3, 'F', 1, 1, 'active'), (1, 3, 'F', 2, 2, 'active'), (1, 3, 'F', 3, 3, 'active'), (1, 3, 'F', 4, 4, 'active'),
(1, 3, 'F', 5, 5, 'active'), (1, 3, 'F', 6, 6, 'active'), (1, 3, 'F', 7, 7, 'active'), (1, 3, 'F', 8, 8, 'active'),

-- Phòng 2: 48 ghế tương tự
(2, 1, 'A', 1, 1, 'active'), (2, 1, 'A', 2, 2, 'active'), (2, 1, 'A', 3, 3, 'active'), (2, 1, 'A', 4, 4, 'active'),
(2, 1, 'A', 5, 5, 'active'), (2, 1, 'A', 6, 6, 'active'), (2, 1, 'A', 7, 7, 'active'), (2, 1, 'A', 8, 8, 'active'),
(2, 1, 'B', 1, 1, 'active'), (2, 1, 'B', 2, 2, 'active'), (2, 1, 'B', 3, 3, 'active'), (2, 1, 'B', 4, 4, 'active'),
(2, 1, 'B', 5, 5, 'active'), (2, 1, 'B', 6, 6, 'active'), (2, 1, 'B', 7, 7, 'active'), (2, 1, 'B', 8, 8, 'active'),
(2, 2, 'C', 1, 1, 'active'), (2, 2, 'C', 2, 2, 'active'), (2, 2, 'C', 3, 3, 'active'), (2, 2, 'C', 4, 4, 'active'),
(2, 2, 'C', 5, 5, 'active'), (2, 2, 'C', 6, 6, 'active'), (2, 2, 'C', 7, 7, 'active'), (2, 2, 'C', 8, 8, 'active'),
(2, 2, 'D', 1, 1, 'active'), (2, 2, 'D', 2, 2, 'active'), (2, 2, 'D', 3, 3, 'active'), (2, 2, 'D', 4, 4, 'active'),
(2, 2, 'D', 5, 5, 'active'), (2, 2, 'D', 6, 6, 'active'), (2, 2, 'D', 7, 7, 'active'), (2, 2, 'D', 8, 8, 'active'),
(2, 2, 'E', 1, 1, 'active'), (2, 2, 'E', 2, 2, 'active'), (2, 2, 'E', 3, 3, 'active'), (2, 2, 'E', 4, 4, 'active'),
(2, 2, 'E', 5, 5, 'active'), (2, 2, 'E', 6, 6, 'active'), (2, 2, 'E', 7, 7, 'active'), (2, 2, 'E', 8, 8, 'active'),
(2, 3, 'F', 1, 1, 'active'), (2, 3, 'F', 2, 2, 'active'), (2, 3, 'F', 3, 3, 'active'), (2, 3, 'F', 4, 4, 'active'),
(2, 3, 'F', 5, 5, 'active'), (2, 3, 'F', 6, 6, 'active'), (2, 3, 'F', 7, 7, 'active'), (2, 3, 'F', 8, 8, 'active'),

-- Phòng 3 (IMAX): 48 ghế tương tự
(3, 1, 'A', 1, 1, 'active'), (3, 1, 'A', 2, 2, 'active'), (3, 1, 'A', 3, 3, 'active'), (3, 1, 'A', 4, 4, 'active'),
(3, 1, 'A', 5, 5, 'active'), (3, 1, 'A', 6, 6, 'active'), (3, 1, 'A', 7, 7, 'active'), (3, 1, 'A', 8, 8, 'active'),
(3, 1, 'B', 1, 1, 'active'), (3, 1, 'B', 2, 2, 'active'), (3, 1, 'B', 3, 3, 'active'), (3, 1, 'B', 4, 4, 'active'),
(3, 1, 'B', 5, 5, 'active'), (3, 1, 'B', 6, 6, 'active'), (3, 1, 'B', 7, 7, 'active'), (3, 1, 'B', 8, 8, 'active'),
(3, 2, 'C', 1, 1, 'active'), (3, 2, 'C', 2, 2, 'active'), (3, 2, 'C', 3, 3, 'active'), (3, 2, 'C', 4, 4, 'active'),
(3, 2, 'C', 5, 5, 'active'), (3, 2, 'C', 6, 6, 'active'), (3, 2, 'C', 7, 7, 'active'), (3, 2, 'C', 8, 8, 'active'),
(3, 2, 'D', 1, 1, 'active'), (3, 2, 'D', 2, 2, 'active'), (3, 2, 'D', 3, 3, 'active'), (3, 2, 'D', 4, 4, 'active'),
(3, 2, 'D', 5, 5, 'active'), (3, 2, 'D', 6, 6, 'active'), (3, 2, 'D', 7, 7, 'active'), (3, 2, 'D', 8, 8, 'active'),
(3, 2, 'E', 1, 1, 'active'), (3, 2, 'E', 2, 2, 'active'), (3, 2, 'E', 3, 3, 'active'), (3, 2, 'E', 4, 4, 'active'),
(3, 2, 'E', 5, 5, 'active'), (3, 2, 'E', 6, 6, 'active'), (3, 2, 'E', 7, 7, 'active'), (3, 2, 'E', 8, 8, 'active'),
(3, 3, 'F', 1, 1, 'active'), (3, 3, 'F', 2, 2, 'active'), (3, 3, 'F', 3, 3, 'active'), (3, 3, 'F', 4, 4, 'active'),
(3, 3, 'F', 5, 5, 'active'), (3, 3, 'F', 6, 6, 'active'), (3, 3, 'F', 7, 7, 'active'), (3, 3, 'F', 8, 8, 'active')
ON DUPLICATE KEY UPDATE seat_type_id = VALUES(seat_type_id), layout_col = VALUES(layout_col), status = VALUES(status);

-- ---------------------------------------------------------------------
-- 6. PHIM (movies) - Đầy đủ các trường: country, language, original_title, end_date, banner_url
-- ---------------------------------------------------------------------
INSERT INTO movies (id, title, original_title, duration_minutes, release_date, end_date, age_rating, country, language, poster_url, banner_url, trailer_url, description, director, cast_names, status) VALUES
(1, 'Mai', 'Mai', 131, '2024-02-10', '2026-12-31', 'T18', 'Việt Nam', 'Tiếng Việt',
 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=500',
 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200',
 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
 'Câu chuyện tình yêu đầy trắc trở giữa Mai - người phụ nữ massage gần 40 tuổi và Dương - chàng trai đào hoa kém tuổi. Phim khắc họa sâu sắc những tổn thương và định kiến xã hội.',
 'Trấn Thành', 'Phương Anh Đào, Tuấn Trần, Trấn Thành, Hồng Đào, Uyển Ân', 'now_showing'),

(2, 'Đào, Phở và Piano', 'Peach Blossom, Pho and Piano', 100, '2024-02-10', '2026-12-31', 'T13', 'Việt Nam', 'Tiếng Việt',
 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=500',
 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=1200',
 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
 'Tác phẩm tái hiện không khí hào hùng và bi tráng của quân dân Hà Nội trong cuộc chiến đấu 60 ngày đêm bảo vệ thủ đô mùa đông năm 1946.',
 'Phi Tiến Sơn', 'Doãn Quốc Đam, Cao Thùy Linh, NSND Trung Hiếu, Tuấn Hưng', 'now_showing'),

(3, 'Godzilla x Kong: Đế Chế Mới', 'Godzilla x Kong: The New Empire', 115, '2024-03-29', '2026-12-31', 'T13', 'Mỹ', 'Tiếng Anh - Phụ đề Tiếng Việt',
 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=500',
 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200',
 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
 'Trận chiến sinh tử tiếp theo của Monsterverse khi Kong hùng mạnh và Godzilla bất khả chiến bại cùng hợp lực chống lại mối đe dọa khổng lồ ẩn sâu bên dưới Trái Đất.',
 'Adam Wingard', 'Rebecca Hall, Brian Tyree Henry, Dan Stevens, Kaylee Hottle', 'now_showing'),

(4, 'Dune: Hành Tinh Cát - Phần Hai', 'Dune: Part Two', 166, '2024-03-01', '2026-12-31', 'T16', 'Mỹ', 'Tiếng Anh - Phụ đề Tiếng Việt',
 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=500',
 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=1200',
 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
 'Hành trình huyền thoại của Paul Atreides khi hợp nhất cùng Chani và tộc Fremen trên con đường báo thù những kẻ đã tàn phá gia tộc mình, đối diện với định mệnh vũ trụ.',
 'Denis Villeneuve', 'Timothée Chalamet, Zendaya, Rebecca Ferguson, Javier Bardem, Austin Butler', 'now_showing'),

(5, 'Kung Fu Panda 4', 'Kung Fu Panda 4', 94, '2024-03-08', '2026-12-31', 'P', 'Mỹ', 'Lồng tiếng / Phụ đề Tiếng Việt',
 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500',
 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200',
 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
 'Sau ba cuộc phiêu lưu nguy hiểm, Gấu Po được chọn làm Thủ lĩnh Tinh thần của Thung lũng Bình Yên và phải tìm kiếm cũng như huấn luyện một Chiến binh Rồng mới.',
 'Mike Mitchell', 'Jack Black, Awkwafina, Viola Davis, Dustin Hoffman, Bryan Cranston', 'coming_soon'),

(6, 'Deadpool & Wolverine', 'Deadpool & Wolverine', 127, '2024-07-26', '2026-12-31', 'T18', 'Mỹ', 'Tiếng Anh - Phụ đề Tiếng Việt',
 'https://images.unsplash.com/photo-1568876694728-451bbf694b83?w=500',
 'https://images.unsplash.com/photo-1568876694728-451bbf694b83?w=1200',
 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
 'Cơ quan Phương sai Thời gian (TVA) đưa chàng lính đánh thuê vô lại Deadpool bước vào Vũ trụ Điện ảnh Marvel và kết hợp cùng huyền thoại Wolverine.',
 'Shawn Levy', 'Ryan Reynolds, Hugh Jackman, Emma Corrin, Morena Baccarin', 'coming_soon')
ON DUPLICATE KEY UPDATE 
  title = VALUES(title),
  original_title = VALUES(original_title),
  duration_minutes = VALUES(duration_minutes),
  release_date = VALUES(release_date),
  end_date = VALUES(end_date),
  age_rating = VALUES(age_rating),
  country = VALUES(country),
  language = VALUES(language),
  poster_url = VALUES(poster_url),
  banner_url = VALUES(banner_url),
  trailer_url = VALUES(trailer_url),
  description = VALUES(description),
  director = VALUES(director),
  cast_names = VALUES(cast_names),
  status = VALUES(status);

-- ---------------------------------------------------------------------
-- 7. LIÊN KẾT PHIM - THỂ LOẠI (movie_genres)
-- ---------------------------------------------------------------------
INSERT INTO movie_genres (movie_id, genre_id) VALUES
(1, 8), (1, 2),        -- Mai: Tâm lý, Tình cảm
(2, 8), (2, 1),        -- Đào, Phở và Piano: Tâm lý, Hành động
(3, 1), (3, 6), (3, 7), -- Godzilla x Kong: Hành động, Viễn tưởng, Phiêu lưu
(4, 1), (4, 6), (4, 7), -- Dune 2: Hành động, Viễn tưởng, Phiêu lưu
(5, 5), (5, 4), (5, 7), -- Kung Fu Panda 4: Hoạt hình, Hài kịch, Phiêu lưu
(6, 1), (6, 4), (6, 6)  -- Deadpool & Wolverine: Hành động, Hài kịch, Viễn tưởng
ON DUPLICATE KEY UPDATE movie_id = VALUES(movie_id);

-- ---------------------------------------------------------------------
-- 8. TÀI KHOẢN NGƯỜI DÙNG (users) - Mật khẩu mặc định là: 123456
-- ---------------------------------------------------------------------
INSERT INTO users (id, full_name, email, phone, password_hash, role, cinema_id, status) VALUES
(1, 'Quản Trị Viên (Admin)', 'admin@cinema.com', '0901000001', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'admin', NULL, 'active'),
(2, 'Nhân Viên Soát Vé', 'staff@cinema.com', '0901000002', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'staff', 1, 'active'),
(3, 'Khách Hàng Trải Nghiệm', 'customer@cinema.com', '0901000003', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVKIUi', 'customer', NULL, 'active')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), password_hash = VALUES(password_hash), role = VALUES(role), status = VALUES(status);

-- ---------------------------------------------------------------------
-- 9. BẮP NƯỚC COMBO (combos)
-- ---------------------------------------------------------------------
INSERT INTO combos (id, name, description, price, is_available, status, image_url) VALUES
(1, 'Bắp rang bơ (Lớn)', 'Bắp rang bơ thơm ngon giòn rụm size L chuẩn rạp chiếu', 45000.00, 1, 'active', 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=400'),
(2, 'Nước ngọt Coca-Cola (Lớn)', 'Ly Coca-Cola mát lạnh sảng khoái dung tích 32oz', 30000.00, 1, 'active', 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400'),
(3, 'Combo Solo (1 Bắp + 1 Nước)', '1 Bắp rang bơ vừa + 1 Ly nước ngọt tự chọn size vừa', 65000.00, 1, 'active', 'https://images.unsplash.com/photo-1585647347384-2593bc35786b?w=400'),
(4, 'Combo Đôi (1 Bắp Lớn + 2 Nước)', '1 Bắp rang bơ lớn + 2 Ly nước ngọt mát lạnh tự chọn', 99000.00, 1, 'active', 'https://images.unsplash.com/photo-1585647347384-2593bc35786b?w=400'),
(5, 'Combo Family (2 Bắp + 3 Nước)', '2 Bắp rang bơ lớn + 3 Ly nước ngọt giải khát cực đã', 159000.00, 1, 'active', 'https://images.unsplash.com/photo-1585647347384-2593bc35786b?w=400')
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), price = VALUES(price), is_available = VALUES(is_available), status = VALUES(status), image_url = VALUES(image_url);

-- ---------------------------------------------------------------------
-- 10. MÃ KHUYẾN MÃI (promotions)
-- ---------------------------------------------------------------------
INSERT INTO promotions (id, code, description, discount_type, discount_value, min_order_amount, max_discount_amount, start_date, end_date, usage_limit, used_count, status) VALUES
(1, 'CHAOBANMOI', 'Giảm 20% cho đơn hàng đầu tiên của thành viên mới', 'percent', 20.00, 50000.00, 30000.00, '2024-01-01 00:00:00', '2027-12-31 23:59:59', 1000, 0, 'active'),
(2, 'GIAM30K', 'Giảm trực tiếp 30.000đ cho đơn hàng từ 150.000đ', 'amount', 30000.00, 150000.00, 30000.00, '2024-01-01 00:00:00', '2027-12-31 23:59:59', 500, 0, 'active'),
(3, 'UTECINEMA', 'Ưu đãi đặc quyền sinh viên HCMUTE giảm 15% tổng hóa đơn', 'percent', 15.00, 60000.00, 50000.00, '2024-01-01 00:00:00', '2027-12-31 23:59:59', 2000, 0, 'active')
ON DUPLICATE KEY UPDATE description = VALUES(description), discount_type = VALUES(discount_type), discount_value = VALUES(discount_value), min_order_amount = VALUES(min_order_amount), max_discount_amount = VALUES(max_discount_amount), status = VALUES(status);

-- ---------------------------------------------------------------------
-- 11. SUẤT CHIẾU (showtimes) - Tự động tạo lịch chiếu cho 7 ngày tính từ ngày hiện tại
-- ---------------------------------------------------------------------
-- Xóa các showtimes mẫu cũ để tránh trùng lịch khi import lại
DELETE FROM showtimes WHERE id >= 1;

-- Ngày 0 (Hôm nay)
INSERT INTO showtimes (movie_id, room_id, start_time, end_time, base_price, status) VALUES
(1, 1, TIMESTAMP(CURDATE(), '09:30:00'), TIMESTAMP(CURDATE(), '11:41:00'), 85000.00, 'scheduled'),
(2, 1, TIMESTAMP(CURDATE(), '13:00:00'), TIMESTAMP(CURDATE(), '14:40:00'), 85000.00, 'scheduled'),
(3, 1, TIMESTAMP(CURDATE(), '16:00:00'), TIMESTAMP(CURDATE(), '17:55:00'), 85000.00, 'scheduled'),
(4, 1, TIMESTAMP(CURDATE(), '19:30:00'), TIMESTAMP(CURDATE(), '22:16:00'), 95000.00, 'scheduled'),
(3, 3, TIMESTAMP(CURDATE(), '10:00:00'), TIMESTAMP(CURDATE(), '11:55:00'), 120000.00, 'scheduled'),
(4, 3, TIMESTAMP(CURDATE(), '14:30:00'), TIMESTAMP(CURDATE(), '17:16:00'), 130000.00, 'scheduled'),
(1, 3, TIMESTAMP(CURDATE(), '18:30:00'), TIMESTAMP(CURDATE(), '20:41:00'), 120000.00, 'scheduled'),
(2, 3, TIMESTAMP(CURDATE(), '21:30:00'), TIMESTAMP(CURDATE(), '23:10:00'), 120000.00, 'scheduled');

-- Ngày 1 (Ngày mai)
INSERT INTO showtimes (movie_id, room_id, start_time, end_time, base_price, status) VALUES
(2, 1, TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 1 DAY), '09:30:00'), TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 1 DAY), '11:10:00'), 85000.00, 'scheduled'),
(1, 1, TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 1 DAY), '13:00:00'), TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 1 DAY), '15:11:00'), 85000.00, 'scheduled'),
(4, 1, TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 1 DAY), '16:30:00'), TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 1 DAY), '19:16:00'), 95000.00, 'scheduled'),
(3, 1, TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 1 DAY), '20:30:00'), TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 1 DAY), '22:25:00'), 95000.00, 'scheduled'),
(4, 3, TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 1 DAY), '10:30:00'), TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 1 DAY), '13:16:00'), 130000.00, 'scheduled'),
(3, 3, TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 1 DAY), '15:00:00'), TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 1 DAY), '16:55:00'), 120000.00, 'scheduled'),
(2, 3, TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 1 DAY), '18:00:00'), TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 1 DAY), '19:40:00'), 120000.00, 'scheduled'),
(1, 3, TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 1 DAY), '21:00:00'), TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 1 DAY), '23:11:00'), 120000.00, 'scheduled');

-- Ngày 2 đến Ngày 6
INSERT INTO showtimes (movie_id, room_id, start_time, end_time, base_price, status) VALUES
(1, 1, TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 2 DAY), '10:00:00'), TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 2 DAY), '12:11:00'), 85000.00, 'scheduled'),
(3, 1, TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 2 DAY), '14:00:00'), TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 2 DAY), '15:55:00'), 85000.00, 'scheduled'),
(4, 1, TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 2 DAY), '18:00:00'), TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 2 DAY), '20:46:00'), 95000.00, 'scheduled'),
(2, 1, TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 2 DAY), '21:30:00'), TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 2 DAY), '23:10:00'), 85000.00, 'scheduled'),

(4, 1, TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 3 DAY), '10:00:00'), TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 3 DAY), '12:46:00'), 85000.00, 'scheduled'),
(1, 1, TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 3 DAY), '14:00:00'), TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 3 DAY), '16:11:00'), 85000.00, 'scheduled'),
(2, 1, TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 3 DAY), '18:00:00'), TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 3 DAY), '19:40:00'), 85000.00, 'scheduled'),
(3, 1, TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 3 DAY), '21:00:00'), TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 3 DAY), '22:55:00'), 85000.00, 'scheduled'),

(3, 1, TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 4 DAY), '10:00:00'), TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 4 DAY), '11:55:00'), 85000.00, 'scheduled'),
(2, 1, TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 4 DAY), '14:00:00'), TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 4 DAY), '15:40:00'), 85000.00, 'scheduled'),
(1, 1, TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 4 DAY), '18:00:00'), TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 4 DAY), '20:11:00'), 85000.00, 'scheduled'),

(1, 1, TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 5 DAY), '10:00:00'), TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 5 DAY), '12:11:00'), 85000.00, 'scheduled'),
(4, 1, TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 5 DAY), '14:00:00'), TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 5 DAY), '16:46:00'), 95000.00, 'scheduled'),
(3, 1, TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 5 DAY), '18:00:00'), TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 5 DAY), '19:55:00'), 85000.00, 'scheduled'),

(2, 1, TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 6 DAY), '10:00:00'), TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 6 DAY), '11:40:00'), 85000.00, 'scheduled'),
(1, 1, TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 6 DAY), '14:00:00'), TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 6 DAY), '16:11:00'), 85000.00, 'scheduled'),
(4, 1, TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 6 DAY), '18:00:00'), TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 6 DAY), '20:46:00'), 95000.00, 'scheduled');

-- ---------------------------------------------------------------------
-- 12. TRẠNG THÁI GHẾ SUẤT CHIẾU (showtime_seats)
-- Tự động sinh trạng thái 'available' cho tất cả ghế thuộc các suất chiếu trên
-- ---------------------------------------------------------------------
DELETE FROM showtime_seats WHERE id >= 1;
INSERT INTO showtime_seats (showtime_id, seat_id, status)
SELECT st.id, s.id, 'available'
FROM showtimes st
JOIN seats s ON s.room_id = st.room_id
ON DUPLICATE KEY UPDATE status = 'available';

SET FOREIGN_KEY_CHECKS = 1;

-- Hoàn tất nạp dữ liệu mẫu
SELECT 'SEED DATA IMPORTED SUCCESSFULLY!' AS Result;
