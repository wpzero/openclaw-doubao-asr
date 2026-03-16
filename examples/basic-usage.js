#!/usr/bin/env node
// Example: Using Doubao ASR library programmatically

const path = require('path')
const DoubaoASR = require('../lib/index')

async function example() {
  console.log('=== Doubao ASR Library Example ===\n')

  // Example 1: Simple transcription (auto-detects agent and credentials)
  console.log('Example 1: Auto-configured transcription')
  try {
    const text1 = await DoubaoASR.transcribe('test-audio.ogg', {
      language: 'zh-CN'
    })
    console.log('Result:', text1)
  } catch (err) {
    console.error('Error:', err.message)
  }

  console.log('\n---\n')

  // Example 2: Manual credential loading
  console.log('Example 2: Manual credential loading')
  try {
    const credentials = DoubaoASR.loadCredentials('doubao', 'naruto')
    console.log('Loaded credentials for:', credentials.defaultLanguage)

    const client = new DoubaoASR.DoubaoASRClient({
      apiKey: credentials.apiKey,
      resourceId: credentials.resourceId
    })

    const text2 = await client.transcribe('test-audio.ogg', {
      language: 'en-US'
    })
    console.log('Result:', text2)
  } catch (err) {
    console.error('Error:', err.message)
  }

  console.log('\n---\n')

  // Example 3: Agent detection
  console.log('Example 3: Agent detection')
  const agentName = DoubaoASR.detectAgentName()
  console.log('Detected agent:', agentName)
}

// Run if executed directly
if (require.main === module) {
  example().catch(console.error)
}

module.exports = example
