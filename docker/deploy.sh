#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
ENV_FILE="${ENV_FILE:-${ROOT_DIR}/.env.production}"
STACK_FILE="${STACK_FILE:-${SCRIPT_DIR}/stack.yml}"

SERVER_USER="${SERVER_USER:-ubuntu}"
SERVER_HOST="${SERVER_HOST:-}"
SERVER_KEY="${SERVER_KEY:-}"
STACK_NAME="${STACK_NAME:-surb}"
REGISTRY="${REGISTRY:-local}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
TAR_FILE="${TAR_FILE:-/tmp/surb-images-${IMAGE_TAG}.tar}"
REMOTE_DIR="${REMOTE_DIR:-/tmp/surb-deploy}"

require_command() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Erro: comando obrigatorio nao encontrado: $1" >&2
    exit 1
  }
}

load_env_file() {
  if [ ! -f "$ENV_FILE" ]; then
    echo "Erro: arquivo de ambiente nao encontrado: $ENV_FILE" >&2
    exit 1
  fi

  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a

  STACK_NAME="${STACK_NAME:-surb}"
  REGISTRY="${REGISTRY:-local}"
  IMAGE_TAG="${IMAGE_TAG:-latest}"
}

validate_config() {
  if [ -z "$SERVER_HOST" ]; then
    echo "Erro: informe SERVER_HOST. Exemplo: SERVER_HOST=1.2.3.4 ./deploy.sh" >&2
    exit 1
  fi

  if [ -n "$SERVER_KEY" ] && [ ! -f "${SERVER_KEY/#\~/$HOME}" ]; then
    echo "Erro: chave SSH nao encontrada: $SERVER_KEY" >&2
    exit 1
  fi

  if grep -q "CHANGE_ME" "$ENV_FILE"; then
    echo "Erro: troque os valores CHANGE_ME em $ENV_FILE antes do deploy." >&2
    exit 1
  fi
}

ssh_cmd() {
  if [ -n "$SERVER_KEY" ]; then
    ssh -i "${SERVER_KEY/#\~/$HOME}" "$@"
  else
    ssh "$@"
  fi
}

scp_cmd() {
  if [ -n "$SERVER_KEY" ]; then
    scp -i "${SERVER_KEY/#\~/$HOME}" "$@"
  else
    scp "$@"
  fi
}

build_images() {
  echo "Build das imagens Docker..."
  docker build -f apps/frontend/Dockerfile --target production -t "${REGISTRY}/surb-frontend:${IMAGE_TAG}" "$ROOT_DIR"
  docker build -f apps/backend/Dockerfile --target production -t "${REGISTRY}/surb-backend:${IMAGE_TAG}" "$ROOT_DIR"
  docker build -f apps/auth-service/Dockerfile --target production -t "${REGISTRY}/surb-auth-service:${IMAGE_TAG}" "$ROOT_DIR"
}

export_images() {
  echo "Exportando imagens em $TAR_FILE..."
  docker save \
    "${REGISTRY}/surb-frontend:${IMAGE_TAG}" \
    "${REGISTRY}/surb-backend:${IMAGE_TAG}" \
    "${REGISTRY}/surb-auth-service:${IMAGE_TAG}" \
    -o "$TAR_FILE"
}

deploy_remote() {
  local remote="${SERVER_USER}@${SERVER_HOST}"

  echo "Enviando artefatos para ${remote}:${REMOTE_DIR}..."
  ssh_cmd "$remote" "mkdir -p '$REMOTE_DIR'"
  scp_cmd "$TAR_FILE" "$STACK_FILE" "$ENV_FILE" "${remote}:${REMOTE_DIR}/"

  echo "Carregando imagens e aplicando stack..."
  ssh_cmd "$remote" \
    "set -eu
     cd '$REMOTE_DIR'
     docker load -i '$(basename "$TAR_FILE")'
     set -a
     . '$(basename "$ENV_FILE")'
     set +a
     docker stack deploy -c '$(basename "$STACK_FILE")' --with-registry-auth --detach=false '$STACK_NAME'
     docker stack services '$STACK_NAME'"
}

cleanup_local() {
  rm -f "$TAR_FILE"
}

main() {
  require_command docker
  require_command ssh
  require_command scp
  load_env_file
  validate_config

  echo "Deploy ${STACK_NAME} (${IMAGE_TAG}) para ${SERVER_USER}@${SERVER_HOST}"
  build_images
  export_images
  deploy_remote
  cleanup_local
  echo "Deploy concluido: ${APP_URL:-https://${DOMAIN:-surb.com.br}}"
}

main "$@"
