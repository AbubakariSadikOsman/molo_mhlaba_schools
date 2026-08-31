-- Molo Mhlaba Behaviour Tracker — 0003
-- Adds a logo per campus, shown in the header, campus switcher, and home cards.

alter table campuses add column if not exists logo_url text;

update campuses set logo_url = '/logos/tennyson.png' where id = 'TEN';
update campuses set logo_url = '/logos/masibambane.png' where id = 'MAS';
update campuses set logo_url = '/logos/ncumo.png' where id = 'NCU';
