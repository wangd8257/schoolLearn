/*
 * Local raw DEFLATE decoder adapted from fflate 0.8.2.
 * Copyright (c) 2023 Arjun Barrett
 * SPDX-License-Identifier: MIT
 */

const u8 = Uint8Array;
const u16 = Uint16Array;
const i32 = Int32Array;

const fleb = new u8([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, 0, 0]);
const fdeb = new u8([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, 0, 0]);
const clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);

function freb(extraBits, start) {
  const base = new u16(31);
  for (let index = 0; index < 31; index += 1) base[index] = start += 1 << extraBits[index - 1];
  const reverseBase = new i32(base[30]);
  for (let index = 1; index < 30; index += 1) {
    for (let value = base[index]; value < base[index + 1]; value += 1) {
      reverseBase[value] = ((value - base[index]) << 5) | index;
    }
  }
  return { base, reverseBase };
}

const lengthTables = freb(fleb, 2);
const fl = lengthTables.base;
const distanceTables = freb(fdeb, 0);
const fd = distanceTables.base;

const reverseBits = new u16(32768);
for (let index = 0; index < 32768; index += 1) {
  let value = ((index & 0xaaaa) >> 1) | ((index & 0x5555) << 1);
  value = ((value & 0xcccc) >> 2) | ((value & 0x3333) << 2);
  value = ((value & 0xf0f0) >> 4) | ((value & 0x0f0f) << 4);
  reverseBits[index] = (((value & 0xff00) >> 8) | ((value & 0x00ff) << 8)) >> 1;
}

function hMap(codeLengths, maxBits, reverse) {
  const size = codeLengths.length;
  const counts = new u16(maxBits);
  for (let index = 0; index < size; index += 1) {
    if (codeLengths[index]) counts[codeLengths[index] - 1] += 1;
  }
  const minimumCodes = new u16(maxBits);
  for (let index = 1; index < maxBits; index += 1) {
    minimumCodes[index] = (minimumCodes[index - 1] + counts[index - 1]) << 1;
  }
  if (!reverse) {
    const map = new u16(size);
    for (let index = 0; index < size; index += 1) {
      if (codeLengths[index]) map[index] = reverseBits[minimumCodes[codeLengths[index] - 1]++] >> (15 - codeLengths[index]);
    }
    return map;
  }
  const map = new u16(1 << maxBits);
  const reverseBitsToRemove = 15 - maxBits;
  for (let index = 0; index < size; index += 1) {
    if (!codeLengths[index]) continue;
    const symbolAndBits = (index << 4) | codeLengths[index];
    const freeBits = maxBits - codeLengths[index];
    let value = minimumCodes[codeLengths[index] - 1]++ << freeBits;
    const end = value | ((1 << freeBits) - 1);
    for (; value <= end; value += 1) map[reverseBits[value] >> reverseBitsToRemove] = symbolAndBits;
  }
  return map;
}

const fixedLengthTree = new u8(288);
for (let index = 0; index < 144; index += 1) fixedLengthTree[index] = 8;
for (let index = 144; index < 256; index += 1) fixedLengthTree[index] = 9;
for (let index = 256; index < 280; index += 1) fixedLengthTree[index] = 7;
for (let index = 280; index < 288; index += 1) fixedLengthTree[index] = 8;
const fixedDistanceTree = new u8(32);
for (let index = 0; index < 32; index += 1) fixedDistanceTree[index] = 5;
const fixedLengthMap = hMap(fixedLengthTree, 9, true);
const fixedDistanceMap = hMap(fixedDistanceTree, 5, true);

function maxValue(values) {
  let max = values[0];
  for (let index = 1; index < values.length; index += 1) {
    if (values[index] > max) max = values[index];
  }
  return max;
}

function bits(data, position, mask) {
  const offset = (position / 8) | 0;
  return ((data[offset] | (data[offset + 1] << 8)) >> (position & 7)) & mask;
}

function bits16(data, position) {
  const offset = (position / 8) | 0;
  return (data[offset] | (data[offset + 1] << 8) | (data[offset + 2] << 16)) >> (position & 7);
}

function bytePosition(position) {
  return ((position + 7) / 8) | 0;
}

function copyBytes(value, start, end) {
  return new u8(value.subarray(start, end));
}

/**
 * 解压 ZIP entry 使用的 raw DEFLATE 字节。
 * @param {Uint8Array} data 压缩后的 raw DEFLATE 数据。
 * @param {number} [expectedSize] ZIP 中声明的解压后长度，用于减少重复扩容。
 * @returns {Uint8Array} 解压后的字节。
 */
