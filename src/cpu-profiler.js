const fs = require('fs');
const v8Profiler = require('v8-profiler-next');
const { insertTask } = require('./collection');
const { TaskType, CpuProfileFileExt } = require('./constants');
const { logInColor, generateId } = require('./helpers');

const DefaultDuration = 60 * 1000;


class CpuProfiler {
  constructor() {
    this.profiling = false;
  }


  isProfiling() {
    return this.profiling;
  }


  setProfiling(value) {
    this.profiling = Boolean(value);
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

      const id = generateId();
      v8Profiler.startProfiling(id);
      this.logOperation(id, 'started');
      const delay = duration || DefaultDuration;

      Meteor.setTimeout(() => {
        const profile = v8Profiler.stopProfiling(id);
        this.logOperation(id, 'finished');
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
      const writeFileFiber = Meteor.wrapAsync(fs.writeFile, fs);
      writeFileFiber(filePath, result);
      return { fileName, filePath };
    } catch (error) {
      console.error(`Failed to save CPU profile (${id})`, error);
      return {};
    }
  }


  getFileNameById(id) {
    return `${id}.${CpuProfileFileExt}`;
  }


  getFilePathByName(fileName) {
    return `/tmp/${fileName}`;
  }


  logOperation(id, operation) {
    const message = `Profiling of CPU (${id}) ${operation}`;
    logInColor(message);
  }
}


module.exports = { CpuProfiler };
