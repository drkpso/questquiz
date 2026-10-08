# GitHub → Railway go-live checklist

Domain: **www.learnassessment.com**

## GitHub

- [ ] Code in a GitHub repo you control (create repo / push this branch)
- [ ] Default branch builds cleanly (`Dockerfile` present, `npm run build` works locally)

## Railway

- [ ] Railway account created
- [ ] GitHub authorized; project created from this repo
- [ ] Deploy succeeds (healthcheck `/` green)
- [ ] Railway-provided domain generated (`*.up.railway.app`) and smoke-tested

## Custom domain

- [ ] Custom domain `www.learnassessment.com` added on the Railway service
- [ ] Namecheap **CNAME** for `www` → Railway target
- [ ] Namecheap **TXT** verification record (exact host/value from Railway)
- [ ] Apex handled: URL Redirect `@` → `https://www.learnassessment.com` (or ALIAS + second Railway domain)
- [ ] Old Namecheap A / parking / cPanel records for `@` and `www` removed
- [ ] Railway shows domain verified; HTTPS works without certificate warnings

## Smoke test

- [ ] Landing + **Try 3 questions**
- [ ] Sign-in `kabir@example.com` / `student123`
- [ ] Theme toggle; mobile layout; styled 404
