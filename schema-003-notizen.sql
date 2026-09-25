-- Freitext fuer 'Berlin & Umgebung' und 'Sonstiges' (September 2026)
ALTER TABLE listings ADD COLUMN kiez_note TEXT DEFAULT '';
ALTER TABLE listings ADD COLUMN cat_note TEXT DEFAULT '';
