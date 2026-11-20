#!/usr/bin/env bash
# =============================================================================
# PORTFOLIO - DESPLIEGUE DE PRODUCCIÓN EN ORACLE CLOUD (OCI / ARM64)
# =============================================================================
# Objetivo:
#   Sincronizar únicamente los archivos necesarios para construir y levantar
#   el contenedor estático del portfolio en OCI, compilar la imagen Docker en
#   la VM ARM64 y comprobar que agustinperez.dev.ar responde correctamente.
#
# Modos de uso:
#   Sin argumentos  -> Deploy desde una PC hacia OCI.
#   --ci            -> Deploy desde GitHub Actions.
#   --restart       -> Recrea el contenedor en OCI SIN recompilar la imagen.
#   --check         -> Solo valida los archivos y Docker Compose localmente.
#   --test          -> Solo ejecuta el smoke test contra PUBLIC_URL.
#   --help          -> Muestra la ayuda.
# =============================================================================

set -Eeuo pipefail
umask 077

cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."

PHASE="inicio"
COMPOSE_FILE="deploy/compose.yaml"
COMPOSE_PROJECT="${COMPOSE_PROJECT:-portfolio}"

OCI_HOST="${OCI_HOST:-ganker-oci}"
OCI_USER="${OCI_USER:-opc}"
OCI_SSH_KEY="${OCI_SSH_KEY:-}"
REMOTE_DIR="${REMOTE_DIR:-/home/$OCI_USER/portfolio}"
PUBLIC_URL="${PUBLIC_URL:-https://agustinperez.dev.ar}"
SITE_URL="${SITE_URL:-$PUBLIC_URL}"
PUBLICATION_READY="${PUBLICATION_READY:-true}"

trap 'printf "\nERROR: falló la fase %s (línea %s).\n" "$PHASE" "$LINENO" >&2' ERR

fail() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

phase() {
  PHASE="$1"
  printf '\n[%s] %s\n' "$1" "$2"
}

