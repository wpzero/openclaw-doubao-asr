const WebSocket = require('ws')
const { v4: uuidv4 } = require('uuid')
const DoubaoProtocol = require('./protocol-encoder.js')
const AudioChunker = require('./audio-chunker.js')

class DoubaoASRClient {
  constructor(config) {
    this.apiKey = config.apiKey
    this.resourceId = config.resourceId || 'volc.seedasr.sauc.duration'
    this.wsUrl = 'wss://openspeech.bytedance.com/api/v3/sauc/bigmodel'
  }

  async transcribe(audioFile, options = {}) {
    return new Promise((resolve, reject) => {
      const connectId = uuidv4()
      let transcriptionResult = ''

      // Create WebSocket connection with auth headers
      const ws = new WebSocket(this.wsUrl, {
        headers: {
          'x-api-key': this.apiKey,
          'X-Api-Resource-Id': this.resourceId,
          'X-Api-Connect-Id': connectId
        }
      })

      ws.on('open', async () => {
        console.log('[Doubao ASR] WebSocket connected')

        try {
          // Step 1: Send full client request (configuration)
          const config = {
            user: { uid: options.userId || 'openclaw-user' },
            audio: {
              format: 'pcm',
              codec: 'raw',
              rate: 16000,
              bits: 16,
              channel: 1,
              language: options.language || 'zh-CN'
            },
            request: {
              model_name: 'bigmodel',
              enable_itn: options.enableItn !== false
            }
          }

          const configPacket = DoubaoProtocol.encodeFullClientRequest(config)
          ws.send(configPacket)
          console.log('[Doubao ASR] Config sent')

          // Step 2: Send audio data in chunks
          const chunker = new AudioChunker(audioFile, 200) // 200ms chunks
          let chunkCount = 0

          for await (const chunk of chunker.getChunks()) {
            const audioPacket = DoubaoProtocol.encodeAudioPacket(chunk, false)
            ws.send(audioPacket)
            chunkCount++

            // Add small delay between packets (simulates real-time streaming)
            await new Promise(resolve => setTimeout(resolve, 200))
          }

          console.log(`[Doubao ASR] Sent ${chunkCount} audio chunks`)

          // Step 3: Send final packet (negative packet)
          const finalPacket = DoubaoProtocol.encodeAudioPacket(Buffer.alloc(0), true)
          ws.send(finalPacket)
          console.log('[Doubao ASR] Final packet sent')

        } catch (err) {
          reject(err)
          ws.close()
        }
      })

      ws.on('message', (data) => {
        try {
          const message = DoubaoProtocol.decodeMessage(data)

          if (message.messageType === DoubaoProtocol.MESSAGE_TYPE.FULL_SERVER_RESPONSE) {
            // Extract transcription text
            const result = message.payload
            if (result.result && result.result.text) {
              // Update transcription result (accumulate if needed)
              if (result.result.text.trim()) {
                transcriptionResult = result.result.text
                console.log('[Doubao ASR] Transcription:', transcriptionResult)
              }
            }
          } else if (message.messageType === DoubaoProtocol.MESSAGE_TYPE.ERROR) {
            const error = message.payload
            reject(new Error(`Doubao API error: ${JSON.stringify(error)}`))
            ws.close()
          }
        } catch (err) {
          console.error('[Doubao ASR] Failed to decode message:', err.message)
        }
      })

      ws.on('close', () => {
        console.log('[Doubao ASR] WebSocket closed')
        if (transcriptionResult) {
          resolve(transcriptionResult)
        } else {
          reject(new Error('No transcription result received'))
        }
      })

      ws.on('error', (err) => {
        console.error('[Doubao ASR] WebSocket error:', err.message)
        reject(err)
      })
    })
  }
}

module.exports = DoubaoASRClient
