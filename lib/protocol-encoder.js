// Doubao Binary Protocol Encoder/Decoder

class DoubaoProtocol {
  // Protocol constants
  static PROTOCOL_VERSION = 0b0001
  static HEADER_SIZE = 0b0001 // Header size = 4 bytes (1 * 4)

  static MESSAGE_TYPE = {
    FULL_CLIENT_REQUEST: 0b0001,
    AUDIO_ONLY_REQUEST: 0b0010,
    FULL_SERVER_RESPONSE: 0b1001,
    ERROR: 0b1111
  }

  static FLAGS = {
    NO_SEQUENCE: 0b0000,
    POSITIVE_SEQUENCE: 0b0001,
    LAST_PACKET_NO_SEQ: 0b0010,
    LAST_PACKET_WITH_SEQ: 0b0011
  }

  static SERIALIZATION = {
    NONE: 0b0000,
    JSON: 0b0001
  }

  static COMPRESSION = {
    NONE: 0b0000,
    GZIP: 0b0001
  }

  // Encode full client request (config)
  static encodeFullClientRequest(config) {
    const payload = Buffer.from(JSON.stringify(config), 'utf8')
    return this.encodeMessage(
      this.MESSAGE_TYPE.FULL_CLIENT_REQUEST,
      this.FLAGS.NO_SEQUENCE,
      this.SERIALIZATION.JSON,
      this.COMPRESSION.NONE,
      payload
    )
  }

  // Encode audio data packet
  static encodeAudioPacket(audioData, isLast = false) {
    const flags = isLast ? this.FLAGS.LAST_PACKET_NO_SEQ : this.FLAGS.NO_SEQUENCE
    return this.encodeMessage(
      this.MESSAGE_TYPE.AUDIO_ONLY_REQUEST,
      flags,
      this.SERIALIZATION.NONE,
      this.COMPRESSION.NONE,
      audioData
    )
  }

  // Generic message encoder
  static encodeMessage(messageType, flags, serialization, compression, payload) {
    // Create header (4 bytes)
    const header = Buffer.alloc(4)

    // Byte 0: [4 bits: protocol version] [4 bits: header size]
    header[0] = (this.PROTOCOL_VERSION << 4) | this.HEADER_SIZE

    // Byte 1: [4 bits: message type] [4 bits: flags]
    header[1] = (messageType << 4) | flags

    // Byte 2: [4 bits: serialization] [4 bits: compression]
    header[2] = (serialization << 4) | compression

    // Byte 3: Reserved
    header[3] = 0x00

    // Payload size (4 bytes, big-endian)
    const payloadSize = Buffer.alloc(4)
    payloadSize.writeUInt32BE(payload.length, 0)

    // Combine: header + payload size + payload
    return Buffer.concat([header, payloadSize, payload])
  }

  // Decode server response
  static decodeMessage(buffer) {
    if (buffer.length < 12) {
      throw new Error('Invalid message: too short')
    }

    // Parse header
    const protocolVersion = (buffer[0] >> 4) & 0x0F
    const headerSize = (buffer[0] & 0x0F) * 4
    const messageType = (buffer[1] >> 4) & 0x0F
    const flags = buffer[1] & 0x0F
    const serialization = (buffer[2] >> 4) & 0x0F
    const compression = buffer[2] & 0x0F

    // Parse sequence number (4 bytes at position 4)
    const sequenceNumber = buffer.readUInt32BE(4)

    // Parse payload size (4 bytes at position 8)
    const payloadSize = buffer.readUInt32BE(8)

    // Extract payload (starts at position 12)
    const payload = buffer.slice(12, 12 + payloadSize)

    // Decode payload based on message type
    let decodedPayload = payload
    if (messageType === this.MESSAGE_TYPE.FULL_SERVER_RESPONSE && serialization === this.SERIALIZATION.JSON) {
      decodedPayload = JSON.parse(payload.toString('utf8'))
    } else if (messageType === this.MESSAGE_TYPE.ERROR) {
      decodedPayload = JSON.parse(payload.toString('utf8'))
    }

    return {
      messageType,
      flags,
      serialization,
      compression,
      sequenceNumber,
      payload: decodedPayload
    }
  }
}

module.exports = DoubaoProtocol
