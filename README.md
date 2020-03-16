# @astraload/profilers
CPU profiler and heap dumper for multi-instance Meteor web apps

## Installation
```sh
npm install @astraload/profilers
```

## Basic usage
```js
import { Profilers } from '@astraload/profilers';
const profilers = new Profilers();
```
It will create an instance of the Profilers class. The Profilers is a singleton class, so there always will be just a single instance of this class. The class is made singleton to prevent overlapping of CPU profiling/taking heap snapshot tasks.

An example of creating a CPU profile:
```js
async function createCpuProfile(duration, samplingInterval) {
  const profilers = new Profilers();
  const { fileName, filePath } = await profilers.cpu.profile(duration, samplingInterval);
  return { fileName, filePath };
};
```
An example of creating a heap snapshot:
```js
function takeHeapSnapshot() {
  const profilers = new Profilers();
  const { fileName, filePath } = profilers.heap.takeSnapshot();
  return { fileName, filePath };
};
```
The resulting file is located in `/tmp` folder and its name consists of 12 random characters.


## Advanced usage

This package allows creating CPU profiles and heap snapshots in a multi-instance Meteor web apps setup. To do so, the package utilizes an auxiliary MongoDB collection `instanceTasks`. Each Meteor web app instance needs to call `profilers.startObserving(instanceName)` in its startup hook to start an observer of the `instanceTasks` collection. When a new task is added to that collection, it will trigger the corresponding creation of a CPU profile or a heap snapshot:

```js
import { Meteor } from 'meteor/meteor';
import { Profilers, TaskEvent } from '@astraload/profilers';

Meteor.startup(() => {
  const profilers = new Profilers();
  profilers.on(TaskEvent.CpuProfileCreated, handleFileCreated);
  profilers.on(TaskEvent.HeapSnapshotCreated, handleFileCreated);
  const instanceName = getInstanceName();
  profilers.startObserving(instanceName);
});

function handleFileCreated({ instanceName, fileName, filePath }) {
  /* Do whatever you need with created file */
}

function getInstanceName() {
  /* return a unique identifier of the web app instance */
}
```
Also, in the startup hook, you may want to register handlers for `TaskEvent.CpuProfileCreated` and `TaskEvent.HeapSnapshotCreated` events. In the handlers, you may want to upload the resulting files to cloud storage for later inspection or do something else.

Now, as each web app instance started the observer of the `instanceTasks` collection, we can trigger the creation of a CPU profile or a heap snapshot of a particular web app instance, by calling `scheduleTask(instanceName)` method like so:

```js
function createCpuProfile(duration, samplingInterval) {
  const profilers = new Profilers();
  const instanceName = getInstanceName();
  profilers.cpu.scheduleTask(instanceName, duration, samplingInterval);
};

function takeHeapSnapshot() {
  const profilers = new Profilers();
  const instanceName = getInstanceName();
  profilers.heap.scheduleTask(instanceName);
};

function getInstanceName() {
  /* return a unique identifier of the web app instance */
}
```

You may want to define corresponding Meteor methods in the web app to be able to trigger the creation of a CPU profile or a heap snapshot of a particular web app instance at an arbitrary point in time. When the resulting file is created the corresponding event will fire: `TaskEvent.CpuProfileCreated` or `TaskEvent.HeapSnapshotCreated`


## API

The package exports the following entities:

* `Profilers` - the main singleton class which extends `EventEmitter`
* `TaskEvent` - the events names constants: `TaskEvent.CpuProfileCreated` and `TaskEvent.HeapSnapshotCreated`
* `CpuProfileFileExt` - a CPU profile file extension constant
* `HeapSnapshotFileExt` - a heap snapshot file extension constant
* `logInColor(message)` - a helper function that logs provided message to console in cyan color

***

### Profilers class
`Profilers` class has the following public members:

**`cpu`** - an instance of the `CpuProfiler` class.

**`heap`** - an instance of the `HeapDumper` class.

**`startObserving(instanceName)`** - a method that creates an observer of the `instanceTasks` MongoDB collection for added documents filtered by the `instanceName` field. A handler of the `added` event then triggers the corresponding creation of a CPU profile or a heap snapshot. Each new invocation of the `startObserving` method stops the previous observer before creating a new one. The `instanceTasks` MongoDB collection is created on the first invocation of the method.

**`stopObserving()`** - a method that stops the observer of the `instanceTasks` MongoDB collection.

***

### CpuProfiler class

The `CpuProfile` class has the following public methods:

**`isProfiling()`** - returns value of the `profiling` flag which indicates that CPU profiling is in progress. The `profiling` flag is automatically managed only in a scenario when the CPU profiling process is triggered by the `scheduleTask` method. To prevent the overlapping of CPU profiling triggered by the `profile` method, you need to manually set the `profiling` flag's value using the `setProfiling` method.

**`setProfiling(value)`** - sets `profiling` flag to the provided boolean `value`.

**`profile([duration, [samplingInterval]])`** - creates a CPU profile of desired `duration` and with the specified `samplingInterval`, saves it to disk. The method returns a Promise that resolves with an object containing information about the created file: `{ fileName, filePath }`.

**`scheduleTask(instanceName, [duration, [samplingInterval]])`** - adds a task to the `instanceTasks` collection to profile CPU of a web app instance with provided `instanceName` for desired `duration` and with the specified `samplingInterval`.

In both the **`profile`** and the **`scheduleTask`** methods, `duration` and `samplingInterval` parameters are optional and have the following default values:\
`duration` (in **milli**seconds) - 60000 milliseconds which is 1 minute.\
`samplingInterval` (in **micro**seconds) - 1000 microseconds which is 1 millisecond.

***

### HeapDumper class

The `HeapDumper` class has the following public methods:

**`isDumping()`** - returns value of the `dumping` flag which indicates that heap dumping is in progress. The `dumping` flag is automatically managed only in a scenario when the dumping process is triggered by the `scheduleTask` method. To prevent overlapping of heap dumping triggered by the `takeSnapshot` method, you need to manually set the `dumping` flag's value using the `setDumping` method.

**`setDumping(value)`** - sets `dumping` flag to the provided boolean `value`.

**`takeSnapshot()`** - takes a heap snapshot, saves it to disk and returns an object containing information about the created file: `{ fileName, filePath }`.

**`scheduleTask(instanceName)`** - adds a task to the `instanceTasks` collection to take a heap snapshot of a web app instance specified by the `instanceName` parameter.
