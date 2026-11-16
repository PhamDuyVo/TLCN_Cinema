import { describe, it, expect } from 'vitest';
import { assertPortalRole } from '../src/context/portalAccess';
describe('each portal permits exactly its own role', () => {
  for (const [host, expected] of [['cinema.localhost','customer'], ['staff.cinema.localhost','staff'], ['admin.cinema.localhost','admin'], ['127.0.0.1','customer']]) {
    for (const role of ['customer','staff','admin']) {
      it(`${host}: ${role}`, () => {
        const check = () => assertPortalRole({ role: role.toUpperCase() }, host);
        if (role === expected) expect(check).not.toThrow();
        else expect(check).toThrow('Trang này chỉ cho phép');
      });
    }
  }
  it('rejects missing and unknown roles', () => {
    expect(() => assertPortalRole(null, 'admin.cinema.localhost')).toThrow();
    expect(() => assertPortalRole({ role: 'superadmin' }, 'admin.cinema.localhost')).toThrow();
  });
});
