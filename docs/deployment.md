# Deployment

## Platform

- Provider: Vercel
- Project: `ethan-noibo`
- Production URL: <https://noibo.ethanecom.com>

## Deploy

Run from the repository root:

```bash
npx vercel --prod --yes
```

Vercel detects the Next.js application and runs `npm run build`.

## Environment variables

Production requires the variables documented in `.env.example`:

- `SESSION_SECRET`
- `DATABASE_URL`
- `BLOB_READ_WRITE_TOKEN`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

Values are managed in Vercel and must not be committed to Git.

## Verification

Check the protected report route after deployment:

```bash
npx vercel curl https://noibo.ethanecom.com/dashboard/bao-cao -- --head
```

An unauthenticated request should redirect to `/login` with the report path in
the `from` query parameter.

## Rollback

Use the deployment URL shown by Vercel:

```bash
npx vercel rollback <deployment-url>
```
