# Deploy

Fuochista is a plain Docker image (see `Dockerfile`) deployed as the Dokku app `fuochista` on the household VPS (ADR 0002). Self-hosters use `docker-compose.yml` with the same environment variables.

## Environment

| Variable | Required | Meaning |
|---|---|---|
| `SESSION_SECRET` | yes | Signs the session cookie, at least 32 characters. |
| `SECURE_COOKIES` | no | `true` by default; `false` only for plain-HTTP local use. |
| `DATABASE_PATH` | no | The SQLite file. The image defaults to `/data/fuochista.db`. |
| `PORT` | no | The image listens on 5000. |

## First deploy on Dokku (once)

On the VPS:

```sh
dokku apps:create fuochista            # already done in the VPS prep
dokku domains:set fuochista fuochista.lazzaroni.io
dokku storage:ensure-directory fuochista
dokku storage:mount fuochista /var/lib/dokku/data/storage/fuochista:/data
dokku config:set --no-restart fuochista SESSION_SECRET="$(openssl rand -base64 48)"
dokku ports:set fuochista http:80:5000 https:443:5000
```

From the dev machine:

```sh
git remote add dokku dokku@<vps>:fuochista
git push dokku <branch>:main
```

Then create the household accounts on the VPS:

```sh
echo 'the-password' | dokku run fuochista node src/cli/create-user.ts <username>
```

The SQLite file lives in `/var/lib/dokku/data/storage/fuochista` on the host, so it survives redeploys. TLS comes from the letsencrypt plugin: it was enabled during the VPS prep; on a fresh app run `dokku letsencrypt:enable fuochista` after the first deploy.
