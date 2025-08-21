# NERDS: A Non-Invasive Environment For Remote Developer Studies

**A bunch of doc around [here](doc/tech.md)**
-----

**Something to add on for starting**
## Potential Issue in installaton:

```bash
------
Dockerfile:4
--------------------
   2 |     ARG uid=1000
   3 |     
   4 | >>> RUN useradd user -u $uid -Um --shell=/usr/bin/nologin
   5 |     
   6 |     USER user
--------------------
ERROR: failed to build: failed to solve: process "/bin/sh -c useradd user -u $uid -Um --shell=/usr/bin/nologin" did not complete successfully: exit code: 4
Finished building task generator
Unable to find image 'devob-generator:latest' locally
docker: Error response from daemon: pull access denied for devob-generator, repository does not exist or may require 'docker login': denied: requested access to the resource is denied

```

**Do the following to make sure it does not run on sudo** 
```bash
# add your user to it
sudo groupadd docker 2>/dev/null || true
sudo usermod -aG docker $USER
# start a NEW login session so the group applies:
exec su -l $USER
# or log out/in
id   # verify `docker` now listed

# refresh your group membership
newgrp docker

# finally do 
./dev-ob.sh generate

```


**Use self-signed certs (quick + easy for local testing)**

```bash
sudo mkdir -p /etc/cert
cd /etc/cert

# Generate key + cert valid for 1 year
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout developer-study.key \
  -out developer-study.crt

```

**Then you can start**

```bash
./dev-ob.sh run
```

**To open a session**
URL: https://localhost/index.php?ext_ref=yunze


## View output

```bash
# get a new termial, get to the repo 
# check out some services avaliable
yunze@yunze-ROG-Strix:~/Documents/GitHub/nerds-sbom$ docker compose config --services
WARN[0000] /home/yunze/Documents/GitHub/nerds-sbom/docker-compose.yml: the attribute `version` is obsolete, it will be ignored, please remove it to avoid potential confusion 
db
redis
stats
control
landing-server
submit
nginx

# compose up db and query
docker compose exec db psql -U created_instances_user -d notebook -c \
'SELECT id, userid, ip, category, condition, instanceid, finished, heartbeat, "instanceTerminated" FROM "createdInstances" ORDER BY id DESC LIMIT 20;'

```

## Export output
```bash

./dev-ob.sh export-db ~/your-path


```
