#!/bin/sh
set -e
command -v node >/dev/null 2>&1 || { echo "Node.js not found."; exit 1; }
node "$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)/scripts/install.mjs"
