package com.cinema.booking.controller;

import com.cinema.booking.dto.ApiResponse;
import com.cinema.booking.dto.CatalogDtos.GenreDto;
import com.cinema.booking.service.CatalogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/genres")
@RequiredArgsConstructor
public class GenreController {

    private final CatalogService catalogService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<GenreDto>>> getGenres() {
        return ResponseEntity.ok(ApiResponse.success(catalogService.getGenres()));
    }
}
