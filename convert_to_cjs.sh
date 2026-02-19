#!/bin/bash
# Convert ES modules to CommonJS for server directory
SRC="js"
DST="server"

for file in mapgen.js territories.js state.js actions.js resources.js cards.js tech.js combat.js troops.js structures.js ai.js; do
    echo "Converting $file..."
    cat "$SRC/$file" | \
        sed 's/^export function /function /g' | \
        sed 's/^export async function /async function /g' | \
        sed "s|import {[^}]*} from '\./config\.js';|const config = require('./config');|g" | \
        sed "s|import {[^}]*} from '\./utils\.js';|const utils = require('./utils');|g" | \
        sed "s|import {[^}]*} from '\./state\.js';|const state_mod = require('./state');|g" | \
        sed "s|import {[^}]*} from '\./territories\.js';|const territories_mod = require('./territories');|g" | \
        sed "s|import {[^}]*} from '\./mapgen\.js';|const mapgen_mod = require('./mapgen');|g" | \
        sed "s|import {[^}]*} from '\./cards\.js';|const cards_mod = require('./cards');|g" | \
        sed "s|import {[^}]*} from '\./tech\.js';|const tech_mod = require('./tech');|g" | \
        sed "s|import {[^}]*} from '\./combat\.js';|const combat_mod = require('./combat');|g" | \
        sed "s|import {[^}]*} from '\./troops\.js';|const troops_mod = require('./troops');|g" | \
        sed "s|import {[^}]*} from '\./structures\.js';|const structures_mod = require('./structures');|g" | \
        sed "s|import {[^}]*} from '\./actions\.js';|const actions_mod = require('./actions');|g" \
        > "$DST/$file"
    echo "Done: $DST/$file"
done
echo "All files converted!"
