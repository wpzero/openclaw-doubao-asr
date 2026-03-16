# OpenClaw Doubao ASR Library

Voice transcription using Doubao Streaming API for OpenClaw agents.

## Features

- 🎤 Real-time streaming transcription via WebSocket
- 🌍 Multi-language support (Chinese, English, Japanese, Korean, Spanish)
- 🔐 Local credential management (secure, not in git)
- 🤖 Multi-agent support (each agent can have separate API keys)
- ⚡ Fast transcription (<500ms for 5s audio)
- 📦 Simple installation with automated script

## Installation

### Prerequisites

- Node.js >= 14
- ffmpeg (for audio conversion)
- Doubao API key from [Volcengine Console](https://console.volcengine.com)

### Install ffmpeg

```bash
# macOS
brew install ffmpeg

# Linux
sudo apt-get install ffmpeg
```

### Install Library

```bash
# Clone repository to OpenClaw lib directory
git clone https://github.com/wpzero/openclaw-doubao-asr ~/.openclaw/lib/doubao-asr

# Install dependencies
cd ~/.openclaw/lib/doubao-asr
npm install

# Run installation script for your agent
./install.sh <agent-name>  # e.g., ./install.sh naruto
```

### Setup Credentials

Create `~/.openclaw/credentials/doubao-default.json`:
```json
{
  "apiKey": "your-api-key-here",
  "resourceId": "volc.seedasr.sauc.duration",
  "defaultLanguage": "zh-CN"
}
```

Or create agent-specific credentials at `~/.openclaw/credentials/doubao-{agent}.json`

## Usage

```bash
cd ~/.openclaw/workspace-{agent}/skills/doubao-asr
./transcribe.js <audio-file> [language]
```

Example:
```bash
./transcribe.js voice.ogg zh-CN
```

## Updating

```bash
cd ~/.openclaw/lib/doubao-asr
git pull
npm install  # if dependencies changed
```

All agents automatically use the updated version!

## API Reference

### As Library

```javascript
const DoubaoASR = require('/Users/wpzero/.openclaw/lib/doubao-asr')

// Auto-detects agent and loads credentials
const text = await DoubaoASR.transcribe('audio.ogg', { language: 'zh-CN' })
```

### Manual Control

```javascript
const { DoubaoASRClient, loadCredentials } = require('path/to/doubao-asr')

const credentials = loadCredentials('doubao', 'naruto')
const client = new DoubaoASRClient(credentials)
const text = await client.transcribe('audio.ogg', { language: 'zh-CN' })
```

## Supported Languages

- `zh-CN` - Chinese (Mandarin)
- `en-US` - English
- `ja-JP` - Japanese
- `ko-KR` - Korean
- `es-ES` - Spanish

## Architecture

- `lib/index.js` - Main exports
- `lib/protocol-encoder.js` - Doubao binary protocol
- `lib/audio-chunker.js` - Audio processing
- `lib/websocket-client.js` - WebSocket client
- `templates/` - Agent wrapper templates
- `install.sh` - Installation script

## Credential Loading

Credentials are loaded with the following priority:

1. **Agent-specific**: `~/.openclaw/credentials/doubao-{agent}.json`
2. **Default fallback**: `~/.openclaw/credentials/doubao-default.json`
3. **Error**: Helpful message with setup instructions

The agent name is auto-detected from the current working directory (matching `workspace-{agent-name}` pattern) or defaults to `main`.

## Multi-Agent Setup

Each agent can have its own credentials or share the default:

```bash
# Setup for multiple agents
cd ~/.openclaw/lib/doubao-asr
./install.sh naruto
./install.sh main
./install.sh custom-agent

# Create agent-specific credentials (optional)
cat > ~/.openclaw/credentials/doubao-naruto.json <<EOF
{
  "apiKey": "api-key-for-naruto",
  "resourceId": "volc.seedasr.sauc.duration",
  "defaultLanguage": "zh-CN"
}
EOF

# Or all agents share doubao-default.json
```

## Contributing

Pull requests welcome! Please:
1. Test with multiple agents
2. Update README if adding features
3. Follow existing code style

## License

MIT

## Credits

Built for [OpenClaw](https://github.com/openclaw/openclaw) framework.
