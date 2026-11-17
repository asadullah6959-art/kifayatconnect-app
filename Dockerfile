FROM node:26-alpine AS build
RUN apk upgrade --no-cache
WORKDIR /app
COPY package*.json .npmrc ./
RUN npm install
COPY . .
# The build needs dev dependencies; they are removed before the copy below.
RUN npm run build && npm prune --omit=dev
# The build stage copies the whole repo; drop the native Android shell, signing
# material and git metadata so they are not inherited by the runtime image below.
RUN rm -rf /app/android /app/ios /app/.git /app/.github /app/*.jks /app/*.keystore
FROM node:26-alpine
# The date keys the build cache so this layer installs today's OS fixes; AppJet keeps it current on deploy.
RUN echo "os-refresh 2026-11-17" && apk upgrade --no-cache
WORKDIR /app
COPY --from=build /app ./
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
# IMPORTANT: your server MUST listen on 0.0.0.0 and process.env.PORT.
RUN mkdir -p /app /home/appjet && chown -R 10001:10001 /app /home/appjet
ENV HOME=/home/appjet
USER 10001:10001
CMD ["npm","start"]
