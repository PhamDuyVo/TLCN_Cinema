import AdminLoginPage from '../pages/admin/AdminLoginPage';
import { Routes, Route, Navigate } from 'react-router-dom';
import CustomerLayout from '../layouts/CustomerLayout';
import StaffLayout from '../layouts/StaffLayout';
import AdminLayout from '../layouts/AdminLayout';
import ProtectedRoute from './ProtectedRoute';
import { ROLES } from '../utils/constants';

import HomePage from '../pages/guest_customer/HomePage';
import MoviesPage from '../pages/guest_customer/MoviesPage';
import MovieDetailPage from '../pages/guest_customer/MovieDetailPage';
import BookingSeatPage from '../pages/guest_customer/BookingSeatPage';
import CheckoutPage from '../pages/guest_customer/CheckoutPage';
import BookingSuccessPage from '../pages/guest_customer/BookingSuccessPage';
import AuthPages from '../pages/guest_customer/AuthPages';
import ShowtimesPage from '../pages/guest_customer/ShowtimesPage';
import CinemasPage from '../pages/guest_customer/CinemasPage';
import PromotionsPage from '../pages/guest_customer/PromotionsPage';

import UserProfilePage from '../pages/guest_customer/UserProfilePage';

import {
  TicketHistoryPage,
} from '../pages/guest_customer/CustomerPages';

import {
  StaffLoginPage,
  PosBookingPage,
  QrCheckInPage,
  TicketLookupPage,
} from '../pages/staff/StaffPages';

import {
  DashboardPage,
  ManageMoviesPage,
  ManageShowtimesPage,
  ManageCinemasPage,
  ManageUsersPage,
  ManagePromotionsPage,
  ManageBookingsPage,
} from '../pages/admin/AdminPages';

export const AppRoutes = () => {
  const hostname = window.location.hostname;
  const isSubdomain = hostname === 'admin.cinema.localhost' || hostname === 'staff.cinema.localhost';
  const portal = hostname === 'admin.cinema.localhost' ? 'admin' : hostname === 'staff.cinema.localhost' ? 'staff' : 'customer';

  const showCustomer = !isSubdomain || portal === 'customer';
  const showStaff = !isSubdomain || portal === 'staff';
  const showAdmin = !isSubdomain || portal === 'admin';

  return (
    <Routes>
      {/* 1. Customer & Guest Routes */}
      {showCustomer && <Route element={<CustomerLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/movies" element={<MoviesPage />} />
        <Route path="/movies/:id" element={<MovieDetailPage />} />
        <Route path="/showtimes" element={<ShowtimesPage />} />
        <Route path="/cinemas" element={<CinemasPage />} />
        <Route path="/promotions" element={<PromotionsPage />} />
        <Route path="/login" element={<AuthPages />} />
        <Route path="/register" element={<AuthPages />} />

        {/* Protected Customer Routes */}
        <Route element={<ProtectedRoute allowedRoles={[ROLES.CUSTOMER]} />}>
          <Route path="/booking/:showtimeId" element={<BookingSeatPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/booking-success" element={<BookingSuccessPage />} />
          <Route path="/profile" element={<UserProfilePage />} />
          <Route path="/my-tickets" element={<TicketHistoryPage />} />
        </Route>
      </Route>}

      {/* 2. Staff Routes */}
      {showStaff && <>
      <Route path="/staff/login" element={<StaffLoginPage />} />
      <Route element={<ProtectedRoute allowedRoles={[ROLES.STAFF]} loginPath="/login" deniedPath="/login" />}>
        <Route element={<StaffLayout />}>
          <Route path="/staff/pos" element={<PosBookingPage />} />
          <Route path="/staff/checkin" element={<QrCheckInPage />} />
          <Route path="/staff/lookup" element={<TicketLookupPage />} />
        </Route>
      </Route>
      </>}

      {/* 3. Admin Routes */}
      {showAdmin && <>
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} loginPath="/login" deniedPath="/login" />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<DashboardPage />} />
          <Route path="/admin/movies" element={<ManageMoviesPage />} />
          <Route path="/admin/showtimes" element={<ManageShowtimesPage />} />
          <Route path="/admin/cinemas" element={<ManageCinemasPage />} />
          <Route path="/admin/users" element={<ManageUsersPage />} />
          <Route path="/admin/promotions" element={<ManagePromotionsPage />} />
          <Route path="/admin/bookings" element={<ManageBookingsPage />} />
        </Route>
      </Route>
      </>}

      <Route path="*" element={<Navigate to={portal === 'admin' ? '/admin' : portal === 'staff' ? '/staff/pos' : '/'} replace />} />
    </Routes>
  );
};

export default AppRoutes;
