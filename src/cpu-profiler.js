const EventEmitter = require('events');
const fs = require('fs');
const v8Profiler = require('v8-profiler-node8');
const { insertTask } = require('./collection');
const { TaskType } = require('./constants');

const DefaultDuration = 60 * 1000;


class CpuProfiler extends EventEmitter {
  constructor() {
    super();
  }


  scheduleTask(instanceName, duration, samplingInterval) {
    insertTask({
      instanceName,
      duration,
      samplingInterval,
      taskType: TaskType.CpuProfile,
    });
  }


  profile(duration, samplingInterval) {
    return new Promise((resolve) => {
      if (samplingInterval) {
        v8Profiler.setSamplingInterval(samplingInterval);
      }

      const id = new Mongo.ObjectID().valueOf();
      v8Profiler.startProfiling(id);
      console.log(`Profiling CPU (${id}) started`);
      const delay = duration || DefaultDuration;

      Meteor.setTimeout(() => {
        const profile = v8Profiler.stopProfiling(id);
        console.log(`Profiling CPU (${id}) finished`);
        const { fileName, filePath } = this.saveProfile(profile, id);
        profile.delete();
        resolve({ fileName, filePath });
      }, delay);
    });
  }


  saveProfile(profile, id) {
    try {
      const profileExportFiber = Meteor.wrapAsync(profile.export, profile);
      const result = profileExportFiber();
      const fileName = this.getFileNameById(id);
      const filePath = this.getFilePathByName(fileName);
      fs.writeFileSync(filePath, result);
      return { fileName, filePath };
    } catch (error) {
      console.error(`Failed to save CPU profile (${id})`, error);
      return {};
    }
  }


  getFileNameById(id) {
    return `${id}.cpuprofile`;
  }


  getFilePathByName(fileName) {
    return `/tmp/${fileName}`;
  }
}


module.exports = { CpuProfiler };
