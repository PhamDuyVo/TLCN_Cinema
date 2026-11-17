import axiosClient from './axiosClient';

export const bookingApi = {
  quote: (data) => axiosClient.post('/bookings/quote', data),
  createBooking: (bookingData) => axiosClient.post('/bookings', bookingData),
  getBookingDetail: (code) => axiosClient.get(`/bookings/${code}`),
  getMyBookings: () => axiosClient.get('/bookings/my-tickets'),
  applyPromotion: (data) => axiosClient.post('/promotions/apply', data),
  getCombos: () => axiosClient.get('/combos'),
  createPayPalOrder: (bookingCode) => axiosClient.post('/payments/paypal/create-order', { bookingCode }),
  capturePayPalOrder: (orderId) => axiosClient.post('/payments/paypal/capture-order', { orderId }),
  cancelBooking: (code) => axiosClient.post(`/bookings/${code}/cancel`),
};

export default bookingApi;
