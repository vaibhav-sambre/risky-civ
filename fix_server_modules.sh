#!/bin/bash
cd "/Users/vaibhav.sambre/Documents/Risky Civ/server"

# Fix each file: replace require patterns and add module.exports

# ── utils.js already done ──

# ── mapgen.js ──
python3 -c "
import re
with open('mapgen.js','r') as f: c = f.read()
# Remove empty import lines
c = re.sub(r'^const \w+ = require\([^)]+\);\s*\n','',c,flags=re.M)
# Add requires at top
header = '''const { shuffle, randomPick, randomInt } = require('./utils');
'''
# Add module.exports at bottom
c = header + c
# Find all function names
fns = re.findall(r'^function (\w+)', c, re.M)
c += '\nmodule.exports = { ' + ', '.join(fns) + ' };\n'
with open('mapgen.js','w') as f: f.write(c)
"

# ── territories.js ──
python3 -c "
import re
with open('territories.js','r') as f: c = f.read()
c = re.sub(r'^const \w+ = require\([^)]+\);\s*\n','',c,flags=re.M)
header = '''const { BASE_TERRITORY_RESOURCES } = require('./config');
const { generateMap } = require('./mapgen');
'''
c = header + c
fns = re.findall(r'^function (\w+)', c, re.M)
c += '\nmodule.exports = { ' + ', '.join(fns) + ' };\n'
with open('territories.js','w') as f: f.write(c)
"

# ── state.js ──
python3 -c "
import re
with open('state.js','r') as f: c = f.read()
c = re.sub(r'^const \w+ = require\([^)]+\);\s*\n','',c,flags=re.M)
header = '''const { STARTING_RESOURCES, BASE_ACTIONS_PER_TURN, STARTING_HAND_SIZE, BONUS_CARDS, EVENT_CARDS, PLAYER_NAMES, PLAYER_COLORS } = require('./config');
const { createTerritories, getContinentData } = require('./territories');
const { shuffle, deepClone } = require('./utils');
'''
c = header + c
fns = re.findall(r'^function (\w+)', c, re.M)
c += '\nmodule.exports = { ' + ', '.join(fns) + ' };\n'
with open('state.js','w') as f: f.write(c)
"

# ── actions.js ──
python3 -c "
import re
with open('actions.js','r') as f: c = f.read()
c = re.sub(r'^const \w+ = require\([^)]+\);\s*\n','',c,flags=re.M)
header = '''const { addLog, getMaxActions } = require('./state');
'''
c = header + c
fns = re.findall(r'^function (\w+)', c, re.M)
c += '\nmodule.exports = { ' + ', '.join(fns) + ' };\n'
with open('actions.js','w') as f: f.write(c)
"

# ── resources.js ──
python3 -c "
import re
with open('resources.js','r') as f: c = f.read()
c = re.sub(r'^const \w+ = require\([^)]+\);\s*\n','',c,flags=re.M)
header = '''const { STRUCTURES, TROOP_UPKEEP_COST } = require('./config');
const { getPlayerTerritories, getControlledContinents } = require('./territories');
const { addLog, hasEffect } = require('./state');
'''
c = header + c
fns = re.findall(r'^function (\w+)', c, re.M)
c += '\nmodule.exports = { ' + ', '.join(fns) + ' };\n'
with open('resources.js','w') as f: f.write(c)
"

# ── cards.js ──
python3 -c "
import re
with open('cards.js','r') as f: c = f.read()
c = re.sub(r'^const \w+ = require\([^)]+\);\s*\n','',c,flags=re.M)
header = '''const { MAX_HAND_SIZE, CARDS_DRAWN_PER_TURN, EVENT_CARDS } = require('./config');
const { addLog, setEffect } = require('./state');
const { getPlayerTerritories, getTerritory, getNeutralTerritories } = require('./territories');
const { shuffle, randomPick } = require('./utils');
'''
c = header + c
fns = re.findall(r'^function (\w+)', c, re.M)
c += '\nmodule.exports = { ' + ', '.join(fns) + ' };\n'
with open('cards.js','w') as f: f.write(c)
"

# ── tech.js ──
python3 -c "
import re
with open('tech.js','r') as f: c = f.read()
c = re.sub(r'^const \w+ = require\([^)]+\);\s*\n','',c,flags=re.M)
header = '''const { TECH_TREE } = require('./config');
const { addLog } = require('./state');
'''
c = header + c
fns = re.findall(r'^function (\w+)', c, re.M)
c += '\nmodule.exports = { ' + ', '.join(fns) + ' };\n'
with open('tech.js','w') as f: f.write(c)
"

# ── combat.js ──
python3 -c "
import re
with open('combat.js','r') as f: c = f.read()
c = re.sub(r'^const \w+ = require\([^)]+\);\s*\n','',c,flags=re.M)
header = '''const { MAX_ATTACK_DICE, MAX_DEFEND_DICE, MIN_GARRISON } = require('./config');
const { rollDice, clamp } = require('./utils');
const { getTerritory } = require('./territories');
const { addLog, hasEffect } = require('./state');
'''
c = header + c
fns = re.findall(r'^function (\w+)', c, re.M)
c += '\nmodule.exports = { ' + ', '.join(fns) + ' };\n'
with open('combat.js','w') as f: f.write(c)
"

# ── troops.js ──
python3 -c "
import re
with open('troops.js','r') as f: c = f.read()
c = re.sub(r'^const \w+ = require\([^)]+\);\s*\n','',c,flags=re.M)
header = '''const { TROOP_DEPLOY_COST, BASE_DEPLOY_COUNT, STRUCTURES, MIN_GARRISON } = require('./config');
const { getTerritory } = require('./territories');
const { addLog, hasEffect } = require('./state');
'''
c = header + c
fns = re.findall(r'^function (\w+)', c, re.M)
c += '\nmodule.exports = { ' + ', '.join(fns) + ' };\n'
with open('troops.js','w') as f: f.write(c)
"

# ── structures.js ──
python3 -c "
import re
with open('structures.js','r') as f: c = f.read()
c = re.sub(r'^const \w+ = require\([^)]+\);\s*\n','',c,flags=re.M)
header = '''const { STRUCTURES } = require('./config');
const { addLog, hasEffect } = require('./state');
const { getTerritory } = require('./territories');
'''
c = header + c
fns = re.findall(r'^function (\w+)', c, re.M)
c += '\nmodule.exports = { ' + ', '.join(fns) + ' };\n'
with open('structures.js','w') as f: f.write(c)
"

# ── ai.js ──
python3 -c "
import re
with open('ai.js','r') as f: c = f.read()
c = re.sub(r'^const \w+ = require\([^)]+\);\s*\n','',c,flags=re.M)
header = '''const { getPlayerTerritories, getAdjacentEnemies, getTerritory, getNeutralTerritories, canAttackFrom } = require('./territories');
const { deployTroops } = require('./troops');
const { buildStructure, canAffordStructure } = require('./structures');
const { playCard } = require('./cards');
const { unlockTech, getNextTech } = require('./tech');
const { resolveCombatRound, applyCombatResult, canAttack, getMaxAttackers } = require('./combat');
const { spendAction, hasActions } = require('./actions');
const { addLog } = require('./state');
const { randomPick } = require('./utils');
'''
c = header + c
fns = re.findall(r'^(?:async )?function (\w+)', c, re.M)
c += '\nmodule.exports = { ' + ', '.join(fns) + ' };\n'
with open('ai.js','w') as f: f.write(c)
"

echo "All server modules fixed!"