export function inflateRawSync(data, expectedSize) {
  const sourceLength = data.length;
  if (!sourceLength) return new u8(0);
  const output = expectedSize > 0 ? new u8(expectedSize) : null;
  const noOutput = !output;
  const resize = noOutput;
  let buffer = output || new u8(sourceLength * 3);
  const ensureCapacity = (length) => {
    if (length <= buffer.length) return;
    const next = new u8(Math.max(buffer.length * 2, length));
    next.set(buffer);
    buffer = next;
  };
  let final = 0;
  let position = 0;
  let written = 0;
  let lengthMap;
  let distanceMap;
  let lengthBits = 0;
  let distanceBits = 0;
  const totalBits = sourceLength * 8;

  do {
    if (!lengthMap) {
      final = bits(data, position, 1);
      const type = bits(data, position + 1, 3);
      position += 3;
      if (type === 0) {
        const start = bytePosition(position) + 4;
        const length = data[start - 4] | (data[start - 3] << 8);
        const end = start + length;
        if (end > sourceLength) throw new Error('Invalid raw DEFLATE block');
        if (resize) ensureCapacity(written + length);
        buffer.set(data.subarray(start, end), written);
        written += length;
        position = end * 8;
        continue;
      }
      if (type === 1) {
        lengthMap = fixedLengthMap;
        distanceMap = fixedDistanceMap;
        lengthBits = 9;
        distanceBits = 5;
      } else if (type === 2) {
        const literalCount = bits(data, position, 31) + 257;
        const distanceCount = bits(data, position + 5, 31) + 1;
        const codeLengthCount = bits(data, position + 10, 15) + 4;
        const totalCodes = literalCount + distanceCount;
        position += 14;
        const lengths = new u8(totalCodes);
        const codeLengths = new u8(19);
        for (let index = 0; index < codeLengthCount; index += 1) codeLengths[clim[index]] = bits(data, position + index * 3, 7);
        position += codeLengthCount * 3;
        const codeLengthBits = maxValue(codeLengths);
        const codeLengthMap = hMap(codeLengths, codeLengthBits, true);
        const codeLengthMask = (1 << codeLengthBits) - 1;
        for (let index = 0; index < totalCodes;) {
          const code = codeLengthMap[bits(data, position, codeLengthMask)];
          position += code & 15;
          const symbol = code >> 4;
          if (symbol < 16) {
            lengths[index] = symbol;
            index += 1;
            continue;
          }
          let count = 0;
          let repeatedLength = 0;
          if (symbol === 16) {
            count = 3 + bits(data, position, 3);
            position += 2;
            repeatedLength = lengths[index - 1];
          } else if (symbol === 17) {
            count = 3 + bits(data, position, 7);
            position += 3;
          } else if (symbol === 18) {
            count = 11 + bits(data, position, 127);
            position += 7;
          } else {
            throw new Error('Invalid DEFLATE code length');
          }
          while (count--) {
            lengths[index] = repeatedLength;
            index += 1;
          }
        }
        const lengthTree = lengths.subarray(0, literalCount);
        const distanceTree = lengths.subarray(literalCount);
        lengthBits = maxValue(lengthTree);
        distanceBits = maxValue(distanceTree);
        lengthMap = hMap(lengthTree, lengthBits, true);
        distanceMap = hMap(distanceTree, distanceBits, true);
      } else {
        throw new Error('Invalid DEFLATE block type');
      }
      if (position > totalBits) throw new Error('Unexpected end of raw DEFLATE data');
    }
    if (resize) ensureCapacity(written + 131072);
    const lengthMask = (1 << lengthBits) - 1;
    const distanceMask = (1 << distanceBits) - 1;
    while (true) {
      const code = lengthMap[bits16(data, position) & lengthMask];
      const symbol = code >> 4;
      position += code & 15;
      if (position > totalBits || !code) throw new Error('Invalid DEFLATE length code');
      if (symbol < 256) {
        buffer[written] = symbol;
        written += 1;
      } else if (symbol === 256) {
        lengthMap = null;
        break;
      } else {
        let length = symbol - 254;
        if (symbol > 264) {
          const index = symbol - 257;
          const extraBits = fleb[index];
          length = bits(data, position, (1 << extraBits) - 1) + fl[index];
          position += extraBits;
        }
        const distanceCode = distanceMap[bits16(data, position) & distanceMask];
        const distanceSymbol = distanceCode >> 4;
        if (!distanceCode) throw new Error('Invalid DEFLATE distance code');
        position += distanceCode & 15;
        let distance = fd[distanceSymbol];
        if (distanceSymbol > 3) {
          const extraBits = fdeb[distanceSymbol];
          distance += bits16(data, position) & ((1 << extraBits) - 1);
          position += extraBits;
        }
        if (position > totalBits || distance > written) throw new Error('Invalid DEFLATE distance');
        if (resize) ensureCapacity(written + length);
        const end = written + length;
        for (; written < end; written += 1) buffer[written] = buffer[written - distance];
      }
    }
  } while (!final);

  return noOutput ? copyBytes(buffer, 0, written) : buffer.subarray(0, written);
}
