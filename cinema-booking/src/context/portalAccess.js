export function portalRole(hostname) {
  if (hostname === 'admin.cinema.localhost') return 'admin';
  if (hostname === 'staff.cinema.localhost') return 'staff';
  return 'customer';
}
export function assertPortalRole(user, hostname = (typeof window !== 'undefined' ? window.location.hostname : '')) {
  if (hostname === 'localhost') {
    return;
  }
  const expected = portalRole(hostname);
  if (user?.role?.toLowerCase() !== expected) {
    const labels = { admin: 'quản trị viên', staff: 'nhân viên', customer: 'khách hàng' };
    throw new Error(`Trang này chỉ cho phép tài khoản ${labels[expected]} đăng nhập. Vui lòng sử dụng đúng cổng của bạn.`);
  }
}
