# HỆ THỐNG BÁN VÉ XEM PHIM (TLCN - ĐẠI HỌC SƯ PHẠM KỸ THUẬT TP.HCM)

Dự án được xây dựng theo đúng chuẩn thiết kế trong Báo cáo Tiểu luận Chuyên ngành (Nhóm 5):
- **Phân hệ Frontend:** React.js (Vite, TailwindCSS, React Router v7, Axios, Lucide Icons).
- **Phân hệ Backend:** Java Spring Boot 3 (Java 21 LTS, Spring Security 6, JWT, Spring Data JPA, Hibernate, WebSocket STOMP, Mail, MySQL).
- **Cơ sở dữ liệu:** MySQL 8.0 (19 bảng chuẩn hóa theo ERD).

---

## 📁 Cấu trúc thư mục dự án

```text
TLCN_test/
├── cinema-booking/             # Phân hệ Frontend (React + Vite)
│   ├── src/
│   │   ├── api/                # Cấu hình gọi API sang Backend
│   │   ├── components/         # Các UI components
│   │   ├── pages/              # Các trang giao diện (Khách hàng & Admin)
│   │   └── ...
│   ├── .env.example             # Frontend environment variable template
│   └── package.json
│
├── cinema-backend/             # Phân hệ Backend (Java Spring Boot 3)
│   ├── src/main/java/com/cinema/booking/
│   │   ├── config/             # SecurityConfig, CorsConfig
│   │   ├── controller/         # Auth, Movie, Showtime, Booking, Admin, Promo, Combo
│   │   ├── dto/                # Request & Response DTOs
│   │   ├── entity/             # 19 JPA Entities ánh xạ CSDL
│   │   ├── repository/         # Spring Data JPA Repositories
│   │   ├── security/           # JWT Token Provider & Filter
│   │   └── service/            # Business Logic Services
│   ├── src/main/resources/
│   │   └── application.yml     # Cấu hình port 5000, MySQL, JWT, Mail, PayPal Sandbox
│   └── pom.xml
│
├── database/                   # File kịch bản dữ liệu mẫu MySQL
│   └── seed_data.sql           # Dữ liệu mẫu (phim, rạp, phòng chiếu, ghế 3D, suất chiếu 7 ngày, combo, voucher)
│
```

---

## 🚀 Hướng dẫn khởi chạy

### 1. Khởi chạy Backend (Java Spring Boot - Code First)
1. Đảm bảo MySQL đang chạy và đã tạo schema rỗng (nếu chưa có):
   ```sql
   CREATE DATABASE IF NOT EXISTS movie_ticket_system_fixed1 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
2. Cấu hình file `cinema-backend/.env.local` với thông tin kết nối MySQL của bạn.
3. Chạy backend:
   ```bash
   cd cinema-backend
   mvn spring-boot:run
   ```
   * Spring Boot & Hibernate sẽ tự động sinh và cập nhật toàn bộ 19 bảng chuẩn theo Entity Java (Code-First).
   * Backend sẽ chạy tại: `http://localhost:5000/api`

### 2. Nạp Dữ liệu Mẫu (Seed Data)
1. Mở **MySQL Workbench** hoặc **Navicat / DBeaver / Command Line**.
2. Mở file `database/seed_data.sql` và thực thi (Execute).
3. Dữ liệu mẫu đầy đủ về phim, cụm rạp, phòng chiếu, ghế 3D, suất chiếu cho 7 ngày tới, combo bắp nước, khuyến mãi và tài khoản demo sẽ được nạp vào.
* Kiểm tra API tài liệu / dữ liệu phim: `http://localhost:5000/api/movies`

### 3. Chạy Frontend (React.js)
```bash
cd cinema-booking
copy .env.example .env
npm install
npm run dev
```
* Giao diện người dùng sẽ chạy tại: `http://localhost:5173`
* Tự động kết nối tới Backend tại port `5000`.
