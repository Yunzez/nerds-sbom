# NERDS DB: Postgres 18+ volume issue and fix

When using `postgres:latest` (now 18+), the container exits with an error similar to:

```
Error: in 18+, these Docker images are configured to store database data in a
format which is compatible with "pg_ctlcluster" ...
Counter to that, there appears to be PostgreSQL data in:
  /var/lib/postgresql/data (unused mount/volume)
```

This is a breaking change in Postgres Docker 18+. Our compose mounts the DB volume at `/var/lib/postgresql/data`, which works with Postgres 17 but triggers the error on 18+.

## Recommended fix (pin to Postgres 17)

1) Pin the DB image to 17:
   - `config/Postgres.docker`: `FROM postgres:17-alpine`
   - `containers/postgres/Dockerfile`: `FROM postgres:17-alpine`

2) Reset the DB volume and recreate the db service:

```bash
# From repo root
./dev-ob.sh down
# WARNING: this wipes the NERDS DB volume
docker volume rm aicodegen-data

# Reconfigure (copies Dockerfile and SQL into place)
./dev-ob.sh configure

# Build and start just the DB (or the whole stack)
./dev-ob.sh compose up -d db
# or
./dev-ob.sh compose up -d
```

3) Verify it’s healthy:

```bash
docker compose -p devob ps
docker compose -p devob logs --tail=100 db
```

## Alternative (stay on Postgres 18+)
Change the compose volume mount:

```yaml
# in docker-compose.yml for the db service
volumes:
  - "data:/var/lib/postgresql"
```

Then reset the volume and recreate the db service as above. Postgres 18+ will then store data in a versioned subdirectory.

## Password alignment (if auth fails)
If the landing page shows invalid password errors after the reset, reapply the user passwords:

```bash
# Find the passwords in config/.secrets or containers/postgres/dbSchema.sql

# Then inside the DB container:
docker compose -p devob exec db psql -U postgres -d postgres

-- In psql:
ALTER ROLE insert_user            WITH PASSWORD 'PW_FOR_insert_user';
ALTER ROLE created_instances_user WITH PASSWORD 'PW_FOR_created_instances_user';
```

## Why this happens
Postgres 18+ Docker images switched to a directory scheme compatible with `pg_ctlcluster`. Mounting at `/var/lib/postgresql/data` can cause the image to detect a conflicting layout and exit. Pinning to 17 avoids the change; otherwise, mount `/var/lib/postgresql` instead.
