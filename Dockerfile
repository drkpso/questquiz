# QuestQuiz — production image for Railway (and any Docker host).
# Static site: build public/, then serve with the zero-dependency Node server.
# Playwright stays out of this image (devDependency only).

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
COPY --from=build /app/public ./public
COPY scripts/serve.js ./scripts/serve.js
# Production start skips rebuild (public/ already in the image).
ENV SKIP_BUILD=1
EXPOSE 8080
CMD ["node", "scripts/serve.js"]
