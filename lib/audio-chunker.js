const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')

class AudioChunker {
  constructor(filePath, chunkDurationMs = 200) {
    this.filePath = filePath
    this.chunkDurationMs = chunkDurationMs
  }

  // Convert audio to PCM and chunk into fixed-size packets
  async *getChunks() {
    // Use ffmpeg to convert to PCM (16kHz, mono, 16-bit)
    const ffmpeg = spawn('ffmpeg', [
      '-i', this.filePath,
      '-f', 's16le',      // PCM signed 16-bit little-endian
      '-ar', '16000',     // 16kHz sample rate
      '-ac', '1',         // Mono
      '-'                 // Output to stdout
    ])

    // Calculate chunk size in bytes
    // 16kHz * 2 bytes/sample * chunkDurationMs/1000
    const chunkSize = Math.floor(16000 * 2 * this.chunkDurationMs / 1000)

    let buffer = Buffer.alloc(0)

    for await (const data of ffmpeg.stdout) {
      buffer = Buffer.concat([buffer, data])

      // Yield chunks of fixed size
      while (buffer.length >= chunkSize) {
        yield buffer.slice(0, chunkSize)
        buffer = buffer.slice(chunkSize)
      }
    }

    // Yield remaining data
    if (buffer.length > 0) {
      yield buffer
    }
  }
}

module.exports = AudioChunker
