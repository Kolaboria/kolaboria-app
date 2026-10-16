# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Copy `apps/client/.env.example` to `apps/client/.env` and set `NUXT_PUBLIC_API_BASE_URL` for the target backend:

| Environment | `NUXT_PUBLIC_API_BASE_URL` |
| --- | --- |
| Local (default) | `http://localhost:8081/v1` |
| Deployed development | `https://api.dev.kolaboria.com/v1/` |

The value includes the API version prefix; a trailing slash is optional. `useApi` and `useApiFetch` share this runtime configuration, including token refresh. Keep entries in `apps/client/app/constants/api-endpoints.ts` relative to the base URL (for example, `/auth/login`). Set the same environment variable on the deployment when running the built server. Existing `.env` files override the default and must also use `/v1`.

See [API base URL migration](docs/api-base-url.md) for deployment and verification notes.

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
