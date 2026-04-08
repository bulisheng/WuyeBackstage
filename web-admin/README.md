# Web Admin

Standalone Vite + React admin console.

## Start locally

```bash
cd web-admin
npm install
npm run dev
```

Open:

```text
http://127.0.0.1:5173
```

If you open the console from a phone or another device on the same LAN, use your computer's visible IP instead, for example:

```text
http://192.168.5.4:5173
```

## API connection

The app talks to the backend through:

```text
/api/v1
```

The Vite dev server proxies `/api` to `http://127.0.0.1:8080`.

That means the phone only needs to reach the dev server on your computer:

```text
http://192.168.5.4:5173
```

The browser requests are then proxied to the backend running on the same machine.

## Docker / Nginx

If you use `docker compose up --build`, the container maps the Web console to port `3000` on your computer. From a phone on the same LAN, open:

```text
http://192.168.5.4:3000
```

In that case, the Vite dev server still runs on your computer and proxies requests to the backend on the same machine.

## Login

1. Enter the API base
2. Enter the admin key
3. The app calls `POST /api/v1/admin/auth/login`
4. Save the returned token and continue with `Authorization: Bearer <token>`

## Production / Nginx

Build the app:

```bash
cd web-admin
npm install
npm run build
```

For Docker deployment, the included `Dockerfile` serves the build with Nginx and proxies `/api/` to the backend container.
