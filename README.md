# Welcome to your Lovable project

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Open your project in the [Lovable editor](https://lovable.dev) and keep building.

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: connect the project to GitHub and every change made in Lovable is committed straight to your repository.
- **Full ownership**: this code is yours. Push to your repository and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

Development and preview servers listen on port `3001`.

## Deploy to a Node.js VPS

The default `npm run build` target is Cloudflare. For the VPS deployment, use the
Node.js server target instead:

```sh
npm ci
npm run build:node
npm start
```

The production server listens on `0.0.0.0:3001` by default. Set `NITRO_HOST` or
`NITRO_PORT` in the process environment only if you intentionally need to
override those defaults.

Provide environment variables through the server's process manager or a
server-only `.env` file. Do not commit `.env`:

- `TRACKING_DATABASE_URL` is required for public tracking and must use a
  dedicated read-only account with access to the internal packages database
  (currently `JASTIPNEW`).
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `SESSION_SECRET` are required for admin
  login. Use a unique password of at least 10 characters and a random
  `SESSION_SECRET` of at least 32 characters (for example, generate one with
  `openssl rand -base64 48`).
- `DATABASE_URL` is optional and is only for the separate website CMS database
  (`COMPANYPROFILE`). If omitted, CMS content is stored in `data/cms-data.json`;
  keep that directory writable, persistent, and backed up.

Never set `DATABASE_URL` to the internal package database. Ensure the VPS can
reach `TRACKING_DATABASE_URL` over a private network or SSH tunnel; do not expose
the database port publicly.

## Built with

- React for the website UI
- Express.js as the Node.js VPS server
- PostgreSQL (`pg`) for package tracking data
- TanStack Start
- TypeScript
- Tailwind CSS
