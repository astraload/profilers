import { EventEmitter } from 'events';

export class CpuProfiler {
  isProfiling(): boolean;
  setProfiling(value: boolean): void;

  profile(
    duration: number,
    samplingInterval: number
  ): Promise<{ fileName: string; filePath: string }>;

  scheduleTask(
    instanceName: string,
    duration: number,
    samplingInterval: number
  ): Promise<void>;
}

export class HeapDumper {
  isDumping(): boolean;
  setDumping(value: boolean): void;
  takeSnapshot(): Promise<{ fileName: string; filePath: string }>;
  scheduleTask(instanceName: string): Promise<void>;
}

export class Profilers extends EventEmitter {
  cpu: CpuProfiler;
  heap: HeapDumper;
  startObserving(instanceName: string): void;
  stopObserving(): void;
}

export enum TaskEvent {
  CpuProfileCreated = 'cpuProfileCreated',
  HeapSnapshotCreated = 'heapSnapshotCreated',
}

export function logInColor(message: string): void;
export const CpuProfileFileExt: 'cpuprofile';
export const HeapSnapshotFileExt: 'heapsnapshot';
