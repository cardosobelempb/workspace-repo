#!/bin/bash
# setup-server.sh - roda UMA VEZ antes do primeiro deploy

set -e

echo "══════════════════════════════════════════"
echo " Setup do servidor SURB (Traefik externo)"
echo "══════════════════════════════════════════"

# ── Swarm ─────────────────────────────────────────────────────
if ! docker info | grep -q "Swarm: active"; then
  echo "Iniciando Docker Swarm..."
  docker swarm init
else
  echo "Swarm ja ativo."
fi

# ── Rede overlay compartilhada com o Traefik ──────────────────
if ! docker network ls | grep -q "network_public"; then
  echo "Criando rede overlay network_public..."
  docker network create --driver overlay --attachable network_public
else
  echo "Rede network_public ja existe."
fi

# ── Volumes externos ──────────────────────────────────────────
for VOL in surb_postgres_data surb_redis_data; do
  if ! docker volume ls | grep -q "^local.*$VOL$"; then
    echo "Criando volume: $VOL"
    docker volume create "$VOL"
  else
    echo "Volume $VOL ja existe."
  fi
done

echo ""
echo "Pronto! Configure .env.production e rode docker/deploy.sh."
echo "══════════════════════════════════════════"