usage() {
  cat <<'HELP'
Uso (Bash >= 4, Linux):
  bash scripts/deploy.sh            Deploy desde PC hacia OCI.
  bash scripts/deploy.sh --ci       Deploy desde GitHub Actions.
  bash scripts/deploy.sh --restart  Recrea el contenedor sin recompilar la imagen.
  bash scripts/deploy.sh --check    Valida archivos requeridos y Docker Compose local.
  bash scripts/deploy.sh --test     Ejecuta solo el smoke test de producción.
  bash scripts/deploy.sh --help     Muestra esta ayuda.

Variables opcionales:
  OCI_HOST           IP o host SSH de OCI (requerido para deploy/--ci/--restart).
  OCI_USER           Usuario SSH (predeterminado: opc).
  OCI_SSH_KEY        Ruta de la clave privada SSH.
  REMOTE_DIR         Carpeta destino en la VM (predeterminado: /home/$OCI_USER/portfolio).
  PUBLIC_URL         URL pública verificada en el smoke test (predeterminado: https://agustinperez.dev.ar).
  SITE_URL           Origen canónico pasado al build (predeterminado: $PUBLIC_URL).
  PUBLICATION_READY  Habilitar indexación y sitemap en build (predeterminado: true).
HELP
}

# -----------------------------------------------------------------------------
# 1. VALIDACIONES LOCALES
# -----------------------------------------------------------------------------

validate_local_environment() {
  local mode="$1" cmd file

  for file in \
    "$COMPOSE_FILE" \
    Dockerfile \
    .dockerignore \
    package.json \
    package-lock.json \
    tsconfig.json \
    deploy/container.conf \
    scripts/probar-stack.sh; do
    [[ -f "$file" ]] || fail "Falta el archivo requerido: $file"
  done

  if [[ "$mode" != "--check" ]]; then
    [[ -n "$OCI_HOST" ]] || fail "Debés definir OCI_HOST (IP o dominio de la VM en OCI)."
    for cmd in ssh rsync curl; do
      command -v "$cmd" >/dev/null || fail "Falta '$cmd' en el sistema."
    done
  fi

  if [[ "$mode" == "--ci" ]]; then
    printf 'OK: Archivos del proyecto validados para despliegue CI.\n'
    return 0
  fi

  if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    SITE_URL="$SITE_URL" PUBLICATION_READY="$PUBLICATION_READY" \
      docker compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" config --quiet
    printf 'OK: %s validado con Docker Compose.\n' "$COMPOSE_FILE"
  elif [[ "$mode" == "--check" ]]; then
    fail "Falta 'docker' o el plugin 'docker compose' para ejecutar --check."
  else
    printf 'OK: Archivos locales validados (Docker Compose se validará en OCI).\n'
  fi
}

# -----------------------------------------------------------------------------
# 2. ACCESO SSH A ORACLE CLOUD
# -----------------------------------------------------------------------------

setup_ssh() {
  SSH_TARGET="${OCI_USER}@${OCI_HOST}"
  SSH_OPTS=(-o BatchMode=yes -o ConnectTimeout=10 -o StrictHostKeyChecking=accept-new)

  if [[ -n "$OCI_SSH_KEY" ]]; then
    [[ -f "$OCI_SSH_KEY" ]] || fail "No existe OCI_SSH_KEY: $OCI_SSH_KEY"
    SSH_OPTS+=(-i "$OCI_SSH_KEY" -o IdentitiesOnly=yes)
  fi
}

ssh_remote() {
  ssh "${SSH_OPTS[@]}" "$SSH_TARGET" "$@"
}

wait_for_ssh() {
  local attempt
  for ((attempt = 1; attempt <= 15; attempt++)); do
    if ssh_remote true 2>/dev/null; then
      printf 'OK: Conexión SSH establecida con %s\n' "$SSH_TARGET"
      return 0
    fi
    sleep 3
  done

  fail "No se pudo conectar por SSH a $SSH_TARGET. Verificá clave, usuario, red y puerto 22."
}

# -----------------------------------------------------------------------------
# 3. SINCRONIZACIÓN SELECTIVA (RSYNC)
# -----------------------------------------------------------------------------

sync_project_to_oci() {
  local rsync_ssh

  ssh_remote "umask 077; mkdir -p '$REMOTE_DIR/deploy' '$REMOTE_DIR/scripts'; chmod 700 '$REMOTE_DIR'"

  printf -v rsync_ssh '%q ' ssh "${SSH_OPTS[@]}"
  rsync_ssh=${rsync_ssh% }

  rsync -az --delete --delete-excluded \
    -e "$rsync_ssh" \
    --filter='P /.env' \
    --exclude='.git/' \
    --exclude='.github/' \
    --exclude='.idea/' \
    --exclude='.vscode/' \
    --exclude='node_modules/' \
    --exclude='dist/' \
    --exclude='.build/' \
    --exclude='project_images/' \
    --exclude='tests/' \
    --exclude='*.md' \
    --exclude='.env*' \
    --include='/Dockerfile' \
    --include='/.dockerignore' \
    --include='/package.json' \
    --include='/package-lock.json' \
    --include='/tsconfig.json' \
    --include='/deploy/' \
    --include='/deploy/compose.yaml' \
    --include='/deploy/container.conf' \
    --include='/deploy/nginx.conf' \
    --include='/deploy/security-headers.conf' \
    --exclude='/deploy/***' \
    --include='/scripts/' \
    --include='/scripts/probar-stack.sh' \
    --exclude='/scripts/***' \
    --include='/src/***' \
    --include='/public/***' \
    --exclude='*' \
    ./ "$SSH_TARGET:$REMOTE_DIR/"

  ssh_remote "chmod +x '$REMOTE_DIR/scripts/probar-stack.sh'"
  printf 'OK: Archivos de producción sincronizados en %s:%s\n' "$SSH_TARGET" "$REMOTE_DIR"
}

# -----------------------------------------------------------------------------
# 4. BUILD Y ACTUALIZACIÓN DEL CONTENEDOR EN OCI
# -----------------------------------------------------------------------------

deploy_remote_stack() {
  local mode="$1"

  ssh_remote "bash -se -- '$REMOTE_DIR' '$mode' '$COMPOSE_PROJECT' '$COMPOSE_FILE' '$SITE_URL' '$PUBLICATION_READY'" <<'REMOTE'
set -Eeuo pipefail
REMOTE_DIR=$1
MODE=$2
COMPOSE_PROJECT=$3
COMPOSE_FILE=$4
SITE_URL=$5
PUBLICATION_READY=$6

cd "$REMOTE_DIR"

remote_fail() { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

DOCKER_CMD=(docker)
if ! docker info >/dev/null 2>&1; then
  if sudo -n docker info >/dev/null 2>&1; then
    DOCKER_CMD=(sudo -n docker)
  else
    remote_fail "Docker no está disponible para el usuario SSH (ni con sudo -n)."
  fi
fi

if ! sudo -n test -s /srv/portfolio-tls/fullchain.pem ||
   ! sudo -n test -s /srv/portfolio-tls/privkey.pem; then
  remote_fail "Los certificados TLS no existen, están vacíos o no son accesibles mediante sudo."
fi

export SITE_URL PUBLICATION_READY

"${DOCKER_CMD[@]}" compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" config --quiet

if [[ "$MODE" != "--restart" ]]; then
  echo "[*] Compilando imagen del portfolio en OCI (ARM64)..."
  "${DOCKER_CMD[@]}" compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" build --pull
fi

COMPOSE_UP_ARGS=(up -d --remove-orphans --wait --wait-timeout 120)
if [[ "$MODE" == "--restart" ]]; then
  COMPOSE_UP_ARGS+=(--force-recreate --no-build)
fi

show_deploy_failure() {
  echo "[ERROR] Falló Docker Compose. Estado y últimos logs:" >&2
  "${DOCKER_CMD[@]}" compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" ps -a || true
  "${DOCKER_CMD[@]}" compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" logs --tail=100 || true
}

echo "[*] Actualizando contenedor del portfolio..."
if ! "${DOCKER_CMD[@]}" compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" "${COMPOSE_UP_ARGS[@]}"; then
  show_deploy_failure
  exit 1
fi

"${DOCKER_CMD[@]}" image prune -f >/dev/null 2>&1 || true
"${DOCKER_CMD[@]}" compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" ps
REMOTE
}

# -----------------------------------------------------------------------------
# 5. ORQUESTACIÓN Y SMOKE TEST
# -----------------------------------------------------------------------------

main() {
  local mode="${1:-}"

  [[ $# -le 1 ]] || fail "Demasiados argumentos. Usá --help para ver las opciones."

  case "$mode" in
    -h|--help)
      usage
      return 0
      ;;
    --test)
      [[ -f scripts/probar-stack.sh ]] || fail "Falta scripts/probar-stack.sh."
      phase TEST "Ejecutando smoke test contra $PUBLIC_URL"
      bash scripts/probar-stack.sh "$PUBLIC_URL"
      return 0
      ;;
    --check|--restart|--ci|'')
      ;;
    *)
      usage >&2
      fail "Opción desconocida: $mode"
      ;;
  esac

  phase 1 "Validando archivos y requisitos (${mode:-local})"
  validate_local_environment "$mode"
  [[ "$mode" != "--check" ]] || return 0

  phase 2 "Verificando acceso SSH a OCI ($OCI_USER@$OCI_HOST)"
  setup_ssh
  wait_for_ssh

  phase 3 "Sincronizando archivos de producción hacia $REMOTE_DIR"
  sync_project_to_oci

  phase 4 "Construyendo/actualizando contenedor del portfolio en OCI (ARM64)"
  deploy_remote_stack "$mode"

  phase 5 "Ejecutando smoke test contra $PUBLIC_URL (desde OCI, sin pasar por Cloudflare)"
  ssh_remote "bash -se -- '$REMOTE_DIR' '$PUBLIC_URL'" <<'REMOTE_SMOKE'
set -Eeuo pipefail
cd "$1"
PUBLIC_URL="$2"

# Conectar al Nginx del host, conservando el dominio, SNI y validación TLS.
# Esto evita los bloqueos 403 que Cloudflare puede aplicar al runner de GitHub.
SMOKE_HOST="${PUBLIC_URL#*://}"
SMOKE_HOST="${SMOKE_HOST%%/*}"
SMOKE_HOST="${SMOKE_HOST%%:*}"
curl() {
  command curl --resolve "$SMOKE_HOST:80:127.0.0.1" \
               --resolve "$SMOKE_HOST:443:127.0.0.1" "$@"
}
export -f curl

bash scripts/probar-stack.sh "$PUBLIC_URL"
REMOTE_SMOKE

  printf '\n=================================================================\n'
  printf ' DESPLIEGUE DEL PORTFOLIO COMPLETADO: %s\n' "$PUBLIC_URL"
  printf '=================================================================\n'
}

main "$@"
