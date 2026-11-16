-- Demo spatial layout only; preserve every seat ID, number, ticket and hold.
UPDATE seats s JOIN rooms r ON s.room_id=r.id JOIN cinemas c ON c.id=r.cinema_id
SET s.layout_col = CASE MOD(r.id,3)
 WHEN 0 THEN s.seat_number + IF(s.seat_number>4,2,0) + IF(s.row_label IN ('A','B'),1,0)
 WHEN 1 THEN s.seat_number + IF(s.seat_number>2,2,0) + IF(s.seat_number>6,2,0) + IF(s.row_label IN ('A','C','E'),1,0)
 ELSE s.seat_number + IF(s.seat_number>4,3,0) + CASE s.row_label WHEN 'A' THEN 2 WHEN 'B' THEN 1 WHEN 'E' THEN 1 WHEN 'F' THEN 2 ELSE 0 END END
WHERE c.name LIKE 'UTE Demo%' AND r.name LIKE 'Demo %';
