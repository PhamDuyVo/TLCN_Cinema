import axiosClient from './axiosClient';

export const adminApi = {
  // Phim
  getMovies: (params) => axiosClient.get('/admin/movies', { params }),
  createMovie: (data) => axiosClient.post('/admin/movies', data),
  updateMovie: (id, data) => axiosClient.put(`/admin/movies/${id}`, data),
  deleteMovie: (id) => axiosClient.delete(`/admin/movies/${id}`),

  // Rạp & Phòng chiếu
  getCinemas: () => axiosClient.get('/admin/cinemas'),
  getRoomsByCinema: (cinemaId) => axiosClient.get(`/admin/cinemas/${cinemaId}/rooms`),
  createCinema: (data) => axiosClient.post('/admin/cinemas', data),
  updateCinema: (id, data) => axiosClient.put(`/admin/cinemas/${id}`, data),
  updateCinemaStatus: (id, status) => axiosClient.patch(`/admin/cinemas/${id}/status`, { status }),

  // Phòng chiếu (Halls)
  createHall: (cinemaId, data) => axiosClient.post(`/admin/cinemas/${cinemaId}/halls`, data),
  updateHall: (id, data) => axiosClient.put(`/admin/halls/${id}`, data),
  deleteHall: (id) => axiosClient.delete(`/admin/halls/${id}`),
  getHallDetail: (id) => axiosClient.get(`/admin/halls/${id}`),

  // Ghế (Seats)
  getSeatsByHall: (hallId) => axiosClient.get(`/admin/halls/${hallId}/seats`),
  updateSeatStatus: (id, status) => axiosClient.patch(`/admin/seats/${id}/status`, { status }),
  generateSeats: (hallId, data) => axiosClient.post(`/admin/halls/${hallId}/seats/generate`, data),

  // Suất chiếu
  getShowtimes: (params) => axiosClient.get('/admin/showtimes', { params }),
  createShowtime: (data) => axiosClient.post('/admin/showtimes', data),
  updateShowtime: (id, data) => axiosClient.put(`/admin/showtimes/${id}`, data),
  cancelShowtime: (id) => axiosClient.patch(`/admin/showtimes/${id}/status`, { status: 'cancelled' }),

  // Người dùng
  getUsers: (params) => axiosClient.get('/admin/users', { params }),
  updateUserStatus: (id, status) => axiosClient.patch(`/admin/users/${id}/status`, { status }),
  createUser: (data) => axiosClient.post('/admin/users', data),

  // Thống kê
  getDashboardStats: (params) => axiosClient.get('/admin/stats/dashboard', { params }),
  getRevenueStats: (params) => axiosClient.get('/admin/stats/revenue', { params }),
  getTicketStats: (params) => axiosClient.get('/admin/stats/tickets', { params }),
  getMovieStats: (params) => axiosClient.get('/admin/stats/movies', { params }),
  getShowtimeStats: (params) => axiosClient.get('/admin/stats/showtimes', { params }),

  // Đơn hàng & Thanh toán
  getBookings: (params) => axiosClient.get('/admin/bookings', { params }),
  getPayments: (params) => axiosClient.get('/admin/payments', { params }),
  confirmBookingPayment: (id) => axiosClient.patch(`/admin/bookings/${id}/confirm-payment`),
  cancelAdminBooking: (id, reason) => axiosClient.patch(`/admin/bookings/${id}/cancel`, { reason }),
  checkInTicket: (ticketId) => axiosClient.patch(`/admin/bookings/tickets/${ticketId}/check-in`),

  // Khuyến mãi (Promotions)
  getPromotions: () => axiosClient.get('/admin/promotions'),
  createPromotion: (data) => axiosClient.post('/admin/promotions', data),
  updatePromotion: (id, data) => axiosClient.put(`/admin/promotions/${id}`, data),
  togglePromotionStatus: (id, isActive) => axiosClient.patch(`/admin/promotions/${id}/status`, { isActive }),
  deletePromotion: (id) => axiosClient.delete(`/admin/promotions/${id}`),
};

export default adminApi;
