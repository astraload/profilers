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


  async scheduleTask(instanceName, duration, samplingInterval) {
    await insertTask({
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

      setTimeout(async () => {
        const profile = v8Profiler.stopProfiling(id);
        this.logOperation(id, 'finished');
        const { fileName, filePath } = await this.saveProfile(profile, id);
        profile.delete();
        resolve({ fileName, filePath });
      }, delay);
    });
  }


  saveProfile(profile, id) {
    return new Promise((resolve) => {
      profile.export((error, result) => {
        if (error) {
          console.error(`Failed to save CPU profile (${id})`, error);
          return resolve({});
        }

        const fileName = this.getFileNameById(id);
        const filePath = this.getFilePathByName(fileName);

        fs.writeFile(filePath, result, (error) => {
          if (error) {
            console.error(`Failed to save CPU profile (${id})`, error);
            return resolve({});
          }

          resolve({ fileName, filePath });
        });
      });
    });
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
