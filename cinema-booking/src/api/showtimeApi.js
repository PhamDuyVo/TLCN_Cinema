import axiosClient from './axiosClient';

export const showtimeApi = {
  getHold: (id) => axiosClient.get(`/showtimes/${id}/hold`),
  putHold: (id, seatIds) => axiosClient.put(`/showtimes/${id}/hold`, { seatIds }),
  deleteHold: (id) => axiosClient.delete(`/showtimes/${id}/hold`),
  getShowtimesByMovie: (movieId, date) => axiosClient.get(`/showtimes/movie/${movieId}`, { params: { date } }),
  getGroupedShowtimes: (params) => axiosClient.get('/showtimes', { params }),
  getShowtimeSeats: (showtimeId) => axiosClient.get(`/showtimes/${showtimeId}/seats`),
};

export default showtimeApi;
