// src/types/Pin.ts
export interface Pin {
  id: string;
  file: string;
  line: number;
  description: string;
  createdAt: Date;
}

export interface PinStorage {
  pins: Pin[];
  lastId: number;
}

export type PinEvent = 'added' | 'removed' | 'updated' | 'cleared';