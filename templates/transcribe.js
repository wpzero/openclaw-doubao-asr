#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

// Load shared library from central location
const DoubaoASR = require(path.join(
  process.env.HOME,
  '.openclaw',
  'lib',
  'doubao-asr'
))

async function main() {
  const audioFile = process.argv[2]
  const language = process.argv[3]

  if (!audioFile || !fs.existsSync(audioFile)) {
    console.error('Usage: transcribe.js <audio-file> [language]')
    console.error('')
    console.error('Examples:')
    console.error('  ./transcribe.js voice.ogg zh-CN')
    console.error('  ./transcribe.js voice.ogg en-US')
    console.error('  ./transcribe.js voice.ogg')
    console.error('')
    console.error('Supported languages:')
    console.error('  zh-CN - Chinese (Mandarin)')
    console.error('  en-US - English')
    console.error('  ja-JP - Japanese')
    console.error('  ko-KR - Korean')
    console.error('  es-ES - Spanish')
    process.exit(1)
  }

  try {
    console.log(`Transcribing: ${audioFile}`)

    // Auto-detects agent name from cwd, loads appropriate credentials
    const text = await DoubaoASR.transcribe(audioFile, { language })

    console.log(`\nTranscription: ${text}`)

    // Save result
    const outputFile = `${audioFile}.txt`
    fs.writeFileSync(outputFile, text, 'utf8')
    console.log(`Saved to: ${outputFile}`)
  } catch (err) {
    console.error('Transcription failed:', err.message)
    process.exit(1)
  }
}

main()
