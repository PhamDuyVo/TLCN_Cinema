// Estimated metres, not measured cinema dimensions. No seats are synthesized.
export const defaultRoomScale = { columnPitch: 1.9, rowPitch: 1.8, rowRise: 0.24, frontGap: 2.6 };
export function adaptSeatLayout(seats, config = {}) {
  const c = { ...defaultRoomScale, ...config };
  const rows = [...new Set(seats.map(s => s.seatRow))].sort((a,b) => a.localeCompare(b, undefined, { numeric: true }));
  const columns = Math.max(1, ...seats.map(s => s.layoutCol ?? s.seatCol));
  return seats.map(s => ({ ...s, position: [((s.layoutCol ?? s.seatCol) - (columns + 1) / 2) * c.columnPitch, rows.indexOf(s.seatRow) * c.rowRise, c.frontGap + rows.indexOf(s.seatRow) * c.rowPitch] }));
}
