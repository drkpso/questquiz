# Deploy this archive (Mac / any machine with Railway + GitHub)

This tree is Railway-ready: `Dockerfile`, `railway.toml`, `src/`, `scripts/`,
`package.json`, and a prebuilt `public/` (you can still `npm run build`).

## Fast path — Railway CLI

```bash
tar -xzf questquiz-railway-ready.tar.gz
cd questquiz-railway-ready
npm i -g @railway/cli
railway login
railway init          # create project
railway up            # deploy
railway domain        # generate *.up.railway.app
```

## GitHub path

```bash
tar -xzf questquiz-railway-ready.tar.gz
cd questquiz-railway-ready
git init && git add -A && git commit -m "QuestQuiz Railway"
# create empty GitHub repo, then:
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

Then Railway → New Project → Deploy from GitHub repo → Generate Domain.

## Custom domain

Add `www.learnassessment.com` in Railway; set Namecheap CNAME + TXT from the
dashboard. Apex: URL Redirect `@` → `https://www.learnassessment.com`.

Full steps: `docs/RAILWAY.md`
