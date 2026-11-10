package com.cinema.booking.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTOs for public catalog APIs: genres, cinemas, halls and showtimes grouped by cinema.
 */
public class CatalogDtos {

    public record GenreDto(Long id, String name) {}

    public record HallDto(Long id, Long cinemaId, String name, String screenType, Integer totalSeats) {}

    public record CinemaDto(Long id, String name, String address, String city, String hotline) {}

    /** One bookable time slot of a movie inside a cinema. */
    public record ShowtimeSlotDto(Long showtimeId, Long hallId, String hallName, String screenType,
                                  LocalDateTime startTime, LocalDateTime endTime, BigDecimal basePrice) {}

    /** A movie and its slots within a single cinema. */
    public record MovieShowtimesDto(Long movieId, String title, String posterUrl, String ageRating,
                                    Integer durationMinutes, List<ShowtimeSlotDto> showtimes) {}

    /** Showtimes of a day grouped by cinema → movie → slots. */
    public record CinemaShowtimesDto(Long cinemaId, String cinemaName, String address, String city,
                                     List<MovieShowtimesDto> movies) {}
}
