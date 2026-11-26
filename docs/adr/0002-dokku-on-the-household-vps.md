# Deploy with Dokku on the household VPS, keep docker compose for self-hosters

On the household's VPS, Fuochista is deployed as a Dokku app (`git push`, TLS from Dokku's letsencrypt plugin, domain `fuochista.lazzaroni.io`), not with `docker compose` behind a hand-managed nginx. Dokku was already installed and owns nginx on 80/443 for another app, so a second, hand-written nginx setup would fight it over the same ports and config. The image stays a plain Docker image, and the repo still ships a `docker-compose.yml` for people who self-host without Dokku.

## Consequences

- Two deploy paths to keep working: Dokku (ours) and docker compose (everyone else). The image and the `.env` variables must be the same for both.
- Deploys need the deployer's SSH key registered with `dokku ssh-keys:add`.
- Until M1 deploys the real service, the `fuochista` app runs a placeholder image (`nginxdemos/hello`).
