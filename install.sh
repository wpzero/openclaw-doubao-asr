#!/usr/bin/env bash
# OpenClaw Doubao ASR Library Installation Script
# Usage: ./install.sh <agent-name>

set -e  # Exit on error

AGENT_NAME="${1:-main}"
LIB_DIR="$HOME/.openclaw/lib/doubao-asr"
SKILL_DIR="$HOME/.openclaw/workspace-${AGENT_NAME}/skills/doubao-asr"
CRED_DIR="$HOME/.openclaw/credentials"
CRED_FILE="$CRED_DIR/doubao-${AGENT_NAME}.json"
DEFAULT_CRED="$CRED_DIR/doubao-default.json"

echo "╔════════════════════════════════════════════╗"
echo "║  OpenClaw Doubao ASR Installation         ║"
echo "╚════════════════════════════════════════════╝"
echo ""

# Step 1: Check if library is installed
if [ ! -d "$LIB_DIR" ]; then
  echo "❌ Library not found at: $LIB_DIR"
  echo ""
  echo "Please install the library first:"
  echo "  git clone https://github.com/wpzero/openclaw-doubao-asr $LIB_DIR"
  echo "  cd $LIB_DIR"
  echo "  npm install"
  echo ""
  echo "Then run this script again."
  exit 1
fi

echo "✅ Library found at: $LIB_DIR"

# Step 2: Check library dependencies
if [ ! -d "$LIB_DIR/node_modules" ]; then
  echo "⚠️  Dependencies not installed. Installing now..."
  cd "$LIB_DIR"
  npm install
  echo "✅ Dependencies installed"
fi

# Step 3: Create skill directory
echo "📂 Setting up skill for agent: $AGENT_NAME"
mkdir -p "$SKILL_DIR"

# Step 4: Copy wrapper script
if [ -f "$SKILL_DIR/transcribe.js" ]; then
  echo "⚠️  Wrapper already exists. Backing up..."
  mv "$SKILL_DIR/transcribe.js" "$SKILL_DIR/transcribe.js.bak"
fi

cp "$LIB_DIR/templates/transcribe.js" "$SKILL_DIR/"
chmod +x "$SKILL_DIR/transcribe.js"
echo "✅ Wrapper script installed"

# Step 5: Create SKILL.md documentation
cat > "$SKILL_DIR/SKILL.md" <<EOF
# Doubao ASR Skill

Voice transcription using Doubao Streaming API.

## Usage
\`\`\`bash
./transcribe.js <audio-file> [language]
\`\`\`

## Examples
\`\`\`bash
# Chinese transcription
./transcribe.js voice.ogg zh-CN

# English transcription
./transcribe.js voice.ogg en-US

# Auto-detect language
./transcribe.js voice.ogg
\`\`\`

## Credentials
Uses: \`doubao-${AGENT_NAME}.json\` (or \`doubao-default.json\` as fallback)

Location: \`~/.openclaw/credentials/\`

## Shared Library
Core logic: \`~/.openclaw/lib/doubao-asr/\`

To update library: \`cd ~/.openclaw/lib/doubao-asr && git pull\`

## Implementation
This skill uses the shared library at \`~/.openclaw/lib/doubao-asr/\`.
Core logic is centralized for multi-agent use.
EOF

echo "✅ Documentation created"

# Step 6: Setup credentials
mkdir -p "$CRED_DIR"

if [ ! -f "$CRED_FILE" ] && [ ! -f "$DEFAULT_CRED" ]; then
  echo ""
  echo "⚠️  No credentials found. Creating template..."
  cp "$LIB_DIR/templates/credentials.json" "$DEFAULT_CRED"
  echo "✅ Created: $DEFAULT_CRED"
  echo ""
  echo "📝 Please edit with your API key:"
  echo "   vim $DEFAULT_CRED"
  NEEDS_CREDENTIALS=true
elif [ ! -f "$CRED_FILE" ] && [ -f "$DEFAULT_CRED" ]; then
  echo "✅ Using default credentials: $DEFAULT_CRED"
else
  echo "✅ Using agent credentials: $CRED_FILE"
fi

# Step 7: Success message
echo ""
echo "╔════════════════════════════════════════════╗"
echo "║  ✅ Installation Complete!                ║"
echo "╚════════════════════════════════════════════╝"
echo ""
echo "Agent: $AGENT_NAME"
echo "Skill: $SKILL_DIR"
echo ""

if [ "$NEEDS_CREDENTIALS" = true ]; then
  echo "⚠️  Next steps:"
  echo "  1. Edit credentials: vim $DEFAULT_CRED"
  echo "  2. Add your Doubao API key"
  echo "  3. Test: cd $SKILL_DIR && ./transcribe.js <audio-file>"
else
  echo "Test it:"
  echo "  cd $SKILL_DIR"
  echo "  ./transcribe.js <audio-file>"
fi
echo ""
