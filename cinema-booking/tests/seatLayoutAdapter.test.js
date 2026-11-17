import { describe, it, expect } from 'vitest';
import { adaptSeatLayout } from '../src/components/booking/seatLayoutAdapter';

describe('backend seat layout mapping', () => {
  it('preserves IDs, status, types and aisle gaps without adding seats', () => {
    const seats = [
      { id: 9, seatRow: 'A', seatCol: 1, layoutCol: 1, seatType: 'VIP', status: 'BOOKED' },
      { id: 14, seatRow: 'A', seatCol: 2, layoutCol: 4, seatType: 'COUPLE', status: 'AVAILABLE' },
    ];
    const result = adaptSeatLayout(seats);
    expect(result).toHaveLength(2);
    result.forEach((seat, i) => expect(seat).toMatchObject(seats[i]));
    expect(result[1].position[0] - result[0].position[0]).toBeCloseTo(5.7);
    expect(seats[0].position).toBeUndefined();
  });

  it('uses room configuration and raises successive rows', () => {
    const result = adaptSeatLayout(
      [
        { id: 1, seatRow: 'A', seatCol: 1 },
        { id: 2, seatRow: 'B', seatCol: 1 },
      ],
      { rowRise: 0.3, rowPitch: 2, frontGap: 4 }
    );
    expect(result.map((s) => s.position)).toEqual([
      [0, 0, 4],
      [0, 0.3, 6],
    ]);
  });

  it('handles an empty or replacement room without retaining seats', () => {
    expect(adaptSeatLayout([])).toEqual([]);
    expect(adaptSeatLayout([{ id: 33, seatRow: 'C', seatCol: 2 }]).map((s) => s.id)).toEqual([33]);
  });
});

