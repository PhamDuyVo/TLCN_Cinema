import axiosClient from './axiosClient';

export const paymentApi = {
  createPayPalOrder: (bookingCode) => axiosClient.post('/payments/paypal/create-order', { bookingCode }),
  capturePayPalOrder: (orderId) => axiosClient.post('/payments/paypal/capture-order', { orderId }),
};

export default paymentApi;
