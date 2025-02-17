import { EventEmitter } from 'events';
import { CpuProfiler } from './cpu-profiler.js';
import { HeapDumper } from './heap-dumper.js';
import { getCollection, removeTask } from './collection.js';
import { TaskType, TaskEvent } from './constants.js';
import { logInColor } from './helpers.js';


let profilersInstance = null;


export class Profilers extends EventEmitter {
  constructor() {
    if (profilersInstance) return profilersInstance;
    super();
    this.cpu = new CpuProfiler();
    this.heap = new HeapDumper();
    this.observerHandle = null;
    this.handleTaskAdded = this.handleTaskAdded.bind(this);
    profilersInstance = this;
  }


  startObserving(instanceName) {
    if (this.observerHandle) this.stopObserving();
    this.observerHandle = getCollection()
      .find({ instanceName })
      .observeChanges({ added: this.handleTaskAdded });
  }


  stopObserving() {
    if (!this.observerHandle) return;
    this.observerHandle.stop();
  }


  async handleTaskAdded(id, task) {
    const { instanceName, taskType, duration, samplingInterval } = task || {};
    await removeTask(id);
    switch (taskType) {
      case TaskType.CpuProfile: {
        this.handleCpuProfileTask(instanceName, duration, samplingInterval);
        break;
      }
      case TaskType.HeapSnapshot: {
        this.handleHeapSnapshotTask(instanceName);
        break;
      }
      default:
        console.error('Profilers.UnknownTaskType', taskType);
    }
  }


  async handleCpuProfileTask(instanceName, duration, samplingInterval) {
    if (this.cpu.isProfiling()) {
      logInColor('Skipping a task (CPU profiling is already in progress)');
      return;
    }
    this.cpu.setProfiling(true);
    try {
      const { fileName, filePath } = await this.cpu.profile(duration, samplingInterval);
      this.emit(TaskEvent.CpuProfileCreated, { instanceName, fileName, filePath });
    } catch (error) {
      console.error('Profilers.cpu.profile.failed', error);
    }
    this.cpu.setProfiling(false);
  }


  async handleHeapSnapshotTask(instanceName) {
    if (this.heap.isDumping()) {
      logInColor('Skipping a task (Writing of heap snapshot is already in progress)');
      return;
    }
    this.heap.setDumping(true);
    try {
      const { fileName, filePath } = await this.heap.takeSnapshot();
      this.emit(TaskEvent.HeapSnapshotCreated, { instanceName, fileName, filePath });
    } catch (error) {
      console.error('Profilers.heap.takeSnapshot.failed', error);
    }
    this.heap.setDumping(false);
  }
}
