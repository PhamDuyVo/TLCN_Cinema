package com.cinema.booking.controller;

import com.cinema.booking.dto.ApiResponse;
import com.cinema.booking.dto.CatalogDtos.CinemaDto;
import com.cinema.booking.dto.CatalogDtos.CinemaShowtimesDto;
import com.cinema.booking.dto.CatalogDtos.HallDto;
import com.cinema.booking.service.CatalogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/cinemas")
@RequiredArgsConstructor
public class CinemaController {

    private final CatalogService catalogService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CinemaDto>>> getCinemas(@RequestParam(required = false) String city) {
        return ResponseEntity.ok(ApiResponse.success(catalogService.getCinemas(city)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CinemaDto>> getCinema(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(catalogService.getCinema(id)));
    }

    @GetMapping("/{id}/halls")
    public ResponseEntity<ApiResponse<List<HallDto>>> getHalls(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(catalogService.getHalls(id)));
    }

    @GetMapping("/{id}/showtimes")
    public ResponseEntity<ApiResponse<List<CinemaShowtimesDto>>> getCinemaShowtimes(@PathVariable Long id,
                                                                                 @RequestParam(required = false) String date) {
        return ResponseEntity.ok(ApiResponse.success(catalogService.getShowtimesGroupedByCinema(date, null, id)));
    }
}
