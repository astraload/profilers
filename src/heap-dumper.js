const fs = require('fs');
const v8Profiler = require('v8-profiler-next');
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


  takeSnapshot() {
    const id = generateId();
    let snapshot;
    try {
      this.logOperation(id, 'started');
      snapshot = v8Profiler.takeSnapshot();
      this.logOperation(id, 'finished');
      return this.saveSnapshot(snapshot, id);
    } catch (error) {
      console.error(`Failed to take heap snapshot (${id})`, error);
      return {};
    } finally {
      if (snapshot) snapshot.delete();
    }
  }


  saveSnapshot(snapshot, id) {
    try {
      const snapshotExportFiber = Meteor.wrapAsync(snapshot.export, snapshot);
      const result = snapshotExportFiber();
      const fileName = this.getFileNameById(id);
      const filePath = this.getFilePathByName(fileName);
      const writeFileFiber = Meteor.wrapAsync(fs.writeFile, fs);
      writeFileFiber(filePath, result);
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
