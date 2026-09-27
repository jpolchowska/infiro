-- infrastructure/postgres-init/01-keycloak-db.sql
--
-- Wykonuje się TYLKO przy pierwszej inicjalizacji Postgresa
-- (gdy wolumen postgres_data jest pusty).
--
-- Jeśli masz już dane w wolumenie, ten skrypt się NIE wykona.
-- Wtedy albo: docker compose down -v (kasuje WSZYSTKIE dane),
-- albo wykonaj to ręcznie przez docker compose exec postgres psql.

CREATE USER keycloak WITH PASSWORD 'silne_losowe_haslo_2';
CREATE DATABASE keycloak OWNER keycloak;
GRANT ALL PRIVILEGES ON DATABASE keycloak TO keycloak;
