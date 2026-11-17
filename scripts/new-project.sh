#!/usr/bin/env bash
# Spin up a new project from this template.
#
#   bun run new-project <slug> [--title "Display Name"] [--url https://example.com]
#                              [--db <mongo-url>] [--repo none|private|public]
#                              [--verify] [--no-seed]
#
# Creates ../<slug> next to this template with fresh git history, rebranded
# strings, generated secrets, site env (name/url/storage) and DATABASE_URL set,
# and deps installed. No GitHub repo is created unless --repo private|public is
# passed (outward-facing: needs an explicit OK). The template is untouched.
set -euo pipefail

usage() {
  cat >&2 <<'USAGE'
Usage: bun run new-project <slug> [options]
  --title "Name"     display name (default: slug in Title Case)
  --url <url>        NEXT_PUBLIC_SERVER_URL (default: http://localhost:3000)
  --db <mongo-url>   DATABASE_URL (db name /<slug> added when missing)
  --repo <mode>      none (default) | private | public — creates and pushes a GitHub repo
  --verify           run `bun run typecheck`, plus `bun run build` when --db is set
  --no-seed          drop the sample seed (posts, images, demo user, Seed button) and
                     swap the template favicon/OG image for neutral placeholders
USAGE
  exit 1
}

[[ $# -ge 1 ]] || usage
SLUG="$1"; shift
[[ "$SLUG" =~ ^[a-z0-9][a-z0-9-]*$ ]] || { echo "slug must be lowercase kebab-case: $SLUG" >&2; exit 1; }

# Default title: kebab-case → Title Case ("my-site" → "My Site")
TITLE="$(echo "$SLUG" | awk -F- '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) substr($i,2)} 1' OFS=' ')"
URL=""
DB=""
REPO="none"
VERIFY=0
NO_SEED=0

need_arg() { [[ $# -ge 2 && -n "$2" ]] || { echo "$1 needs a value" >&2; usage; }; }
while [[ $# -gt 0 ]]; do
  case "$1" in
    --title)   need_arg "$@"; TITLE="$2"; shift 2 ;;
    --url)     need_arg "$@"; URL="$2"; shift 2 ;;
    --db)      need_arg "$@"; DB="$2"; shift 2 ;;
    --repo)    need_arg "$@"; REPO="$2"; shift 2 ;;
    --verify)  VERIFY=1; shift ;;
    --no-seed) NO_SEED=1; shift ;;
    *) usage ;;
  esac
done
[[ "$REPO" =~ ^(private|public|none)$ ]] || usage

# The title lands in TS strings, template literals, JSX, JSON, Markdown and a
# test regex. `/`, `&`, `#`, `'` and regex metacharacters are escaped below;
# characters that would need per-context quoting are refused up front.
if [[ "$TITLE" =~ [\"\`\\\$\{\}\<\>] || "$TITLE" == *$'\n'* || -z "${TITLE// /}" ]]; then
  echo "title must be non-empty and must not contain \" \` \\ \$ { } < > or newlines: $TITLE" >&2
  exit 1
fi
if [[ -n "$URL" ]]; then
  URL="${URL%/}"
  [[ "$URL" =~ ^https?://[^[:space:]\"\'\`\\]+$ ]] || { echo "--url must be http(s)://host[/path] with no spaces or quotes: $URL" >&2; exit 1; }
fi

# sed replacement escaping: \ / & # are special in `s/…/…/` and `s#…#…#`.
sed_escape() { printf '%s' "$1" | sed -e 's/[\/&#\\]/\\&/g'; }
TITLE_SED="$(sed_escape "$TITLE")"
# src/: every occurrence sits in a '…' string, `…` template or JSX text → escape '.
TITLE_JS_SED="$(sed_escape "$(printf '%s' "$TITLE" | sed -e "s/'/\\\\'/g")")"
# JSX text (Logo, Footer): ' as &apos; (react/no-unescaped-entities).
TITLE_JSX_SED="$(sed_escape "$(printf '%s' "$TITLE" | sed -e "s/'/\&apos;/g")")"
# tests/: also used inside a /…/ regex literal → escape regex metachars and /.
TITLE_RE_SED="$(sed_escape "$(printf '%s' "$TITLE" | sed -e "s#[]['()*+?^|./]#\\\\&#g")")"

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
  --exclude public/media --exclude MEDIA_MANAGER_UPDATES.md \
  --exclude scripts/new-project.sh --exclude scripts/placeholders \
  "$TEMPLATE/" "$DEST/"
cd "$DEST"

if [[ "$NO_SEED" == 1 ]]; then
  echo "→ Removing sample seed content (--no-seed)"
  # Keep home-static.ts: it is the code fallback home page until a CMS Page
  # with slug `home` exists (src/app/(frontend)/page.tsx, [slug]/page.tsx).
  find src/endpoints/seed -mindepth 1 -maxdepth 1 ! -name home-static.ts -exec rm -rf {} +
  rm -rf 'src/app/(frontend)/next/seed' src/components/BeforeDashboard/SeedButton
  perl -0pi -e "s#import \{ SeedButton \} from './SeedButton'\n##; s#\s*<li>\s*<SeedButton />.*?</li>##s" \
    src/components/BeforeDashboard/index.tsx
  cp "$TEMPLATE/scripts/placeholders/favicon.ico" public/favicon.ico
  cp "$TEMPLATE/scripts/placeholders/favicon.svg" public/favicon.svg
  cp "$TEMPLATE/scripts/placeholders/og.webp" public/website-template-OG.webp
fi

echo "→ Rebranding as \"$TITLE\""
grep -rIl "Payload Website Template" src | xargs -r sed -i.bak "s/Payload Website Template/$TITLE_JS_SED/g"
grep -rIl "Payload Website Template" tests | xargs -r sed -i.bak "s/Payload Website Template/$TITLE_RE_SED/g"
sed -i.bak "s/>Orcaclub</>$TITLE_JSX_SED</; s/^\( *\)Orcaclub\$/\1$TITLE_JSX_SED/" src/components/Logo/Logo.tsx
sed -i.bak "s/} OrcaClub\$/} $TITLE_JSX_SED/" src/Footer/Component.tsx
sed -i.bak \
  -e "s/\"name\": \"[^\"]*\"/\"name\": \"$SLUG\"/" \
  -e "s/\"description\": \"[^\"]*\"/\"description\": \"$TITLE_SED — Payload CMS + Next.js site\"/" \
  -e "s/\"license\": \"MIT\"/\"private\": true/" \
  -e '/"new-project":/d' \
  package.json
sed -i.bak "1s/.*/# $TITLE_SED — AI Agent Guide/" CLAUDE.md
# Drop the template-only section (between the markers) from the new project's CLAUDE.md
sed -i.bak -e '/<!-- template-only:start -->/,/<!-- template-only:end -->/d' -e '/bun run new-project/d' CLAUDE.md
# ENVIRON, not -v: awk -v would interpret backslash escapes in the title.
NP_TITLE="$TITLE" awk '
  !done && /^Core features:/ {
    print "# " ENVIRON["NP_TITLE"] "\n\nPayload CMS v3 + Next.js 15 (App Router) + MongoDB + Bun + Tailwind v4.\nBootstrapped from the OrcaClub Payload starter.\n"
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
fi

# Site identity + storage. Values are passed through the environment (never
# echoed); only names are printed. Single-quoted dotenv values are literal.
NP_SITE_NAME="$TITLE" NP_SERVER_URL="$URL" node -e '
  const fs = require("fs");
  const file = ".env.local";
  let text = fs.readFileSync(file, "utf8");
  const quote = (v) => (v.includes("\x27") ? "\"" + v + "\"" : "\x27" + v + "\x27");
  const set = (key, value) => {
    const re = new RegExp("^" + key + "=.*$", "m");
    const line = key + "=" + value;
    text = re.test(text) ? text.replace(re, () => line) : text + "\n" + line + "\n";
    console.log("  " + key + " set");
  };
  set("NEXT_PUBLIC_SITE_NAME", quote(process.env.NP_SITE_NAME));
  if (process.env.NP_SERVER_URL) set("NEXT_PUBLIC_SERVER_URL", process.env.NP_SERVER_URL);
  const storage = text.match(/^STORAGE_MODE=([^#\s]*)/m);
  if (!storage || !storage[1]) set("STORAGE_MODE", "local");
  fs.writeFileSync(file, text);
'

echo "→ Installing dependencies"
bun install >/dev/null

echo "→ Initialising git"
git init -b main -q
git add -A
git commit -q -m "Initial commit: $TITLE from OrcaClub Payload starter"

if [[ "$VERIFY" == 1 ]]; then
  echo "→ Verifying: bun run typecheck"
  bun run typecheck >/dev/null || { echo "✗ typecheck failed in $DEST — run 'bun run typecheck' there for details" >&2; exit 1; }
  echo "  typecheck passed"
  if [[ -n "$DB" ]]; then
    echo "→ Verifying: bun run build (boots Payload against DATABASE_URL)"
    bun run build >/dev/null || { echo "✗ build failed in $DEST — run 'bun run build' there for details" >&2; exit 1; }
    echo "  build passed"
  else
    echo "  build skipped (no --db; the build boots Payload and needs a reachable Mongo)"
  fi
fi

if [[ "$REPO" != "none" ]]; then
  echo "→ Creating $REPO GitHub repo $OWNER/$SLUG"
  gh repo create "$OWNER/$SLUG" "--$REPO" --source=. --remote=origin --push >/dev/null
fi

# Names only, never values: required vars still blank, and placeholders to replace.
BLANK_REPORT="$(node -e '
  const text = require("fs").readFileSync(".env.local", "utf8");
  const env = {}, marked = [];
  for (const line of text.split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (!m) continue;
    const value = m[2].replace(/\s+#.*$/, "").trim().replace(/^([\x27"`])(.*)\1$/, "$2");
    env[m[1]] = value;
    if (/<-- FILL IN/.test(m[2])) marked.push(m[1]);
  }
  const required = ["DATABASE_URL", "PAYLOAD_SECRET", "CRON_SECRET", "PREVIEW_SECRET",
                    "NEXT_PUBLIC_SERVER_URL", "NEXT_PUBLIC_SITE_NAME", "STORAGE_MODE"];
  if (env.STORAGE_MODE === "r2")
    required.push("R2_BUCKET", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_ENDPOINT", "NEXT_PUBLIC_R2_PUBLIC_URL");
  if (env.RESEND_API_KEY) required.push("RESEND_FROM_ADDRESS");
  const blank = required.filter((k) => !env[k]);
  const optional = marked.filter((k) => !required.includes(k));
  console.log("required:" + blank.join(" "));
  console.log("optional:" + optional.join(" "));
')"
REQUIRED_BLANK="$(sed -n 's/^required://p' <<<"$BLANK_REPORT")"
OPTIONAL_MARKED="$(sed -n 's/^optional://p' <<<"$BLANK_REPORT")"

echo
echo "✓ $TITLE ready at $DEST"
[[ "$REPO" != "none" ]] && echo "  https://github.com/$OWNER/$SLUG"
echo
if [[ -n "$REQUIRED_BLANK" ]]; then
  echo "Required env still blank in .env.local: $REQUIRED_BLANK"
else
  echo "Required env: all set"
fi
[[ -n "$OPTIONAL_MARKED" ]] && echo "Optional, still marked '<-- FILL IN' (set or leave as-is): $OPTIONAL_MARKED"
echo
echo "Next:"
[[ "$NO_SEED" == 1 ]] && echo "  • replace public/favicon.ico, public/favicon.svg and public/website-template-OG.webp (neutral placeholders)"
echo "  • cd ../$SLUG && bun run build && bun dev"
echo "  • follow the new-project checklist in the template's CLAUDE.md (admin user, home page, assets, Coolify)"
