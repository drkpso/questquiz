# QuestQuiz — production image for Railway (and any Docker host).
# Builds public/, then serves with the zero-dependency Node server + JSON DB API.

FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY scripts ./scripts
COPY src ./src
COPY deploy ./deploy
RUN node scripts/build.js

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
# Railway injects PORT; 8080 is a local fallback.
ENV PORT=8080
# Persist accounts across redeploys: mount a Railway Volume at /data and set DATA_DIR=/data
ENV DATA_DIR=/data
COPY --from=build /app/public ./public
COPY scripts/serve.js ./scripts/serve.js
COPY scripts/email.js ./scripts/email.js
COPY scripts/db.js ./scripts/db.js
COPY scripts/api.js ./scripts/api.js
COPY scripts/security.js ./scripts/security.js
# Production start skips rebuild (public/ already in the image).
# Required for live email verification: RESEND_API_KEY (+ EMAIL_FROM).
# Optional admin bootstrap: ADMIN_EMAIL + ADMIN_PASSWORD.
ENV SKIP_BUILD=1
EXPOSE 8080
CMD ["node", "scripts/serve.js"]
