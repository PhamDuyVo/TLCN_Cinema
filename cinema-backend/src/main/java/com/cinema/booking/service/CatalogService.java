package com.cinema.booking.service;

import com.cinema.booking.dto.CatalogDtos.*;
import com.cinema.booking.entity.*;
import com.cinema.booking.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CatalogService {

    private final GenreRepository genreRepository;
    private final CinemaRepository cinemaRepository;
    private final HallRepository hallRepository;
    private final ShowtimeRepository showtimeRepository;

    public List<GenreDto> getGenres() {
        return genreRepository.findAll(Sort.by("name")).stream()
                .map(g -> new GenreDto(g.getId(), g.getName()))
                .toList();
    }

    public List<CinemaDto> getCinemas(String city) {
        return cinemaRepository.findByStatus("active").stream()
                .filter(c -> city == null || city.isBlank() || c.getCity().equalsIgnoreCase(city.trim()))
                .sorted(Comparator.comparing(Cinema::getName))
                .map(this::toCinemaDto)
                .toList();
    }

    public CinemaDto getCinema(Long id) {
        return cinemaRepository.findById(id)
                .filter(c -> "active".equalsIgnoreCase(c.getStatus()))
                .map(this::toCinemaDto)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy rạp ID: " + id));
    }

    public List<HallDto> getHalls(Long cinemaId) {
        getCinema(cinemaId);
        return hallRepository.findByCinemaId(cinemaId).stream()
                .filter(h -> "active".equalsIgnoreCase(h.getStatus()))
                .sorted(Comparator.comparing(Hall::getName))
                .map(h -> new HallDto(h.getId(), h.getCinemaId(), h.getName(), h.getScreenType(), h.getTotalSeats()))
                .toList();
    }

    /**
     * Showtimes of one day grouped by cinema → movie → slots.
     * Only scheduled showtimes that have not started yet are returned.
     *
     * @param dateStr  yyyy-MM-dd, defaults to today
     * @param movieId  optional movie filter
     * @param cinemaId optional cinema filter
     */
    public List<CinemaShowtimesDto> getShowtimesGroupedByCinema(String dateStr, Long movieId, Long cinemaId) {
        LocalDate date = parseDate(dateStr);
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime from = date.atStartOfDay().isBefore(now) ? now : date.atStartOfDay();
        LocalDateTime to = date.atTime(LocalTime.MAX);
        if (from.isAfter(to)) return List.of();

        List<Showtime> showtimes = showtimeRepository
                .findByStatusAndStartTimeBetweenOrderByStartTimeAsc("scheduled", from, to).stream()
                .filter(s -> s.getHall() != null && "active".equalsIgnoreCase(s.getHall().getStatus()))
                .filter(s -> movieId == null || s.getMovie().getId().equals(movieId))
                .filter(s -> cinemaId == null || cinemaId.equals(s.getHall().getCinemaId()))
                .toList();
        if (showtimes.isEmpty()) return List.of();

        Set<Long> cinemaIds = showtimes.stream().map(s -> s.getHall().getCinemaId()).collect(Collectors.toSet());
        Map<Long, Cinema> cinemas = cinemaRepository.findAllById(cinemaIds).stream()
                .filter(c -> "active".equalsIgnoreCase(c.getStatus()))
                .collect(Collectors.toMap(Cinema::getId, Function.identity()));

        // LinkedHashMap keeps showtimes ordered by start time inside each group
        Map<Long, Map<Long, List<Showtime>>> grouped = new LinkedHashMap<>();
        for (Showtime s : showtimes) {
            Long cId = s.getHall().getCinemaId();
            if (!cinemas.containsKey(cId)) continue;
            grouped.computeIfAbsent(cId, k -> new LinkedHashMap<>())
                    .computeIfAbsent(s.getMovie().getId(), k -> new ArrayList<>())
                    .add(s);
        }

        return grouped.entrySet().stream()
                .map(e -> {
                    Cinema c = cinemas.get(e.getKey());
                    List<MovieShowtimesDto> movies = e.getValue().values().stream()
                            .map(this::toMovieShowtimes)
                            .sorted(Comparator.comparing(MovieShowtimesDto::title))
                            .toList();
                    return new CinemaShowtimesDto(c.getId(), c.getName(), c.getAddress(), c.getCity(), movies);
                })
                .sorted(Comparator.comparing(CinemaShowtimesDto::cinemaName))
                .toList();
    }

    private MovieShowtimesDto toMovieShowtimes(List<Showtime> list) {
        Movie m = list.get(0).getMovie();
        List<ShowtimeSlotDto> slots = list.stream()
                .map(s -> new ShowtimeSlotDto(s.getId(), s.getHall().getId(), s.getHall().getName(),
                        s.getHall().getScreenType(), s.getStartTime(), s.getEndTime(), s.getBasePrice()))
                .toList();
        return new MovieShowtimesDto(m.getId(), m.getTitle(), m.getPosterUrl(), m.getAgeRating(),
                m.getDurationMinutes(), slots);
    }

    private CinemaDto toCinemaDto(Cinema c) {
        return new CinemaDto(c.getId(), c.getName(), c.getAddress(), c.getCity(), c.getHotline());
    }

    private static LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return LocalDate.now();
        try {
            return LocalDate.parse(dateStr.trim());
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("Ngày không hợp lệ, định dạng yyyy-MM-dd");
        }
    }
}
