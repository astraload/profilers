const EventEmitter = require('events');
const { CpuProfiler } = require('./cpu-profiler');
const { HeapProfiler } = require('./heap-dumper');
const { getCollection, removeTask } = require('./collection');
const { TaskType, TaskEvent } = require('./constants');
const { logInColor } = require('./helpers');


let profilersInstance = null;


class Profilers extends EventEmitter {
  constructor() {
    super();
    if (profilersInstance) return profilersInstance;
    this.cpu = new CpuProfiler();
    this.heap = new HeapProfiler();
    this.observerHandle = null;
    this.handleTaskAdded = this.handleTaskAdded.bind(this);
    this.removeTask = Meteor.bindEnvironment(removeTask);
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
    try {
      const { instanceName, taskType, duration, samplingInterval } = task || {};
      this.removeTask(id);
      switch (taskType) {
        case TaskType.CpuProfile: {
          await this.handleCpuProfileTask(instanceName, duration, samplingInterval);
          break;
        }
        case TaskType.HeapSnapshot: {
          this.handleHeapSnapshotTask(instanceName);
          break;
        }
        default:
          console.error('Profilers.UnknownTaskType', taskType);
      }
    } catch (error) {
      console.error('Profilers.handleTaskAdded.failed', error);
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


  handleHeapSnapshotTask(instanceName) {
    if (this.heap.isDumping()) {
      logInColor('Skipping a task (Writing of heap snapshot is already in progress)');
      return;
    }
    this.heap.setDumping(true);
    try {
      const { fileName, filePath } = this.heap.snapshot();
      this.emit(TaskEvent.HeapSnapshotCreated, { instanceName, fileName, filePath });
    } catch (error) {
      console.error('Profilers.heap.snapshot.failed', error);
    }
    this.heap.setDumping(false);
  }
}


module.exports = { Profilers };
