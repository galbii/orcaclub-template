#!/usr/bin/env bash
# Spin up a new project from this template.
#
#   bun run new-project <slug> [--title "Display Name"] [--db <mongo-url>] [--repo private|public|none]
#
# Creates ../<slug> next to this template with fresh git history, rebranded
# strings, generated secrets, DATABASE_URL set, deps installed, and (by default)
# a private GitHub repo under the active `gh` account. The template is untouched.
set -euo pipefail

usage() {
  echo "Usage: bun run new-project <slug> [--title \"Name\"] [--db <mongo-url>] [--repo private|public|none]" >&2
  exit 1
}

[[ $# -ge 1 ]] || usage
SLUG="$1"; shift
[[ "$SLUG" =~ ^[a-z0-9][a-z0-9-]*$ ]] || { echo "slug must be lowercase kebab-case: $SLUG" >&2; exit 1; }

# Default title: kebab-case → Title Case ("my-site" → "My Site")
TITLE="$(echo "$SLUG" | awk -F- '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) substr($i,2)} 1' OFS=' ')"
DB=""
REPO="private"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --title) TITLE="$2"; shift 2 ;;
    --db)    DB="$2"; shift 2 ;;
    --repo)  REPO="$2"; shift 2 ;;
    *) usage ;;
  esac
done
[[ "$REPO" =~ ^(private|public|none)$ ]] || usage

TEMPLATE="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$(dirname "$TEMPLATE")/$SLUG"

[[ -e "$DEST" ]] && { echo "$DEST already exists" >&2; exit 1; }
if [[ "$REPO" != "none" ]]; then
  command -v gh >/dev/null || { echo "gh CLI not found — install it or pass --repo none" >&2; exit 1; }
  OWNER="$(gh api user -q .login)"
  gh repo view "$OWNER/$SLUG" >/dev/null 2>&1 && { echo "GitHub repo $OWNER/$SLUG already exists" >&2; exit 1; }
fi

echo "→ Copying template to $DEST"
rsync -a \
  --exclude .git --exclude node_modules --exclude .next --exclude .env.local \
  --exclude public/media --exclude MEDIA_MANAGER_UPDATES.md --exclude scripts/new-project.sh \
  "$TEMPLATE/" "$DEST/"
cd "$DEST"

echo "→ Rebranding as \"$TITLE\""
grep -rIl "Payload Website Template" src tests | xargs sed -i.bak "s/Payload Website Template/$TITLE/g"
sed -i.bak "s/>Orcaclub</>$TITLE</; s/^\( *\)Orcaclub\$/\1$TITLE/" src/components/Logo/Logo.tsx
sed -i.bak "s/} OrcaClub\$/} $TITLE/" src/Footer/Component.tsx
sed -i.bak \
  -e "s/\"name\": \"[^\"]*\"/\"name\": \"$SLUG\"/" \
  -e "s/\"description\": \"[^\"]*\"/\"description\": \"$TITLE — Payload CMS + Next.js site\"/" \
  -e "s/\"license\": \"MIT\"/\"private\": true/" \
  -e '/"new-project":/d' \
  package.json
sed -i.bak "1s/.*/# $TITLE — AI Agent Guide/" CLAUDE.md
# Drop the template-only section (between the markers) from the new project's CLAUDE.md
sed -i.bak -e '/<!-- template-only:start -->/,/<!-- template-only:end -->/d' -e '/bun run new-project/d' CLAUDE.md
awk -v title="$TITLE" '
  !done && /^Core features:/ {
    print "# " title "\n\nPayload CMS v3 + Next.js 15 (App Router) + MongoDB + Bun + Tailwind v4.\nBootstrapped from the OrcaClub Payload starter.\n"
    done = 1
  }
  done { print }
' README.md > README.md.new && mv README.md.new README.md
find . -name '*.bak' -not -path './node_modules/*' -delete

echo "→ Writing .env.local"
cp .env.example .env.local
node scripts/gen-secrets.mjs >/dev/null
if [[ -n "$DB" ]]; then
  # Insert the slug as the database name if the URL has none (Atlas copy-paste
  # strings never do — env.ts would refuse to boot).
  DB="$(node -e '
    const u = new URL(process.argv[1]);
    if (!u.pathname.replace(/^\//, "")) u.pathname = "/" + process.argv[2];
    if (u.protocol === "mongodb+srv:" && !u.search) u.search = "?retryWrites=true&w=majority";
    console.log(u.toString());
  ' "$DB" "$SLUG")"
  DB_ESCAPED="$(printf '%s' "$DB" | sed 's/[&#\\]/\\&/g')"
  sed -i.bak "s#^DATABASE_URL=.*#DATABASE_URL=$DB_ESCAPED#" .env.local && rm .env.local.bak
  echo "  DATABASE_URL set (database: $(node -e 'console.log(new URL(process.argv[1]).pathname.slice(1))' "$DB"))"
else
  echo "  DATABASE_URL left blank — fill it in .env.local"
fi

echo "→ Installing dependencies"
bun install >/dev/null

echo "→ Initialising git"
git init -b main -q
git add -A
git commit -q -m "Initial commit: $TITLE from OrcaClub Payload starter"

if [[ "$REPO" != "none" ]]; then
  echo "→ Creating $REPO GitHub repo $OWNER/$SLUG"
  gh repo create "$OWNER/$SLUG" "--$REPO" --source=. --remote=origin --push >/dev/null
fi

echo
echo "✓ $TITLE ready at $DEST"
[[ "$REPO" != "none" ]] && echo "  https://github.com/$OWNER/$SLUG"
echo
echo "Next:"
[[ -z "$DB" ]] && echo "  • set DATABASE_URL in .env.local"
echo "  • fill remaining '<-- FILL IN' values in .env.local"
echo "  • cd ../$SLUG && bun run build && bun dev"
