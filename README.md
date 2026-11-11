# Still — Photography portfolio + headless CMS

**Status:** Local runnable MVP. Public deployment requires your Vercel and AWS accounts; no production URL is created by downloading these files.

## Stack
Next.js (React/TypeScript) on Vercel Hobby; Dockerized Node.js/NestJS API gateway + Content/Media module on low-cost EC2; PostgreSQL/Prisma. Modules and contracts are designed so Media can become an independent service. Later: S3 presigned uploads + CloudFront OAC, SQS worker, Rekognition/vision model, Terraform, CI/CD. No cloud prerequisites for local run.

## Ubuntu setup
Install Node.js 22+ and Docker Engine with Docker Compose plugin. From the repository root:

```bash
node scripts/init-env.mjs
# Enter a password with 12+ characters; the script writes a random secret .env
docker compose up --build -d
docker compose ps
```

Open http://localhost:3000, then http://localhost:3000/admin/login. The admin is password protected. Build a story, save as draft, upload photos (JPEG/PNG/WebP/AVIF, up to 5 MB), edit alt text and captions, set Published, and check the public page. Images are stored in a persistent Docker volume and metadata in PostgreSQL.

### Test
```bash
npm test
TEST_ADMIN_PASSWORD='the-password-you-chose' npm run test:e2e
```

E2E covers login, create draft, private draft, publish, update, delete and public visibility. Run against your own local server only. Database-backed E2E requires Docker to be running. For logs use `docker compose logs -f web gateway content`. To stop: `docker compose down` (keeps volumes). **Do not run `docker compose down -v` unless you intentionally want to erase posts and images.**

### Production deployment checklist (not yet deployed)
1. Create an HTTPS domain and AWS EC2 instance with Docker and off-host PostgreSQL/image backups, monitoring and update policies. Allow only the reverse proxy ports 80/443; keep gateway, content and PostgreSQL private. Configure Caddy/Nginx TLS for gateway API access used by Vercel functions.
2. Vercel: import `apps/web` as the root directory, set `GATEWAY_URL=https://api.yourdomain.example`, `INTERNAL_API_KEY`, `ADMIN_PASSWORD_SCRYPT`, `SESSION_SECRET`, `NEXT_PUBLIC_SITE_URL=https://yourdomain.example`. Do not expose secrets as `NEXT_PUBLIC_*`.
3. For EC2, run **only** postgres, content and gateway; customize Compose to expose gateway via HTTPS reverse proxy, do not publish raw ports. Use a dedicated backend compose override; the default Compose binds web to localhost only. Set strong secrets in an EC2 `.env` with `NEXT_PUBLIC_SITE_URL` matching the real domain.
4. Validate admin login, draft visibility, photo upload and publication, public photo display, logs, and backup recovery. Stage protected Vercel deployment and verify before public promotion.
5. For scalable image storage, replace the current local `MediaService` storage adapter with S3, use CloudFront OAC for optimized public images, then add SQS processing and AI worker. Do not put original images publicly in S3.

### Security notes
The backend gateway allows anonymous **published** posts only. Write routes require an internal secret passed by server-side Next.js handlers after verifying the signed admin cookie. Postgres and media volumes aren't exposed publicly. This is a single-admin MVP: add login rate limits, credential rotation, detailed audit logging, object-storage persistence, CSRF hardening, backups and deployment monitoring before Internet release. Directly connecting Vercel to a public gateway requires HTTPS and perimeter controls.

### Budget
€30/month is an **aspirational** low-traffic total, not a guarantee, especially with VAT, IPv4 fees, storage/backups and minimum EC2 capacity. Target Vercel Hobby for eligible non-commercial personal usage; one EC2 host and modest AWS request volume. Check Frankfurt AWS estimates and configure billing alerts before provisioning.

### Deliberately deferred
A rich-text toolbar (currently plaintext post editor), true Swiper carousel (currently accessible previous/next gallery), social/contact form, Google consent-mode analytics, SES email, full microservice extraction, S3/CDN, AI and SQS. These are not represented as already complete.
