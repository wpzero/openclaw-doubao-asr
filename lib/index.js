const fs = require('fs')
const path = require('path')
const DoubaoProtocol = require('./protocol-encoder')
const AudioChunker = require('./audio-chunker')
const DoubaoASRClient = require('./websocket-client')

/**
 * Load credentials with agent-aware fallback
 * Priority: {service}-{agent}.json → {service}-default.json → error
 *
 * @param {string} serviceName - Service name (default: 'doubao')
 * @param {string|null} agentName - Agent name (default: auto-detect from cwd)
 * @returns {object} Credentials object
 */
function loadCredentials(serviceName = 'doubao', agentName = null) {
  const credDir = path.join(process.env.HOME, '.openclaw', 'credentials')

  // Auto-detect agent name if not provided
  if (!agentName) {
    agentName = detectAgentName()
  }

  // Try agent-specific credentials first: doubao-naruto.json
  if (agentName) {
    const agentPath = path.join(credDir, `${serviceName}-${agentName}.json`)
    if (fs.existsSync(agentPath)) {
      console.log(`[Doubao ASR] Using agent credentials: ${serviceName}-${agentName}.json`)
      return JSON.parse(fs.readFileSync(agentPath, 'utf8'))
    }
  }

  // Fallback to default credentials: doubao-default.json
  const defaultPath = path.join(credDir, `${serviceName}-default.json`)
  if (fs.existsSync(defaultPath)) {
    console.log(`[Doubao ASR] Using default credentials: ${serviceName}-default.json`)
    return JSON.parse(fs.readFileSync(defaultPath, 'utf8'))
  }

  // Error with helpful message
  throw new Error(
    `Credentials not found. Please create one of:\n` +
    `  - ${credDir}/${serviceName}-${agentName}.json (agent-specific)\n` +
    `  - ${credDir}/${serviceName}-default.json (fallback)\n\n` +
    `Example:\n` +
    `{\n` +
    `  "apiKey": "your-api-key-here",\n` +
    `  "resourceId": "volc.seedasr.sauc.duration",\n` +
    `  "defaultLanguage": "zh-CN"\n` +
    `}`
  )
}

/**
 * Auto-detect agent name from current working directory
 * Matches pattern: workspace-{agent-name}
 *
 * @returns {string} Agent name (default: 'main' if not detected)
 */
function detectAgentName() {
  const match = process.cwd().match(/workspace-([^/]+)/)
  return match ? match[1] : 'main'
}

/**
 * Convenience function for transcription with auto-configuration
 *
 * @param {string} audioFile - Path to audio file
 * @param {object} options - Transcription options
 * @param {string} options.language - Language code (e.g., 'zh-CN', 'en-US')
 * @param {string} options.agentName - Override auto-detected agent name
 * @param {string} options.userId - User ID (default: 'openclaw-user')
 * @param {boolean} options.enableItn - Enable inverse text normalization (default: true)
 * @returns {Promise<string>} Transcribed text
 */
async function transcribe(audioFile, options = {}) {
  const agentName = options.agentName || detectAgentName()
  const credentials = loadCredentials('doubao', agentName)

  const client = new DoubaoASRClient({
    apiKey: credentials.apiKey,
    resourceId: credentials.resourceId
  })

  const language = options.language || credentials.defaultLanguage || 'zh-CN'

  return await client.transcribe(audioFile, {
    ...options,
    language
  })
}

// Export all modules and utilities
module.exports = {
  // Core classes
  DoubaoASRClient,
  DoubaoProtocol,
  AudioChunker,

  // Utility functions
  loadCredentials,
  detectAgentName,

  // Convenience function
  transcribe
}
