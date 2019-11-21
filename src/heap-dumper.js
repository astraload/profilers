const heapdump = require('heapdump');
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
    const fileName = this.getFileNameById(id);
    const filePath = this.getFilePathByName(fileName);
    const writeSnapshotFiber = Meteor.wrapAsync(heapdump.writeSnapshot, heapdump);
    this.logOperation(id, 'started');
    writeSnapshotFiber(filePath);
    this.logOperation(id, 'finished');
    return { fileName, filePath };
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
