package com.cinema.booking.service;

import com.cinema.booking.entity.Booking;
import com.cinema.booking.entity.Showtime;
import com.cinema.booking.entity.Ticket;
import com.cinema.booking.entity.User;
import com.cinema.booking.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminStatsService {

    private final BookingRepository bookingRepository;
    private final TicketRepository ticketRepository;
    private final ShowtimeRepository showtimeRepository;
    private final MovieRepository movieRepository;
    private final UserRepository userRepository;
    private final HallRepository hallRepository;

    // -------------------------------------------------------------------------
    // 1. Revenue by range, grouped by day or month
    // -------------------------------------------------------------------------
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getRevenueByRange(LocalDate from, LocalDate to, String groupBy) {
        LocalDateTime start = from.atStartOfDay();
        LocalDateTime end   = to.plusDays(1).atStartOfDay();

        List<Booking> paid = bookingRepository.findAll().stream()
                .filter(b -> "PAID".equalsIgnoreCase(b.getStatus()))
                .filter(b -> b.getCreatedAt() != null
                          && !b.getCreatedAt().isBefore(start)
                          && b.getCreatedAt().isBefore(end))
                .collect(Collectors.toList());

        // Group by period key
        DateTimeFormatter fmt = "month".equalsIgnoreCase(groupBy)
                ? DateTimeFormatter.ofPattern("yyyy-MM")
                : DateTimeFormatter.ofPattern("yyyy-MM-dd");

        Map<String, List<Booking>> grouped = paid.stream()
                .collect(Collectors.groupingBy(b -> b.getCreatedAt().format(fmt)));

        // Sort periods and build result
        List<String> sortedPeriods = new ArrayList<>(grouped.keySet());
        Collections.sort(sortedPeriods);

        List<Map<String, Object>> result = new ArrayList<>();
        for (String period : sortedPeriods) {
            List<Booking> periodBookings = grouped.get(period);
            BigDecimal revenue = periodBookings.stream()
                    .map(Booking::getFinalAmount)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            long ticketCount = periodBookings.stream()
                    .mapToLong(b -> b.getTickets().size())
                    .sum();

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("period", period);
            row.put("revenue", revenue);
            row.put("ticketCount", ticketCount);
            result.add(row);
        }
        return result;
    }

    // -------------------------------------------------------------------------
    // 2. Dashboard summary stats
    // -------------------------------------------------------------------------
    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardStats() {
        List<Booking> allBookings = bookingRepository.findAll();
        List<Booking> paidBookings = allBookings.stream()
                .filter(b -> "PAID".equalsIgnoreCase(b.getStatus()))
                .collect(Collectors.toList());

        BigDecimal totalRevenue = paidBookings.stream()
                .map(Booking::getFinalAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Revenue this month
        LocalDate now = LocalDate.now();
        LocalDateTime monthStart = now.withDayOfMonth(1).atStartOfDay();
        LocalDateTime monthEnd   = now.plusMonths(1).withDayOfMonth(1).atStartOfDay();
        BigDecimal revenueThisMonth = paidBookings.stream()
                .filter(b -> b.getCreatedAt() != null
                          && !b.getCreatedAt().isBefore(monthStart)
                          && b.getCreatedAt().isBefore(monthEnd))
                .map(Booking::getFinalAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Revenue last month
        LocalDateTime lastMonthStart = now.minusMonths(1).withDayOfMonth(1).atStartOfDay();
        BigDecimal revenueLastMonth = paidBookings.stream()
                .filter(b -> b.getCreatedAt() != null
                          && !b.getCreatedAt().isBefore(lastMonthStart)
                          && b.getCreatedAt().isBefore(monthStart))
                .map(Booking::getFinalAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Tickets sold today
        LocalDateTime todayStart = now.atStartOfDay();
        LocalDateTime todayEnd   = now.plusDays(1).atStartOfDay();
        long ticketsSoldToday = paidBookings.stream()
                .filter(b -> b.getCreatedAt() != null
                          && !b.getCreatedAt().isBefore(todayStart)
                          && b.getCreatedAt().isBefore(todayEnd))
                .mapToLong(b -> b.getTickets().size())
                .sum();

        // User breakdowns
        List<User> allUsers = userRepository.findAll();
        long totalCustomers = allUsers.stream()
                .filter(u -> u.getRole() == User.UserRole.CUSTOMER)
                .count();
        long totalStaff = allUsers.stream()
                .filter(u -> u.getRole() == User.UserRole.STAFF)
                .count();

        // Active showtimes (scheduled or ongoing, start time in future or today)
        long activeShowtimes = showtimeRepository.findAll().stream()
                .filter(s -> "scheduled".equalsIgnoreCase(s.getStatus())
                          || "ongoing".equalsIgnoreCase(s.getStatus()))
                .count();

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalUsers",        allUsers.size());
        stats.put("totalCustomers",    totalCustomers);
        stats.put("totalStaff",        totalStaff);
        stats.put("totalMovies",       movieRepository.count());
        stats.put("totalBookings",     allBookings.size());
        stats.put("totalRevenue",      totalRevenue);
        stats.put("activeShowtimes",   activeShowtimes);
        stats.put("revenueThisMonth",  revenueThisMonth);
        stats.put("revenueLastMonth",  revenueLastMonth);
        stats.put("ticketsSoldToday",  ticketsSoldToday);
        return stats;
    }

    // -------------------------------------------------------------------------
    // 3. Ticket stats for a date range
    // -------------------------------------------------------------------------
    @Transactional(readOnly = true)
    public Map<String, Object> getTicketStats(LocalDate from, LocalDate to) {
        LocalDateTime start = from.atStartOfDay();
        LocalDateTime end   = to.plusDays(1).atStartOfDay();

        // Filter bookings in range (use createdAt of the booking as proxy)
        List<Booking> rangeBookings = bookingRepository.findAll().stream()
                .filter(b -> b.getCreatedAt() != null
                          && !b.getCreatedAt().isBefore(start)
                          && b.getCreatedAt().isBefore(end))
                .collect(Collectors.toList());

        long totalSold      = rangeBookings.stream().filter(b -> "PAID".equalsIgnoreCase(b.getStatus()))
                                           .mapToLong(b -> b.getTickets().size()).sum();
        long totalCancelled = rangeBookings.stream().filter(b -> "CANCELLED".equalsIgnoreCase(b.getStatus()))
                                           .mapToLong(b -> b.getTickets().size()).sum();
        long totalPending   = rangeBookings.stream()
                                           .filter(b -> !"PAID".equalsIgnoreCase(b.getStatus())
                                                     && !"CANCELLED".equalsIgnoreCase(b.getStatus()))
                                           .mapToLong(b -> b.getTickets().size()).sum();

        // Tickets by seat type (from PAID bookings)
        Map<String, Long> byType = new LinkedHashMap<>();
        rangeBookings.stream()
                .filter(b -> "PAID".equalsIgnoreCase(b.getStatus()))
                .flatMap(b -> b.getTickets().stream())
                .forEach(t -> {
                    String typeName = t.getSeat() != null && t.getSeat().getSeatType() != null
                            ? t.getSeat().getSeatType().getName().toLowerCase()
                            : "unknown";
                    byType.merge(typeName, 1L, Long::sum);
                });

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalSold",      totalSold);
        result.put("totalCancelled", totalCancelled);
        result.put("totalPending",   totalPending);
        result.put("byType",         byType);
        return result;
    }

    // -------------------------------------------------------------------------
    // 4. Movie stats (top selling movies)
    // -------------------------------------------------------------------------
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getMovieStats(LocalDate from, LocalDate to) {
        LocalDateTime start = from.atStartOfDay();
        LocalDateTime end   = to.plusDays(1).atStartOfDay();

        List<Booking> paid = bookingRepository.findAll().stream()
                .filter(b -> "PAID".equalsIgnoreCase(b.getStatus()))
                .filter(b -> b.getCreatedAt() != null
                          && !b.getCreatedAt().isBefore(start)
                          && b.getCreatedAt().isBefore(end))
                .collect(Collectors.toList());

        // Group by movie
        // movieId -> { ticketsSold, revenue, showtimeIds }
        Map<Long, Map<String, Object>> movieAgg = new LinkedHashMap<>();

        for (Booking b : paid) {
            if (b.getShowtime() == null || b.getShowtime().getMovie() == null) continue;
            Long movieId     = b.getShowtime().getMovie().getId();
            String movieTitle = b.getShowtime().getMovie().getTitle();
            Long showtimeId  = b.getShowtime().getId();

            Map<String, Object> entry = movieAgg.computeIfAbsent(movieId, k -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("movieId",      movieId);
                m.put("movieTitle",   movieTitle);
                m.put("ticketsSold",  0L);
                m.put("revenue",      BigDecimal.ZERO);
                m.put("showtimeIds",  new HashSet<Long>());
                return m;
            });

            long tickets = b.getTickets().size();
            entry.put("ticketsSold", (Long) entry.get("ticketsSold") + tickets);
            entry.put("revenue",     ((BigDecimal) entry.get("revenue"))
                                        .add(b.getFinalAmount() != null ? b.getFinalAmount() : BigDecimal.ZERO));
            ((Set<Long>) entry.get("showtimeIds")).add(showtimeId);
        }

        // Convert to output list, replace showtimeIds set with count, sort by ticketsSold desc
        List<Map<String, Object>> result = new ArrayList<>();
        for (Map<String, Object> entry : movieAgg.values()) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("movieId",      entry.get("movieId"));
            row.put("movieTitle",   entry.get("movieTitle"));
            row.put("ticketsSold",  entry.get("ticketsSold"));
            row.put("revenue",      entry.get("revenue"));
            row.put("showtimeCount", ((Set<?>) entry.get("showtimeIds")).size());
            result.add(row);
        }

        result.sort((a, b2) -> Long.compare((Long) b2.get("ticketsSold"), (Long) a.get("ticketsSold")));
        return result;
    }

    // -------------------------------------------------------------------------
    // 5. Showtime stats
    // -------------------------------------------------------------------------
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getShowtimeStats(LocalDate from, LocalDate to) {
        LocalDateTime start = from.atStartOfDay();
        LocalDateTime end   = to.plusDays(1).atStartOfDay();

        List<Showtime> showtimes = showtimeRepository.findAll().stream()
                .filter(s -> s.getStartTime() != null
                          && !s.getStartTime().isBefore(start)
                          && s.getStartTime().isBefore(end))
                .collect(Collectors.toList());

        // For each showtime, aggregate paid bookings
        List<Booking> allPaid = bookingRepository.findAll().stream()
                .filter(b -> "PAID".equalsIgnoreCase(b.getStatus()))
                .collect(Collectors.toList());

        Map<Long, List<Booking>> byShowtime = allPaid.stream()
                .filter(b -> b.getShowtime() != null)
                .collect(Collectors.groupingBy(b -> b.getShowtime().getId()));

        List<Map<String, Object>> result = new ArrayList<>();
        for (Showtime st : showtimes) {
            List<Booking> stBookings = byShowtime.getOrDefault(st.getId(), Collections.emptyList());

            long soldSeats = stBookings.stream().mapToLong(b -> b.getTickets().size()).sum();
            BigDecimal revenue = stBookings.stream()
                    .map(Booking::getFinalAmount)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            int totalSeats = (st.getHall() != null && st.getHall().getTotalSeats() != null)
                    ? st.getHall().getTotalSeats() : 0;

            double occupancyRate = totalSeats > 0
                    ? BigDecimal.valueOf(soldSeats * 100.0 / totalSeats)
                               .setScale(2, RoundingMode.HALF_UP).doubleValue()
                    : 0.0;

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("showtimeId",    st.getId());
            row.put("movieTitle",    st.getMovie() != null ? st.getMovie().getTitle() : "");
            row.put("startTime",     st.getStartTime());
            row.put("totalSeats",    totalSeats);
            row.put("soldSeats",     soldSeats);
            row.put("revenue",       revenue);
            row.put("occupancyRate", occupancyRate);
            result.add(row);
        }

        // Sort by startTime desc
        result.sort((a, b) -> ((LocalDateTime) b.get("startTime")).compareTo((LocalDateTime) a.get("startTime")));
        return result;
    }
}
