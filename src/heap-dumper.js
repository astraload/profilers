import fs from 'node:fs';
import { Session } from 'node:inspector/promises';
import { insertTask } from './collection.js';
import { TaskType, HeapSnapshotFileExt } from './constants.js';
import { logInColor, generateId } from './helpers.js';


export class HeapDumper {
  constructor() {
    this.dumping = false;
  }


  isDumping() {
    return this.dumping;
  }


  setDumping(value) {
    this.dumping = Boolean(value);
  }


  async scheduleTask(instanceName) {
    await insertTask({
      instanceName,
      taskType: TaskType.HeapSnapshot,
    });
  }


  async takeSnapshot() {
    let fileDescriptor;
    const session = new Session();
    try {
      const id = generateId();
      const fileName = this.getFileNameById(id);
      const filePath = this.getFilePathByName(fileName);
      fileDescriptor = fs.openSync(filePath, 'w');

      session.connect();
      await session.post('HeapProfiler.enable');

      session.on('HeapProfiler.addHeapSnapshotChunk', (message) => {
        fs.writeSync(fileDescriptor, message.params.chunk);
      });

      this.logOperation(id, 'started');
      await session.post('HeapProfiler.takeHeapSnapshot', null);
      this.logOperation(id, 'finished');

      return { fileName, filePath };
    } catch (error) {
      console.error(`Failed to take heap snapshot (${id})`, error);
      return {};
    } finally {
      session.disconnect();
      if (fileDescriptor) fs.closeSync(fileDescriptor);
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
