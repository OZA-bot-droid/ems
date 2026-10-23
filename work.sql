SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

select * from member;
select * from refresh_token;
drop table member;
delete from refresh_token;





SELECT current_database(), current_schema();
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;


SELECT current_database(), current_schema();
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
order by table_name;
SELECT installed_rank, version, description, type, success
FROM public.flyway_schema_history
ORDER BY installed_rank;


SELECT current_database(), current_user;
drop table if exists public.member;
drop table if exists public.flyway_schema_history;


DROP SCHEMA public CASCADE;
CREATE SCHEMA public;