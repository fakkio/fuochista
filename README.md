# Fuochista

An unofficial, self-hosted app to control and automate a pellet boiler stove on the **Micronova Agua IOT** cloud, beyond what the vendor's official app offers: multi-step weekly programs (power, fan including off, water temperature), and later history, pellet tracking, weather compensation and more.

> **Disclaimer.** Fuochista is not affiliated with, endorsed by or connected to Klover, Micronova or any stove manufacturer. It uses an unofficial, reverse-engineered cloud API that can change or stop working at any time. It sends real commands to a device that burns fuel: it comes with **no warranty**, and you use it **at your own risk**.

## Status

Early development. The feasibility spike (M0) is done: reading every parameter, writing setpoints and switching the fan off all work through the cloud. See [docs/platform.md](docs/platform.md) and the [roadmap](docs/roadmap.md).

## Prerequisites

- A stove already registered on the Micronova cloud through its brand's official app: account created, Wi-Fi module set up, product added. Fuochista does not do the first setup.
- The account's email and password, given to Fuochista through environment variables or a `.env` file, never committed.

## Running

Requires Node 26.

```sh
npm install
cp .env.example .env          # set SESSION_SECRET; SECURE_COOKIES=false for plain-HTTP local use
echo 'a-password' | npm run create-user -- anna
npm start                     # http://localhost:3000
```

There is no sign-up: every account is created with `create-user`. `npm test` runs the typecheck, the unit tests and the Playwright end-to-end tests (run `npx playwright install chromium` once first).

Self-hosting with Docker: fill `.env` (keep `SECURE_COOKIES=true` behind HTTPS, `false` on plain HTTP), then `docker compose up -d` and `docker compose exec fuochista node src/cli/create-user.ts anna`. Data lives in the `fuochista-data` volume. The household deploy uses Dokku, see [docs/deploy.md](docs/deploy.md).

## Docs

- [Context](docs/context.md): the problem, the house and the decisions so far.
- [Roadmap](docs/roadmap.md): milestones and scope.
- [Platform](docs/platform.md): what the cloud API allows.
- [Glossary](GLOSSARY.md): domain terms.

## License

[MIT](LICENSE).
