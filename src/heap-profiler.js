const heapdump = require('heapdump');
const { insertTask } = require('./collection');
const { TaskType } = require('./constants');
const { logInColor } = require('./helpers');


class HeapProfiler {
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
    const id = new Mongo.ObjectID().valueOf();
    const fileName = this.getFileNameById(id);
    const filePath = this.getFilePathByName(fileName);
    const writeSnapshotFiber = Meteor.wrapAsync(heapdump.writeSnapshot, heapdump);
    this.logOperation(id, 'started');
    writeSnapshotFiber(filePath);
    this.logOperation(id, 'finished');
    return { fileName, filePath };
  }


  getFileNameById(id) {
    return `${id}.heapsnapshot`;
  }


  getFilePathByName(fileName) {
    return `/tmp/${fileName}`;
  }


  logOperation(id, operation) {
    const message = `Writing of heap snapshot (${id}) ${operation}`;
    logInColor(message);
  }
}


module.exports = { HeapProfiler };
