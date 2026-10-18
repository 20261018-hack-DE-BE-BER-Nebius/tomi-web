FROM tomireg2610181730.azurecr.io/tomi-web@sha256:b1017427ede8a22997de8868595f32bfe43e404047ac5921969783dccc22f168
WORKDIR /app
COPY --chown=bun:bun matching-summary.json /app/public/archive/assets/matching-summary.json
RUN bun audit
