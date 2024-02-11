const fs = require('fs');
const { REDIS_MAIN, OP_CODES, VALUE_TYPE } = require('./constants');

class RedisRdbEncoder {
  constructor(filePath) {
    this.filePath = filePath;
  }

  encode() {
    if (!fs.existsSync(this.filePath)) {
      return '*0\r\n';
    }

    const buffer = fs.readFileSync(this.filePath);
    if (!this.isValidRdb(buffer)) {
      throw new Error('Invalid RDB file');
    }

    const keys = this.extractKeys(buffer);
    return this.encodeRespArrays(keys);
  }

  isValidRdb(buffer) {
    const magicString = buffer.toString(
      'utf-8',
      0,
      REDIS_MAIN.REDIS_MAGIC_STRING
    );
    const version = parseInt(
      buffer.toString(
        'utf-8',
        REDIS_MAIN.REDIS_MAGIC_STRING,
        REDIS_MAIN.REDIS_MAGIC_STRING + REDIS_MAIN.RDB_VERSION
      )
    );
    return magicString === 'REDIS' && version === 4;
  }

  extractKeys(buffer) {
    const keys = [];
    let counter = REDIS_MAIN.REDIS_MAGIC_STRING + REDIS_MAIN.RDB_VERSION;

    while (counter < buffer.length) {
      const opCode = buffer[counter++];

      if (opCode === OP_CODES.EOF) {
        break;
      } else if (this.isKeyValueType(opCode)) {
        const keyLength = this.extractKeyLength(buffer, counter);
        const key = buffer.toString('utf-8', counter, counter + keyLength);
        keys.push(key);
        counter += keyLength;
      }
    }

    return keys;
  }

  isKeyValueType(opCode) {
    return Object.values(VALUE_TYPE).includes(opCode);
  }

  extractKeyLength(buffer, counter) {
    return buffer[counter];
  }

  encodeRespArrays(keys) {
    if (keys.length === 0) {
      return '*0\r\n';
    }

    return keys.map((key) => `*1\r\n$${key.length}\r\n${key}\r\n`).join('');
  }
}

module.exports = RedisRdbEncoder;
