const fs = require('fs');
const v8Profiler = require('v8-profiler-node8');
const { insertTask } = require('./collection');
const { TaskType, HeapSnapshotFileExt } = require('./constants');
const { logInColor, generateId } = require('./helpers');


class HeapDumper {
  constructor() {
    this.dumping = false;
  }


  isDumping() {
    return this.dumping;
  }


  setDumping(value) {
    this.dumping = Boolean(value);
  }


  scheduleTask(instanceName) {
    insertTask({
      instanceName,
      taskType: TaskType.HeapSnapshot,
    });
  }


  snapshot() {
    const id = generateId();
    this.logOperation(id, 'started');
    const snapshot = v8Profiler.takeSnapshot();
    this.logOperation(id, 'finished');
    const { fileName, filePath } = this.saveSnapshot(snapshot, id);
    snapshot.delete();
    return { fileName, filePath };
  }


  saveSnapshot(snapshot, id) {
    try {
      const snapshotExportFiber = Meteor.wrapAsync(snapshot.export, snapshot);
      const result = snapshotExportFiber();
      const fileName = this.getFileNameById(id);
      const filePath = this.getFilePathByName(fileName);
      fs.writeFileSync(filePath, result);
      return { fileName, filePath };
    } catch (error) {
      console.error(`Failed to save heap snapshot (${id})`, error);
      return {};
    }
  }


  getFileNameById(id) {
    return `${id}.${HeapSnapshotFileExt}`;
  }


  getFilePathByName(fileName) {
    return `/tmp/${fileName}`;
  }


  logOperation(id, operation) {
    const message = `Writing of heap snapshot (${id}) ${operation}`;
    logInColor(message);
  }
}


module.exports = { HeapDumper };
