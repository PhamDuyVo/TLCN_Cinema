package com.cinema.booking.controller;

import com.cinema.booking.dto.ApiResponse;
import com.cinema.booking.dto.MovieDtos.ShowtimeDto;
import com.cinema.booking.dto.MovieDtos.ShowtimeSeatsDto;
import com.cinema.booking.dto.CatalogDtos.CinemaShowtimesDto;
import com.cinema.booking.service.CatalogService;
import com.cinema.booking.service.ShowtimeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/showtimes")
@RequiredArgsConstructor
public class ShowtimeController {

    private final ShowtimeService showtimeService;
    private final CatalogService catalogService;

    /** Showtimes of a day grouped by cinema → movie → slots (for the 7-day schedule bar). */
    @GetMapping
    public ResponseEntity<ApiResponse<List<CinemaShowtimesDto>>> getShowtimes(@RequestParam(required = false) String date,
                                                                           @RequestParam(required = false) Long movieId,
                                                                           @RequestParam(required = false) Long cinemaId) {
        return ResponseEntity.ok(ApiResponse.success(catalogService.getShowtimesGroupedByCinema(date, movieId, cinemaId)));
    }

    @GetMapping("/movie/{movieId}")
    public ResponseEntity<ApiResponse<List<ShowtimeDto>>> getShowtimesByMovie(@PathVariable Long movieId,
                                                                              @RequestParam(required = false) String date) {
        List<ShowtimeDto> showtimes = showtimeService.getShowtimesByMovie(movieId, date);
        return ResponseEntity.ok(ApiResponse.success(showtimes));
    }

    @GetMapping("/{id}/seats")
    public ResponseEntity<ApiResponse<ShowtimeSeatsDto>> getShowtimeSeats(@PathVariable Long id) {
        ShowtimeSeatsDto seatsDto = showtimeService.getShowtimeSeats(id);
        return ResponseEntity.ok(ApiResponse.success(seatsDto));
    }
}
