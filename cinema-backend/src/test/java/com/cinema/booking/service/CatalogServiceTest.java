package com.cinema.booking.service;

import com.cinema.booking.dto.CatalogDtos.CinemaShowtimesDto;
import com.cinema.booking.entity.*;
import com.cinema.booking.repository.*;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class CatalogServiceTest {

    private final GenreRepository genres = mock(GenreRepository.class);
    private final CinemaRepository cinemas = mock(CinemaRepository.class);
    private final HallRepository halls = mock(HallRepository.class);
    private final ShowtimeRepository showtimes = mock(ShowtimeRepository.class);
    private final CatalogService service = new CatalogService(genres, cinemas, halls, showtimes);

    private final LocalDate tomorrow = LocalDate.now().plusDays(1);

    private Cinema cinema(long id, String name) {
        return Cinema.builder().id(id).name(name).address("addr").city("HCM").build();
    }

    private Showtime show(long id, Movie m, Hall h, int hour) {
        return Showtime.builder().id(id).movie(m).hall(h).basePrice(BigDecimal.TEN)
                .startTime(tomorrow.atTime(hour, 0)).endTime(tomorrow.atTime(hour + 2, 0)).build();
    }

    @Test
    void groupsShowtimesByCinemaThenMovie() {
        Movie a = Movie.builder().id(1L).title("A").durationMinutes(100).build();
        Movie b = Movie.builder().id(2L).title("B").durationMinutes(100).build();
        Hall h1 = Hall.builder().id(11L).cinemaId(1L).name("P1").build();
        Hall h2 = Hall.builder().id(21L).cinemaId(2L).name("P1").build();
        when(showtimes.findByStatusAndStartTimeBetweenOrderByStartTimeAsc(eq("scheduled"), any(), any()))
                .thenReturn(List.of(show(1, a, h1, 9), show(2, b, h1, 10), show(3, a, h1, 13), show(4, a, h2, 14)));
        when(cinemas.findAllById(any())).thenReturn(List.of(cinema(1, "UTE Thu Duc"), cinema(2, "UTE Quan 1")));

        List<CinemaShowtimesDto> result = service.getShowtimesGroupedByCinema(tomorrow.toString(), null, null);

        assertEquals(List.of("UTE Quan 1", "UTE Thu Duc"), result.stream().map(CinemaShowtimesDto::cinemaName).toList());
        CinemaShowtimesDto thuDuc = result.get(1);
        assertEquals(2, thuDuc.movies().size());
        assertEquals("A", thuDuc.movies().get(0).title());
        assertEquals(List.of(1L, 3L), thuDuc.movies().get(0).showtimes().stream().map(s -> s.showtimeId()).toList());
    }

    @Test
    void filtersByMovieAndCinemaAndSkipsInactiveHalls() {
        Movie a = Movie.builder().id(1L).title("A").build();
        Movie b = Movie.builder().id(2L).title("B").build();
        Hall h1 = Hall.builder().id(11L).cinemaId(1L).name("P1").build();
        Hall closed = Hall.builder().id(12L).cinemaId(1L).name("P2").status("maintenance").build();
        Hall h2 = Hall.builder().id(21L).cinemaId(2L).name("P1").build();
        when(showtimes.findByStatusAndStartTimeBetweenOrderByStartTimeAsc(eq("scheduled"), any(), any()))
                .thenReturn(List.of(show(1, a, h1, 9), show(2, b, h1, 10), show(3, a, closed, 11), show(4, a, h2, 12)));
        when(cinemas.findAllById(any())).thenReturn(List.of(cinema(1, "C1")));

        List<CinemaShowtimesDto> result = service.getShowtimesGroupedByCinema(tomorrow.toString(), 1L, 1L);

        assertEquals(1, result.size());
        assertEquals(1, result.get(0).movies().size());
        assertEquals(List.of(1L), result.get(0).movies().get(0).showtimes().stream().map(s -> s.showtimeId()).toList());
    }

    @Test
    void pastDateReturnsEmptyAndInvalidDateIsRejected() {
        assertTrue(service.getShowtimesGroupedByCinema(LocalDate.now().minusDays(1).toString(), null, null).isEmpty());
        verify(showtimes, never()).findByStatusAndStartTimeBetweenOrderByStartTimeAsc(any(), any(LocalDateTime.class), any());
        assertThrows(IllegalArgumentException.class, () -> service.getShowtimesGroupedByCinema("10/11/2026", null, null));
    }
}
