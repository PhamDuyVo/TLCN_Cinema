package com.cinema.booking.controller;

import com.cinema.booking.dto.ApiResponse;
import com.cinema.booking.dto.AuthDtos.UserDto;
import com.cinema.booking.dto.MovieDtos.MovieDetailDto;
import com.cinema.booking.dto.SeatStatusEvent;
import com.cinema.booking.entity.*;
import com.cinema.booking.repository.*;
import com.cinema.booking.service.MovieService;
import com.cinema.booking.service.AdminStatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final MovieRepository movieRepository;
    private final MovieService movieService;
    private final CinemaRepository cinemaRepository;
    private final HallRepository hallRepository;
    private final SeatRepository seatRepository;
    private final SeatTypeRepository seatTypeRepository;
    private final ShowtimeRepository showtimeRepository;
    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final PaymentRepository paymentRepository;
    private final PromotionRepository promotionRepository;
    private final PasswordEncoder passwordEncoder;
    private final AdminStatsService adminStatsService;
    private final TicketRepository ticketRepository;
    private final ShowtimeSeatRepository showtimeSeatRepository;
    private final ApplicationEventPublisher eventPublisher;

    @GetMapping("/movies")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<MovieDetailDto>>> getAdminMovies() {
        List<MovieDetailDto> movies = movieService.getAllMovies("all");
        return ResponseEntity.ok(ApiResponse.success(movies));
    }

    @PostMapping("/movies")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<MovieDetailDto>> createMovie(@RequestBody Movie movie) {
        return ResponseEntity.ok(ApiResponse.success("Thêm phim mới thành công!", movieService.saveMovie(null, movie)));
    }

    @PutMapping("/movies/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<MovieDetailDto>> updateMovie(@PathVariable Long id, @RequestBody Movie movieDetails) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật phim thành công!", movieService.saveMovie(id, movieDetails)));
    }

    @DeleteMapping("/movies/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteMovie(@PathVariable Long id) {
        movieService.deleteMovie(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa phim thành công!", null));
    }

    @GetMapping("/cinemas")
    public ResponseEntity<ApiResponse<List<Cinema>>> getCinemas() {
        return ResponseEntity.ok(ApiResponse.success(cinemaRepository.findAll()));
    }

    @GetMapping("/cinemas/{cinemaId}/rooms")
    public ResponseEntity<ApiResponse<List<Hall>>> getRoomsByCinema(@PathVariable Long cinemaId) {
        return ResponseEntity.ok(ApiResponse.success(hallRepository.findByCinemaId(cinemaId)));
    }

    @PostMapping("/showtimes")
    public ResponseEntity<ApiResponse<Showtime>> createShowtime(@RequestBody Map<String, Object> payload) {
        Long movieId = Long.valueOf(payload.get("movieId").toString());
        Long hallId = Long.valueOf(payload.get("hallId").toString());
        LocalDateTime startTime = LocalDateTime.parse(payload.get("startTime").toString());
        LocalDateTime endTime = LocalDateTime.parse(payload.get("endTime").toString());
        BigDecimal basePrice = new BigDecimal(payload.get("basePrice").toString());

        Movie movie = movieRepository.findById(movieId)
                .orElseThrow(() -> new IllegalArgumentException("Phim không tồn tại"));
        Hall hall = hallRepository.findById(hallId)
                .orElseThrow(() -> new IllegalArgumentException("Phòng chiếu không tồn tại"));

        Showtime showtime = Showtime.builder()
                .movie(movie)
                .hall(hall)
                .startTime(startTime)
                .endTime(endTime)
                .basePrice(basePrice)
                .status("scheduled")
                .build();

        Showtime saved = showtimeRepository.save(showtime);
        return ResponseEntity.ok(ApiResponse.success("Thêm suất chiếu thành công!", saved));
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserDto>>> getUsers() {
        List<User> users = userRepository.findAll();
        List<UserDto> dtos = users.stream().map(u -> UserDto.builder()
                .id(u.getId())
                .fullName(u.getFullName())
                .email(u.getEmail())
                .phone(u.getPhone())
                .role(u.getRole().name())
                .status(u.getStatus().name())
                .createdAt(u.getCreatedAt())
                .build()).collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @PatchMapping("/users/{id}/status")
    public ResponseEntity<ApiResponse<String>> updateUserStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại"));

        String statusStr = payload.get("status");
        if (statusStr != null) {
            user.setStatus(User.UserStatus.valueOf(statusStr.toUpperCase()));
            userRepository.save(user);
        }
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái người dùng thành công!"));
    }

    // ==================== CINEMAS CRUD ====================

    @PostMapping("/cinemas")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Cinema>> createCinema(@RequestBody Map<String, Object> payload) {
        Cinema cinema = Cinema.builder()
                .name(String.valueOf(payload.get("name")))
                .address(String.valueOf(payload.get("address")))
                .city(payload.get("city") != null ? String.valueOf(payload.get("city")) : "")
                .hotline(payload.get("phone") != null ? String.valueOf(payload.get("phone")) : null)
                .status(payload.get("status") != null ? String.valueOf(payload.get("status")) : "active")
                .build();
        Cinema saved = cinemaRepository.save(cinema);
        return ResponseEntity.ok(ApiResponse.success("Thêm rạp chiếu thành công!", saved));
    }

    @PutMapping("/cinemas/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Cinema>> updateCinema(@PathVariable Long id,
                                                            @RequestBody Map<String, Object> payload) {
        Cinema cinema = cinemaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Rạp chiếu không tồn tại"));
        if (payload.get("name") != null) cinema.setName(String.valueOf(payload.get("name")));
        if (payload.get("address") != null) cinema.setAddress(String.valueOf(payload.get("address")));
        if (payload.get("city") != null) cinema.setCity(String.valueOf(payload.get("city")));
        if (payload.get("phone") != null) cinema.setHotline(String.valueOf(payload.get("phone")));
        if (payload.get("status") != null) cinema.setStatus(String.valueOf(payload.get("status")));
        Cinema saved = cinemaRepository.save(cinema);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật rạp chiếu thành công!", saved));
    }

    @DeleteMapping("/cinemas/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteCinema(@PathVariable Long id) {
        cinemaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Rạp chiếu không tồn tại"));
        List<Hall> halls = hallRepository.findByCinemaId(id);
        if (!halls.isEmpty()) {
            throw new IllegalArgumentException("Không thể xóa rạp vì còn phòng chiếu liên kết");
        }
        cinemaRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa rạp chiếu thành công!", null));
    }

    @PatchMapping("/cinemas/{id}/status")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Cinema>> updateCinemaStatus(@PathVariable Long id,
                                                                   @RequestBody Map<String, String> payload) {
        Cinema cinema = cinemaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Rạp chiếu không tồn tại"));
        String status = payload.get("status");
        if (status == null || status.isBlank()) {
            throw new IllegalArgumentException("Trạng thái không hợp lệ");
        }
        cinema.setStatus(status.toLowerCase());
        Cinema saved = cinemaRepository.save(cinema);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái rạp thành công!", saved));
    }

    // ==================== HALLS CRUD ====================

    @PostMapping("/cinemas/{cinemaId}/halls")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Hall>> createHall(@PathVariable Long cinemaId,
                                                         @RequestBody Map<String, Object> payload) {
        cinemaRepository.findById(cinemaId)
                .orElseThrow(() -> new IllegalArgumentException("Rạp chiếu không tồn tại"));
        int totalSeats = payload.get("totalSeats") != null
                ? Integer.parseInt(payload.get("totalSeats").toString()) : 0;
        Hall hall = Hall.builder()
                .cinemaId(cinemaId)
                .name(String.valueOf(payload.get("name")))
                .screenType(payload.get("hallType") != null ? String.valueOf(payload.get("hallType")) : "2D")
                .totalSeats(totalSeats)
                .status("active")
                .build();
        Hall saved = hallRepository.save(hall);
        return ResponseEntity.ok(ApiResponse.success("Thêm phòng chiếu thành công!", saved));
    }

    @GetMapping("/halls/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Hall>> getHall(@PathVariable Long id) {
        Hall hall = hallRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Phòng chiếu không tồn tại"));
        return ResponseEntity.ok(ApiResponse.success(hall));
    }

    @PutMapping("/halls/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Hall>> updateHall(@PathVariable Long id,
                                                         @RequestBody Map<String, Object> payload) {
        Hall hall = hallRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Phòng chiếu không tồn tại"));
        if (payload.get("name") != null) hall.setName(String.valueOf(payload.get("name")));
        if (payload.get("hallType") != null) hall.setScreenType(String.valueOf(payload.get("hallType")));
        if (payload.get("totalSeats") != null)
            hall.setTotalSeats(Integer.parseInt(payload.get("totalSeats").toString()));
        if (payload.get("status") != null) hall.setStatus(String.valueOf(payload.get("status")));
        Hall saved = hallRepository.save(hall);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật phòng chiếu thành công!", saved));
    }

    @DeleteMapping("/halls/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteHall(@PathVariable Long id) {
        hallRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Phòng chiếu không tồn tại"));
        boolean hasActiveShowtime = showtimeRepository.findAll().stream()
                .anyMatch(s -> s.getHall().getId().equals(id)
                        && !"cancelled".equalsIgnoreCase(s.getStatus())
                        && !"completed".equalsIgnoreCase(s.getStatus()));
        if (hasActiveShowtime) {
            throw new IllegalArgumentException("Không thể xóa phòng vì còn suất chiếu đang hoạt động");
        }
        hallRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa phòng chiếu thành công!", null));
    }

    // ==================== SEATS ====================

    @GetMapping("/halls/{hallId}/seats")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Seat>>> getSeatsByHall(@PathVariable Long hallId) {
        hallRepository.findById(hallId)
                .orElseThrow(() -> new IllegalArgumentException("Phòng chiếu không tồn tại"));
        List<Seat> seats = seatRepository.findByHallIdOrderBySeatRowAscSeatColAsc(hallId);
        return ResponseEntity.ok(ApiResponse.success(seats));
    }

    @PatchMapping("/seats/{id}/status")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Seat>> updateSeatStatus(@PathVariable Long id,
                                                               @RequestBody Map<String, String> payload) {
        Seat seat = seatRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ghế không tồn tại"));
        String status = payload.get("status");
        if (status == null || status.isBlank()) {
            throw new IllegalArgumentException("Trạng thái không hợp lệ");
        }
        seat.setStatus(status.toLowerCase());
        Seat saved = seatRepository.save(seat);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái ghế thành công!", saved));
    }

    @PostMapping("/halls/{hallId}/seats/generate")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Seat>>> generateSeats(@PathVariable Long hallId,
                                                                   @RequestBody Map<String, Object> payload) {
        hallRepository.findById(hallId)
                .orElseThrow(() -> new IllegalArgumentException("Phòng chiếu không tồn tại"));
        int rows = Integer.parseInt(payload.get("rows").toString());
        int cols = Integer.parseInt(payload.get("cols").toString());
        Long seatTypeId = Long.valueOf(payload.get("defaultSeatTypeId").toString());
        SeatType seatType = seatTypeRepository.findById(seatTypeId)
                .orElseThrow(() -> new IllegalArgumentException("Loại ghế không tồn tại"));

        // Remove existing seats for this hall
        List<Seat> existing = seatRepository.findByHallIdOrderBySeatRowAscSeatColAsc(hallId);
        seatRepository.deleteAll(existing);

        List<Seat> generated = new ArrayList<>();
        for (int r = 0; r < rows; r++) {
            String rowLabel = String.valueOf((char) ('A' + r));
            for (int c = 1; c <= cols; c++) {
                Seat seat = Seat.builder()
                        .hallId(hallId)
                        .seatType(seatType)
                        .seatRow(rowLabel)
                        .seatCol(c)
                        .layoutCol(c)
                        .status("active")
                        .build();
                generated.add(seat);
            }
        }
        List<Seat> saved = seatRepository.saveAll(generated);

        // Update hall totalSeats
        hallRepository.findById(hallId).ifPresent(hall -> {
            hall.setTotalSeats(saved.size());
            hallRepository.save(hall);
        });

        return ResponseEntity.ok(ApiResponse.success("Tạo ghế tự động thành công!", saved));
    }

    // ==================== SHOWTIMES (extended) ====================

    @GetMapping("/showtimes")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAllShowtimes(
            @RequestParam(required = false) Long movieId,
            @RequestParam(required = false) Long hallId,
            @RequestParam(required = false) String date) {

        List<Showtime> showtimes = showtimeRepository.findAll();

        if (movieId != null) {
            showtimes = showtimes.stream()
                    .filter(s -> s.getMovie().getId().equals(movieId))
                    .collect(Collectors.toList());
        }
        if (hallId != null) {
            showtimes = showtimes.stream()
                    .filter(s -> s.getHall().getId().equals(hallId))
                    .collect(Collectors.toList());
        }
        if (date != null && !date.isBlank()) {
            LocalDate filterDate = LocalDate.parse(date);
            showtimes = showtimes.stream()
                    .filter(s -> s.getStartTime().toLocalDate().equals(filterDate))
                    .collect(Collectors.toList());
        }

        List<Map<String, Object>> result = showtimes.stream().map(s -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", s.getId());
            map.put("movieId", s.getMovie().getId());
            map.put("movieTitle", s.getMovie().getTitle());
            map.put("hallId", s.getHall().getId());
            map.put("hallName", s.getHall().getName());
            map.put("cinemaId", s.getHall().getCinemaId());
            cinemaRepository.findById(s.getHall().getCinemaId())
                    .ifPresent(c -> map.put("cinemaName", c.getName()));
            map.put("startTime", s.getStartTime());
            map.put("endTime", s.getEndTime());
            map.put("basePrice", s.getBasePrice());
            map.put("status", s.getStatus());
            map.put("createdAt", s.getCreatedAt());
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PutMapping("/showtimes/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Showtime>> updateShowtime(@PathVariable Long id,
                                                                 @RequestBody Map<String, Object> payload) {
        Showtime showtime = showtimeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Suất chiếu không tồn tại"));
        if (payload.get("startTime") != null)
            showtime.setStartTime(LocalDateTime.parse(payload.get("startTime").toString()));
        if (payload.get("endTime") != null)
            showtime.setEndTime(LocalDateTime.parse(payload.get("endTime").toString()));
        if (payload.get("basePrice") != null)
            showtime.setBasePrice(new BigDecimal(payload.get("basePrice").toString()));
        Showtime saved = showtimeRepository.save(showtime);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật suất chiếu thành công!", saved));
    }

    @DeleteMapping("/showtimes/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteShowtime(@PathVariable Long id) {
        Showtime showtime = showtimeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Suất chiếu không tồn tại"));
        if ("ongoing".equalsIgnoreCase(showtime.getStatus())) {
            throw new IllegalArgumentException("Không thể hủy suất chiếu đang diễn ra");
        }
        showtimeRepository.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success("Hủy suất chiếu thành công!", null));
    }

    @PatchMapping("/showtimes/{id}/status")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Showtime>> updateShowtimeStatus(@PathVariable Long id,
                                                                       @RequestBody Map<String, String> payload) {
        Showtime showtime = showtimeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Suất chiếu không tồn tại"));
        String status = payload.get("status");
        if (status == null || status.isBlank()) {
            throw new IllegalArgumentException("Trạng thái không hợp lệ");
        }
        showtime.setStatus(status.toLowerCase());
        Showtime saved = showtimeRepository.save(showtime);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái suất chiếu thành công!", saved));
    }

    // ==================== USERS (extended) ====================

    @PostMapping("/users")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserDto>> createStaff(@RequestBody Map<String, Object> payload) {
        String email = String.valueOf(payload.get("email"));
        if (userRepository.findAll().stream().anyMatch(u -> u.getEmail().equalsIgnoreCase(email))) {
            throw new IllegalArgumentException("Email đã tồn tại");
        }
        String roleStr = payload.get("role") != null ? String.valueOf(payload.get("role")).toUpperCase() : "STAFF";
        User.UserRole role;
        try {
            role = User.UserRole.valueOf(roleStr);
        } catch (IllegalArgumentException e) {
            role = User.UserRole.STAFF;
        }
        String rawPassword = String.valueOf(payload.get("password"));
        User user = User.builder()
                .fullName(String.valueOf(payload.get("fullName")))
                .email(email)
                .phone(payload.get("phone") != null ? String.valueOf(payload.get("phone")) : null)
                .passwordHash(passwordEncoder.encode(rawPassword))
                .role(role)
                .status(User.UserStatus.ACTIVE)
                .build();
        User saved = userRepository.save(user);
        UserDto dto = UserDto.builder()
                .id(saved.getId())
                .fullName(saved.getFullName())
                .email(saved.getEmail())
                .phone(saved.getPhone())
                .role(saved.getRole().name())
                .status(saved.getStatus().name())
                .createdAt(saved.getCreatedAt())
                .build();
        return ResponseEntity.ok(ApiResponse.success("Tạo tài khoản nhân viên thành công!", dto));
    }

    @PutMapping("/users/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserDto>> updateUser(@PathVariable Long id,
                                                            @RequestBody Map<String, Object> payload) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại"));
        if (payload.get("fullName") != null) user.setFullName(String.valueOf(payload.get("fullName")));
        if (payload.get("phone") != null) user.setPhone(String.valueOf(payload.get("phone")));
        if (payload.get("role") != null) {
            try {
                user.setRole(User.UserRole.valueOf(String.valueOf(payload.get("role")).toUpperCase()));
            } catch (IllegalArgumentException ignored) {}
        }
        User saved = userRepository.save(user);
        UserDto dto = UserDto.builder()
                .id(saved.getId())
                .fullName(saved.getFullName())
                .email(saved.getEmail())
                .phone(saved.getPhone())
                .role(saved.getRole().name())
                .status(saved.getStatus().name())
                .createdAt(saved.getCreatedAt())
                .build();
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin người dùng thành công!", dto));
    }

    // =========================================================================
    // STATS ENDPOINTS
    // =========================================================================

    @GetMapping("/stats/dashboard")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardStatsV2() {
        return ResponseEntity.ok(ApiResponse.success(adminStatsService.getDashboardStats()));
    }

    @GetMapping("/stats/revenue")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getRevenueStats(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "day") String groupBy) {
        if (from == null) from = LocalDate.now().minusDays(30);
        if (to   == null) to   = LocalDate.now();
        return ResponseEntity.ok(ApiResponse.success(adminStatsService.getRevenueByRange(from, to, groupBy)));
    }

    @GetMapping("/stats/tickets")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTicketStats(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        if (from == null) from = LocalDate.now().minusDays(30);
        if (to   == null) to   = LocalDate.now();
        return ResponseEntity.ok(ApiResponse.success(adminStatsService.getTicketStats(from, to)));
    }

    @GetMapping("/stats/movies")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getMovieStats(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        if (from == null) from = LocalDate.now().minusDays(30);
        if (to   == null) to   = LocalDate.now();
        return ResponseEntity.ok(ApiResponse.success(adminStatsService.getMovieStats(from, to)));
    }

    @GetMapping("/stats/showtimes")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getShowtimeStats(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        if (from == null) from = LocalDate.now().minusDays(30);
        if (to   == null) to   = LocalDate.now();
        return ResponseEntity.ok(ApiResponse.success(adminStatsService.getShowtimeStats(from, to)));
    }

    // =========================================================================
    // PROMOTIONS CRUD
    // =========================================================================

    @GetMapping("/promotions")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<Promotion>>> getAllPromotions() {
        return ResponseEntity.ok(ApiResponse.success(
                promotionRepository.findAll(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "id"))
        ));
    }

    @PostMapping("/promotions")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Promotion>> createPromotion(@RequestBody Map<String, Object> payload) {
        if (payload.get("code") == null || payload.get("code").toString().isBlank()) {
            throw new IllegalArgumentException("Mã khuyến mãi không được để trống");
        }
        String code = String.valueOf(payload.get("code")).toUpperCase().trim();
        if (promotionRepository.existsByCode(code)) {
            throw new IllegalArgumentException("Mã khuyến mãi '" + code + "' đã tồn tại");
        }
        if (payload.get("discountValue") == null || payload.get("discountValue").toString().isBlank()) {
            throw new IllegalArgumentException("Giá trị giảm không được để trống");
        }

        String discountType = payload.get("discountType") != null ? String.valueOf(payload.get("discountType")) : "percent";
        BigDecimal discountValue = new BigDecimal(payload.get("discountValue").toString());

        BigDecimal minOrderAmount = BigDecimal.ZERO;
        if (payload.get("minOrderAmount") != null && !payload.get("minOrderAmount").toString().isBlank()) {
            minOrderAmount = new BigDecimal(payload.get("minOrderAmount").toString());
        }

        BigDecimal maxDiscountAmount = null;
        if (payload.get("maxDiscountAmount") != null && !payload.get("maxDiscountAmount").toString().isBlank()) {
            maxDiscountAmount = new BigDecimal(payload.get("maxDiscountAmount").toString());
        }

        LocalDateTime startDate = LocalDateTime.now();
        if (payload.get("startDate") != null && !payload.get("startDate").toString().isBlank()) {
            String s = payload.get("startDate").toString();
            startDate = LocalDateTime.parse(s.contains("T") ? s : s + "T00:00:00");
        }

        LocalDateTime endDate = LocalDateTime.now().plusDays(30);
        if (payload.get("endDate") != null && !payload.get("endDate").toString().isBlank()) {
            String s = payload.get("endDate").toString();
            endDate = LocalDateTime.parse(s.contains("T") ? s : s + "T23:59:59");
        }

        Integer usageLimit = null;
        if (payload.get("usageLimit") != null && !payload.get("usageLimit").toString().isBlank()) {
            usageLimit = Integer.parseInt(payload.get("usageLimit").toString());
        }

        Promotion promo = Promotion.builder()
                .code(code)
                .description(payload.get("description") != null ? String.valueOf(payload.get("description")) : "")
                .discountType(discountType)
                .discountValue(discountValue)
                .minOrderAmount(minOrderAmount)
                .maxDiscountAmount(maxDiscountAmount)
                .startDate(startDate)
                .endDate(endDate)
                .usageLimit(usageLimit)
                .usedCount(0)
                .status(payload.get("status") != null ? String.valueOf(payload.get("status")) : "active")
                .build();
        Promotion saved = promotionRepository.save(promo);
        return ResponseEntity.ok(ApiResponse.success("Tạo mã khuyến mãi thành công!", saved));
    }

    @PutMapping("/promotions/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Promotion>> updatePromotion(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Promotion promo = promotionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Khuyến mãi không tồn tại"));

        if (payload.containsKey("code") && payload.get("code") != null && !payload.get("code").toString().isBlank()) {
            String newCode = payload.get("code").toString().toUpperCase().trim();
            if (!newCode.equalsIgnoreCase(promo.getCode()) && promotionRepository.existsByCode(newCode)) {
                throw new IllegalArgumentException("Mã khuyến mãi '" + newCode + "' đã tồn tại");
            }
            promo.setCode(newCode);
        }
        if (payload.containsKey("description")) {
            promo.setDescription(payload.get("description") != null ? String.valueOf(payload.get("description")) : "");
        }
        if (payload.containsKey("discountType") && payload.get("discountType") != null) {
            promo.setDiscountType(String.valueOf(payload.get("discountType")));
        }
        if (payload.containsKey("discountValue") && payload.get("discountValue") != null && !payload.get("discountValue").toString().isBlank()) {
            promo.setDiscountValue(new BigDecimal(payload.get("discountValue").toString()));
        }
        if (payload.containsKey("minOrderAmount")) {
            Object v = payload.get("minOrderAmount");
            promo.setMinOrderAmount(v != null && !v.toString().isBlank() ? new BigDecimal(v.toString()) : BigDecimal.ZERO);
        }
        if (payload.containsKey("maxDiscountAmount")) {
            Object v = payload.get("maxDiscountAmount");
            promo.setMaxDiscountAmount(v != null && !v.toString().isBlank() ? new BigDecimal(v.toString()) : null);
        }
        if (payload.containsKey("startDate") && payload.get("startDate") != null && !payload.get("startDate").toString().isBlank()) {
            String s = payload.get("startDate").toString();
            promo.setStartDate(LocalDateTime.parse(s.contains("T") ? s : s + "T00:00:00"));
        }
        if (payload.containsKey("endDate") && payload.get("endDate") != null && !payload.get("endDate").toString().isBlank()) {
            String s = payload.get("endDate").toString();
            promo.setEndDate(LocalDateTime.parse(s.contains("T") ? s : s + "T23:59:59"));
        }
        if (payload.containsKey("usageLimit")) {
            Object u = payload.get("usageLimit");
            promo.setUsageLimit(u != null && !u.toString().isBlank() ? Integer.parseInt(u.toString()) : null);
        }
        if (payload.containsKey("status") && payload.get("status") != null) {
            promo.setStatus(String.valueOf(payload.get("status")));
        }
        Promotion saved = promotionRepository.save(promo);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật khuyến mãi thành công!", saved));
    }

    @PatchMapping("/promotions/{id}/status")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Promotion>> togglePromotionStatus(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        Promotion promo = promotionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Khuyến mãi không tồn tại"));
        if (payload.containsKey("isActive")) {
            boolean active = Boolean.parseBoolean(payload.get("isActive").toString());
            promo.setStatus(active ? "active" : "inactive");
        } else if (payload.containsKey("status")) {
            promo.setStatus(String.valueOf(payload.get("status")));
        }
        Promotion saved = promotionRepository.save(promo);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái khuyến mãi thành công!", saved));
    }

    @DeleteMapping("/promotions/{id}")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deletePromotion(@PathVariable Long id) {
        Promotion promo = promotionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Khuyến mãi không tồn tại"));
        if (promo.getUsedCount() != null && promo.getUsedCount() > 0) {
            throw new IllegalArgumentException("Không thể xóa khuyến mãi đã có lượt sử dụng (" + promo.getUsedCount() + " lượt). Bạn có thể chọn tạm khóa mã này.");
        }
        try {
            promotionRepository.delete(promo);
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            throw new IllegalArgumentException("Không thể xóa khuyến mãi do đã được liên kết với đơn đặt vé. Bạn có thể chọn tạm khóa mã này.");
        }
        return ResponseEntity.ok(ApiResponse.success("Xóa khuyến mãi thành công!", null));
    }

    // =========================================================================
    // BOOKINGS & PAYMENTS
    // =========================================================================

    @GetMapping("/bookings")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAdminBookings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {

        List<Booking> all = bookingRepository.findAll();

        all.sort((a, b) -> {
            if (a.getCreatedAt() == null || b.getCreatedAt() == null) return 0;
            return b.getCreatedAt().compareTo(a.getCreatedAt());
        });

        // Tính toán thống kê KPI tổng quan
        long totalOrders = all.size();
        long paidOrders = all.stream().filter(b -> "PAID".equalsIgnoreCase(b.getStatus())).count();
        long pendingOrders = all.stream().filter(b -> "PENDING_PAYMENT".equalsIgnoreCase(b.getStatus()) || "PENDING".equalsIgnoreCase(b.getStatus())).count();
        long cancelledOrders = all.stream().filter(b -> "CANCELLED".equalsIgnoreCase(b.getStatus())).count();
        BigDecimal totalRevenue = all.stream()
                .filter(b -> "PAID".equalsIgnoreCase(b.getStatus()) && b.getFinalAmount() != null)
                .map(Booking::getFinalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalOrders", totalOrders);
        summary.put("paidOrders", paidOrders);
        summary.put("pendingOrders", pendingOrders);
        summary.put("cancelledOrders", cancelledOrders);
        summary.put("totalRevenue", totalRevenue);

        if (status != null && !status.isBlank() && !"all".equalsIgnoreCase(status)) {
            all = all.stream().filter(b -> status.equalsIgnoreCase(b.getStatus())).collect(Collectors.toList());
        }

        if (search != null && !search.isBlank()) {
            String kw = search.toLowerCase().trim();
            all = all.stream().filter(b ->
                    (b.getBookingCode() != null && b.getBookingCode().toLowerCase().contains(kw)) ||
                    (b.getCustomerName() != null && b.getCustomerName().toLowerCase().contains(kw)) ||
                    (b.getCustomerEmail() != null && b.getCustomerEmail().toLowerCase().contains(kw)) ||
                    (b.getCustomerPhone() != null && b.getCustomerPhone().contains(kw))
            ).collect(Collectors.toList());
        }

        int totalElements = all.size();
        int totalPages = (int) Math.ceil((double) totalElements / size);
        int start = Math.min(page * size, totalElements);
        int end = Math.min(start + size, totalElements);
        List<Booking> paged = all.subList(start, end);

        List<Map<String, Object>> content = paged.stream().map(b -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", b.getId());
            map.put("bookingCode", b.getBookingCode());
            map.put("customerName", b.getCustomerName());
            map.put("customerEmail", b.getCustomerEmail());
            map.put("customerPhone", b.getCustomerPhone());
            map.put("status", b.getStatus());
            map.put("seatAmount", b.getSeatAmount());
            map.put("comboAmount", b.getComboAmount());
            map.put("discountAmount", b.getDiscountAmount());
            map.put("finalAmount", b.getFinalAmount());
            map.put("paymentMethod", b.getPaymentMethod());
            map.put("expiresAt", b.getExpiresAt());
            map.put("createdAt", b.getCreatedAt());

            if (b.getPromotion() != null) {
                map.put("promotionCode", b.getPromotion().getCode());
                map.put("promotionDiscountType", b.getPromotion().getDiscountType());
                map.put("promotionDiscountValue", b.getPromotion().getDiscountValue());
            }

            if (b.getShowtime() != null) {
                map.put("movieTitle", b.getShowtime().getMovie() != null ? b.getShowtime().getMovie().getTitle() : "");
                map.put("startTime", b.getShowtime().getStartTime());
                if (b.getShowtime().getHall() != null) {
                    map.put("hallName", b.getShowtime().getHall().getName());
                    cinemaRepository.findById(b.getShowtime().getHall().getCinemaId())
                            .ifPresent(c -> map.put("cinemaName", c.getName()));
                }
            }

            // Danh sách vé
            List<Map<String, Object>> ticketDtos = b.getTickets().stream().map(t -> {
                Map<String, Object> tm = new LinkedHashMap<>();
                tm.put("id", t.getId());
                tm.put("ticketCode", t.getTicketCode());
                tm.put("price", t.getPrice());
                tm.put("status", t.getStatus());
                tm.put("checkedInAt", t.getCheckedInAt());
                if (t.getSeat() != null) {
                    tm.put("seatRow", t.getSeat().getSeatRow());
                    tm.put("seatCol", t.getSeat().getSeatCol());
                    tm.put("seatLabel", t.getSeat().getSeatRow() + t.getSeat().getSeatCol());
                    if (t.getSeat().getSeatType() != null) {
                        tm.put("seatType", t.getSeat().getSeatType().getName());
                    }
                }
                return tm;
            }).collect(Collectors.toList());
            map.put("tickets", ticketDtos);
            map.put("ticketCount", ticketDtos.size());

            // Danh sách combo F&B
            List<Map<String, Object>> comboDtos = b.getCombos().stream().map(c -> {
                Map<String, Object> cm = new LinkedHashMap<>();
                cm.put("id", c.getId());
                cm.put("comboName", c.getCombo() != null ? c.getCombo().getName() : "Combo");
                cm.put("quantity", c.getQuantity());
                cm.put("unitPrice", c.getUnitPrice());
                cm.put("totalPrice", c.getUnitPrice() != null ? c.getUnitPrice().multiply(BigDecimal.valueOf(c.getQuantity())) : BigDecimal.ZERO);
                return cm;
            }).collect(Collectors.toList());
            map.put("combos", comboDtos);
            map.put("comboCount", comboDtos.size());

            return map;
        }).collect(Collectors.toList());

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("content", content);
        response.put("totalElements", totalElements);
        response.put("totalPages", totalPages);
        response.put("currentPage", page);
        response.put("summary", summary);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/bookings/{id}/confirm-payment")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<ApiResponse<String>> confirmBookingPayment(@PathVariable Long id) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn đặt vé"));

        String status = booking.getStatus() != null ? booking.getStatus().toUpperCase() : "";
        if ("PAID".equals(status)) {
            throw new IllegalArgumentException("Đơn đặt vé này đã được thanh toán rồi");
        }
        if ("CANCELLED".equals(status)) {
            throw new IllegalArgumentException("Đơn đặt vé đã bị hủy, không thể xác nhận thanh toán");
        }

        booking.setStatus("PAID");
        if (booking.getTickets() != null) {
            for (Ticket ticket : booking.getTickets()) {
                if (!"cancelled".equalsIgnoreCase(ticket.getStatus()) && !"checked_in".equalsIgnoreCase(ticket.getStatus())) {
                    ticket.setStatus("valid");
                    ticketRepository.save(ticket);
                }
            }
        }

        // Tạo hoặc cập nhật bản ghi thanh toán tại quầy
        List<Payment> existingPayments = paymentRepository.findAll().stream()
                .filter(p -> p.getBookingId().equals(booking.getId()))
                .collect(Collectors.toList());

        Optional<Payment> pendingPayment = existingPayments.stream()
                .filter(p -> "PENDING".equalsIgnoreCase(p.getStatus()))
                .findFirst();

        if (pendingPayment.isPresent()) {
            Payment p = pendingPayment.get();
            p.setStatus("SUCCESS");
            p.setPaidAt(LocalDateTime.now());
            paymentRepository.save(p);
        } else if (existingPayments.isEmpty()) {
            Payment payment = Payment.builder()
                    .bookingId(booking.getId())
                    .txnRef("COUNTER-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                    .amount(booking.getFinalAmount() != null ? booking.getFinalAmount() : BigDecimal.ZERO)
                    .paymentMethod(booking.getPaymentMethod() != null ? booking.getPaymentMethod() : "PAY_AT_COUNTER")
                    .status("SUCCESS")
                    .paidAt(LocalDateTime.now())
                    .build();
            paymentRepository.save(payment);
        }

        bookingRepository.save(booking);
        return ResponseEntity.ok(ApiResponse.success("Xác nhận thanh toán đơn hàng thành công!"));
    }

    @PatchMapping("/bookings/{id}/cancel")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<ApiResponse<String>> cancelAdminBooking(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> payload) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn đặt vé"));

        String status = booking.getStatus() != null ? booking.getStatus().toUpperCase() : "";
        if ("CANCELLED".equals(status)) {
            throw new IllegalArgumentException("Đơn đặt vé này đã bị hủy trước đó");
        }

        booking.setStatus("CANCELLED");

        // Hủy trạng thái các vé và nhả ghế
        List<Long> seatIds = new ArrayList<>();
        if (booking.getTickets() != null) {
            for (Ticket ticket : booking.getTickets()) {
                ticket.setStatus("cancelled");
                ticketRepository.save(ticket);
                if (ticket.getSeat() != null) {
                    seatIds.add(ticket.getSeat().getId());
                }
            }
        }

        // Nhả ghế về available
        if (booking.getShowtime() != null && !seatIds.isEmpty()) {
            Long showtimeId = booking.getShowtime().getId();
            List<ShowtimeSeat> seats = showtimeSeatRepository.findByShowtimeId(showtimeId);
            for (ShowtimeSeat ss : seats) {
                if (seatIds.contains(ss.getSeatId())) {
                    ss.setStatus("available");
                    ss.setHeldByUserId(null);
                    ss.setHoldExpiresAt(null);
                    showtimeSeatRepository.save(ss);
                }
            }
            if (eventPublisher != null) {
                eventPublisher.publishEvent(new SeatStatusEvent(showtimeId, seatIds, "AVAILABLE", null, null));
            }
        }

        // Hoàn trả lượt sử dụng voucher nếu có
        if (booking.getPromotion() != null) {
            Promotion promo = booking.getPromotion();
            promo.setUsedCount(Math.max(0, promo.getUsedCount() - 1));
            promotionRepository.save(promo);
        }

        bookingRepository.save(booking);
        return ResponseEntity.ok(ApiResponse.success("Hủy đơn hàng thành công, ghế đã được mở lại!"));
    }

    @PatchMapping("/bookings/tickets/{ticketId}/check-in")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkInTicket(@PathVariable Long ticketId) {
        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new IllegalArgumentException("Vé không tồn tại"));

        if ("checked_in".equalsIgnoreCase(ticket.getStatus()) || "used".equalsIgnoreCase(ticket.getStatus())) {
            throw new IllegalArgumentException("Vé này đã được soát vào rạp trước đó rồi!");
        }
        if ("cancelled".equalsIgnoreCase(ticket.getStatus())) {
            throw new IllegalArgumentException("Vé đã bị hủy, không thể soát!");
        }

        ticket.setStatus("checked_in");
        ticket.setCheckedInAt(LocalDateTime.now());
        ticketRepository.save(ticket);

        Map<String, Object> res = new HashMap<>();
        res.put("ticketId", ticket.getId());
        res.put("ticketCode", ticket.getTicketCode());
        res.put("status", "checked_in");
        res.put("checkedInAt", ticket.getCheckedInAt());

        return ResponseEntity.ok(ApiResponse.success("Soát vé thành công!", res));
    }

    @GetMapping("/payments")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAdminPayments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String method) {

        List<Payment> all = paymentRepository.findAll();
        all.sort((a, b) -> Long.compare(b.getId(), a.getId()));

        if (method != null && !method.isBlank() && !"all".equalsIgnoreCase(method)) {
            all = all.stream().filter(p -> method.equalsIgnoreCase(p.getPaymentMethod())).collect(Collectors.toList());
        }

        int totalElements = all.size();
        int totalPages = (int) Math.ceil((double) totalElements / size);
        int start = Math.min(page * size, totalElements);
        int end = Math.min(start + size, totalElements);
        List<Payment> paged = all.subList(start, end);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("content", paged);
        response.put("totalElements", totalElements);
        response.put("totalPages", totalPages);
        response.put("currentPage", page);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
