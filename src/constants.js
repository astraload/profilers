const TaskType = {
  CpuProfile: 'cpuProfile',
  HeapSnapshot: 'heapSnapshot',
};

const TaskEvent = {
  CpuProfileCreated: 'cpuProfileCreated',
  HeapSnapshotCreated: 'heapSnapshotCreated',
};

module.exports = {
  TaskType,
  TaskEvent,
};
