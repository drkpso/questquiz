# Namecheap go-live checklist

Copy into your cutover notes. Tick when done.

## Before upload

- [ ] Node 18+ available locally (or use the committed zip from `deploy/namecheap/`)
- [ ] `npm run pack:namecheap` succeeded
- [ ] Zip or `upload/` folder contains `index.html`, `assets/`, `404.html`, `.htaccess`

## Namecheap account

- [ ] Domain `learnassessment.com` visible in Domain List
- [ ] Shared hosting (Stellar or similar) active and linked
- [ ] cPanel or FTP credentials in hand

## DNS

- [ ] A record `@` → shared hosting IP
- [ ] CNAME `www` → `learnassessment.com.`
- [ ] Old parking / redirect records removed
- [ ] Propagation checked (`dig learnassessment.com A`, `dig www.learnassessment.com CNAME`)

## Files

- [ ] Contents of package in `public_html` (not a nested `questquiz/` folder)
- [ ] Hidden `.htaccess` visible and present
- [ ] `assets/*.js` and `assets/styles.css` load (browser Network tab)

## SSL

- [ ] AutoSSL / Let’s Encrypt issued for apex and `www`
- [ ] `https://www.learnassessment.com` loads without certificate warnings
- [ ] HTTP redirects to HTTPS; apex redirects to `www`

## Smoke test

- [ ] Landing page + **Try 3 questions**
- [ ] Student sign-in (`kabir@example.com` / `student123`)
- [ ] Theme toggle
- [ ] Phone-width layout
- [ ] Unknown path → styled 404
