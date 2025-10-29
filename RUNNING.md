# NERDS SBOM Environment – Running Guide

This guide shows how to clean-reset, start, and access the environment (including Dependency-Track), plus tips for SSH/VS Code port forwarding.

## Prerequisites
- Docker + Docker Compose plugin
- Your user in the `docker` group (no sudo)
- TLS certs installed on the host (already set here):
  - `/etc/cert/developer-study.crt`
  - `/etc/cert/developer-study.key`
- Repo root: `/home/yunze/sbom-med/nerds-sbom`

## Clean reset (safe, project-scoped)
This removes project containers, networks, and volumes, then recreates everything fresh.

```bash
cd /home/yunze/sbom-med/nerds-sbom

# Stop the stack (ignore errors)
./dev-ob.sh down || true

# Remove all containers (frees networks), then remove project nets/volumes
# WARNING: also removes non-project containers; use with care in multi-project hosts
docker ps -aq | xargs -r docker rm -f

docker network rm devob_instances devob_main 2>/dev/null || true

docker volume rm aicodegen-data dt-postgres-data 2>/dev/null || true
```

## Configure, build, start
```bash
# Generate config + copy SQL/tasks/etc.
./dev-ob.sh configure

# Build images
./dev-ob.sh compose build

# Start everything detached
./dev-ob.sh compose up -d

# start manager
./dev-ob.sh manager

# Update tasks:
--- 
## Regenerate tasks after editing `tasks.json`
When you update the root `tasks.json`, regenerate the task artifacts and update the running stack:

```bash
cd /home/yunze/sbom-med/nerds-sbom

# 1) Copy or edit the tasks in generator (already mirrored here)
#    Ensure generator/tasks.json matches the root tasks.json and removed the old tasks
rm -rf generator/generated
# 2) Generate task files (TASK_*.json + dbSchema.sql into generator/generated/)
./dev-ob.sh generate

# after the above step, you can just follow the Configure, build, start above, unless you want to check below

# 3) Copy the newly generated artifacts into service configs
./dev-ob.sh configure

# 4) Rebuild the submit service to include the new tasks directory
./dev-ob.sh recreate submit

# 5) Refresh the DB conditions table from the new taskSchema.sql
docker compose -p devob exec -T db psql -U postgres -d notebook -c 'TRUNCATE "conditions";'
docker compose -p devob exec -T db psql -U postgres -d notebook -f - < containers/postgres/taskSchema.sql

# 6) (Optional) Restart stack
./dev-ob.sh compose up -d

# 7) Verify
docker compose -p devob exec -T db psql -U postgres -d notebook -c 'SELECT COUNT(*) FROM "conditions";'
```
--- 

This ensures the submit container ships the updated tasks, and the database condition list stays in sync with the generated TASK_*.json files.

```bash
./dev-ob.sh manager
```

## Verify services
```bash
docker compose -p devob ps

docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'

# Quick HTTPS checks (on the server)
curl -kI https://localhost/
curl -kI https://localhost/index.php
curl -kI https://localhost/dt/
```

- You should see:
  - `devob-nginx-1` with `0.0.0.0:443->443/tcp`
  - `devob-db-1` (Postgres 17 – pinned)
  - `devob-landing-server-1`, `devob-submit-1`, `devob-redis-1`, `devob-stats-1`
  - `dt-apiserver` (healthy) and `dt-frontend` (healthy)

## Access from your workstation
- Direct (no forwarding): `https://<server-ip>/`, `https://<server-ip>/dt/`
- With SSH/VS Code port forwarding:
  - The landing page redirects to `https://localhost/…`. Your browser must hit local 443.
  - Best: forward remote 443 → local 443 (requires sudo locally):
    ```bash
    sudo ssh -N -L 443:127.0.0.1:443 <user>@<server-ip>
    ```
  - Or keep a random local port (e.g., 44443) and bridge it to 443 locally:
    ```bash
    # Suppose VS Code forwarded remote 443 → local 44443
    sudo socat TCP-LISTEN:443,reuseaddr,fork TCP:127.0.0.1:44443
    ```
  - Then browse `https://localhost/` and `https://localhost/dt/`.
  - A session url can look like `https://localhost:62731/index.php?ext_ref=yunze`, where 62731 is your forwarded address in your local machine.


## Dependency-Track
- UI: `https://<server-ip>/dt/`
- API: `https://<server-ip>/dt/api/`
- Nginx logs for API: `containers/dependency-track/dtrack-data/nginx-logs/dt-api-access.log`

## Postgres (NERDS DB) – pinned to 17
We pin the NERDS DB to Postgres 17 to avoid a Postgres 18+ volume layout change which crashes the `db` container when mounting at `/var/lib/postgresql/data`.
- If you ever hit DB init issues, see `POSTGRES-DB-RESET.md`.
- If you get auth errors after a reset, reapply the user passwords (documented there).

## Manager process
The manager is a long‑lived process. Run it in a separate terminal (tab/window) after the stack is up. If it’s already running, do NOT start another instance.

Run in a second terminal:
```bash
cd /home/yunze/sbom-med/nerds-sbom
./dev-ob.sh manager
```
This maintains the pool of study instances.

Tips
- To run other commands, open another terminal; the manager blocks the current shell.
- Check queued instances (Redis):
  ```bash
  docker compose -p devob exec -T redis redis-cli LRANGE queuedInstances 0 -1
  docker compose -p devob exec -T redis redis-cli GET queuedInstancesBooting
  ```
- See running study instance containers:
  ```bash
  docker ps --filter "ancestor=devob_instance" --format 'table {{.ID}}\t{{.Names}}\t{{.Status}}'
  ```
- Stop the manager: Ctrl+C in its terminal.
- Optional background run:
  ```bash
  nohup ./dev-ob.sh manager > manager.log 2>&1 &
  tail -f manager.log
  ```

## Troubleshooting quick reference
- Nginx (443) not responding:
  - `docker compose -p devob ps` (is `nginx` up?)
  - Port conflict on DT frontend (8081 in use) can block nginx startup; stop other DT stacks.
- Landing page redirects break port forwarding:
  - Use local 443 as described above.
- `could not translate host name "db"` from PHP:
  - Check `db` is running and attached to `devob_main`
  - If `db` exited with Postgres 18+ error, follow `POSTGRES-DB-RESET.md`.
- View logs:
  - `docker compose -p devob logs --tail=100 nginx landing-server submit db dt-apiserver dt-frontend`

## Notes
- TLS certs/keys are mounted as Docker secrets for Nginx.
- DT is reverse-proxied under `/dt/`; API under `/dt/api/`.
- The `configure` step copies generated tasks into the submit service.
