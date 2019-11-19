const InstanceTasks = new Mongo.Collection('instanceTasks');

InstanceTasks.rawCollection().createIndex({ instanceName: 1 });

InstanceTasks.deny({
  insert() { return true; },
  update() { return true; },
  remove() { return true; },
});

function insertTask({ instanceName, taskType, duration, samplingInterval }) {
  InstanceTasks.insert({
    instanceName,
    taskType,
    duration,
    samplingInterval,
  });
}

function removeTask(id) {
  InstanceTasks.remove(id);
}

module.exports = {
  InstanceTasks,
  insertTask,
  removeTask,
};
