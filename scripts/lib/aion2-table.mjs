/**
 * Чтение расшифрованных таблиц клиента Aion 2 (raw/client/<сборка>/tables/<тема>/<Имя>.bin).
 *
 * Формат (по CUE4Parse/GameTypes/Aion2): int32 версия, FString со списком id,
 * затем массив строк таблицы без имён полей. Порядок и типы полей мы восстанавливаем
 * вручную для каждой нужной таблицы (см. scripts/extract-tables.mjs).
 *
 * Строки UTF-16 записаны с отрицательной длиной и XOR-ключом 25 00 A8 00 7E 00 91 00.
 */
import { readFileSync } from 'node:fs';

const XOR = [0x25, 0x00, 0xa8, 0x00, 0x7e, 0x00, 0x91, 0x00];

export class TableReader {
  constructor(path) {
    this.b = readFileSync(path);
    this.p = 0;
    this.version = this.i32();
    this.ids = this.str();
  }

  get done() {
    return this.p >= this.b.length;
  }

  u8() {
    return this.b[this.p++];
  }

  u16() {
    const v = this.b.readUInt16LE(this.p);
    this.p += 2;
    return v;
  }

  i16() {
    const v = this.b.readInt16LE(this.p);
    this.p += 2;
    return v;
  }

  i32() {
    const v = this.b.readInt32LE(this.p);
    this.p += 4;
    return v;
  }

  i64() {
    const v = Number(this.b.readBigInt64LE(this.p));
    this.p += 8;
    return v;
  }

  str() {
    const len = this.i32();
    if (len === 0) return '';
    if (len > 0) {
      const s = this.b.subarray(this.p, this.p + len - 1).toString('utf8');
      this.p += len;
      return s;
    }
    const n = -len * 2;
    const buf = Buffer.from(this.b.subarray(this.p, this.p + n - 2));
    this.p += n;
    for (let i = 0; i < buf.length; i++) buf[i] ^= XOR[i % 8];
    return buf.toString('utf16le');
  }

  /** Значение enum записано строкой «EType::Value» — возвращаем Value. */
  enumValue() {
    const s = this.str();
    const i = s.indexOf('::');
    return i === -1 ? s : s.slice(i + 2);
  }

  /** Заголовок вложенного массива структур: имя, тип, размер, имя структуры, guid, флаг. */
  structTag() {
    this.str();
    this.str();
    this.p += 8;
    this.str();
    this.p += 16;
    if (this.u8()) this.p += 16;
  }

  skip(n) {
    this.p += n;
  }
}
