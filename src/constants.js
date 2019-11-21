const TaskType = {
  CpuProfile: 'cpuProfile',
  HeapSnapshot: 'heapSnapshot',
};

const TaskEvent = {
  CpuProfileCreated: 'cpuProfileCreated',
  HeapSnapshotCreated: 'heapSnapshotCreated',
};

const CpuProfileFileExt = 'cpuprofile';
const HeapSnapshotFileExt = 'heapsnapshot';

module.exports = {
  TaskType,
  TaskEvent,
  CpuProfileFileExt,
  HeapSnapshotFileExt,
};
