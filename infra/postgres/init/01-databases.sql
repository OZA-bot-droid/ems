-- Local bootstrap only. This file is executed once when the Postgres volume is empty.
CREATE ROLE member_app LOGIN PASSWORD 'localdev';
CREATE ROLE event_app LOGIN PASSWORD 'localdev';
CREATE ROLE interaction_app LOGIN PASSWORD 'localdev';
CREATE DATABASE member_db OWNER member_app ENCODING 'UTF8';
CREATE DATABASE event_db OWNER event_app ENCODING 'UTF8';
CREATE DATABASE interaction_db OWNER interaction_app ENCODING 'UTF8';
