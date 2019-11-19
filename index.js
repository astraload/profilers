const { CpuProfiler } = require('./src/cpu-profiler');
const { HeapProfiler } = require('./src/heap-profiler');
const { InstanceTasks, removeTask } = require('./src/collection');
const { TaskType, TaskEvent } = require('./src/constants');


let profilersInstance = null;


class Profilers {
  constructor() {
    if (profilersInstance) return profilersInstance;
    this.instanceName = '';
    this.cpu = new CpuProfiler();
    this.heap = new HeapProfiler();
    this.profilingCpu = false;
    this.dumpingHeap = false;
    this.observerHandle = null;
    this.handleTaskAdded = this.handleTaskAdded.bind(this);
    this.removeTask = Meteor.bindEnvironment(removeTask);
    profilersInstance = this;
  }


  startObserving(instanceName) {
    if (this.observerHandle) this.stopObserving();
    this.instanceName = instanceName;
    this.observerHandle = InstanceTasks
      .find({ instanceName: this.instanceName })
      .observeChanges({
        added: this.handleTaskAdded,
      });
  }


  stopObserving() {
    if (!this.observerHandle) return;
    this.observerHandle.stop();
  }


  async handleTaskAdded(id, task) {
    try {
      const { instanceName, taskType, duration, samplingInterval } = task || {};
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
          console.error('Unknown task type', taskType);
      }
      this.removeTask(id);
    } catch (error) {
      console.error('Profilers.handleTaskAdded.failed', error);
    }
  }


  async handleCpuProfileTask(instanceName, duration, samplingInterval) {
    if (this.profilingCpu) return;
    this.profilingCpu = true;
    try {
      const { fileName, filePath } = await this.cpu.profile(duration, samplingInterval);
      this.cpu.emit(TaskEvent.CpuProfileCreated, { instanceName, fileName, filePath });
    } catch (error) {
      console.error('Profilers.cpu.profile.failed', error);
    }
    this.profilingCpu = false;
  }


  handleHeapSnapshotTask(instanceName) {
    if (this.dumpingHeap) return;
    this.dumpingHeap = true;
    try {
      const { fileName, filePath } = this.heap.snapshot();
      this.heap.emit(TaskEvent.HeapSnapshotCreated, { instanceName, fileName, filePath });
    } catch (error) {
      console.error('Profilers.heap.snapshot.failed', error);
    }
    this.dumpingHeap = false;
  }
}


module.exports = {
  Profilers,
  TaskEvent,
};
