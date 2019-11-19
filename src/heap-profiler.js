const EventEmitter = require('events');
const heapdump = require('heapdump');
const { insertTask } = require('./collection');
const { TaskType } = require('./constants');


class HeapProfiler extends EventEmitter {
  constructor() {
    super();
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
    console.log(`Writing of heap snapshot (${id}) started`);
    writeSnapshotFiber(filePath);
    console.log(`Writing of heap snapshot (${id}) finished`);
    return { fileName, filePath };
  }

  getFileNameById(id) {
    return `${id}.heapsnapshot`;
  }

  getFilePathByName(fileName) {
    return `/tmp/${fileName}`;
  }
}


module.exports = { HeapProfiler };
