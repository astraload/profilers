import fs from 'node:fs/promises';
import { Session } from 'node:inspector/promises';
import { insertTask } from './collection.js';
import { TaskType, CpuProfileFileExt } from './constants.js';
import { logInColor, generateId } from './helpers.js';

const DefaultDuration = 60 * 1000;


export class CpuProfiler {
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


  async profile(duration, samplingInterval) {
    const session = new Session();
    session.connect();
    await session.post('Profiler.enable');

    if (samplingInterval) {
      await session.post('Profiler.setSamplingInterval', {
        interval: samplingInterval,
      });
    }

    await session.post('Profiler.start');
    const id = generateId();
    this.logOperation(id, 'started');

    return new Promise((resolve, reject) => {
      const delay = duration || DefaultDuration;
      setTimeout(async () => {
        try {
          const { profile } = await session.post('Profiler.stop');
          this.logOperation(id, 'finished');
          const { fileName, filePath } = await this.saveProfile(profile, id);
          session.disconnect();
          resolve({ fileName, filePath });
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  }

  async saveProfile(profile, id) {
    try {
      const fileName = this.getFileNameById(id);
      const filePath = this.getFilePathByName(fileName);
      await fs.writeFile(filePath, JSON.stringify(profile));
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
