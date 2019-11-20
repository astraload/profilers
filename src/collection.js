const CollectionName = 'instanceTasks';

let InstanceTasks = null;


function createCollection() {
  InstanceTasks = new Mongo.Collection(CollectionName);
  InstanceTasks.rawCollection().createIndex({ instanceName: 1 });
  InstanceTasks.deny({
    insert() { return true; },
    update() { return true; },
    remove() { return true; },
  });
}


function getCollection() {
  if (!InstanceTasks) createCollection();
  return InstanceTasks;
}


function logCollectionNotCreatedError(operation) {
  console.error(
    '@astraload/profilers: ' +
    `Unable to ${operation} task because ` +
    `collection "${CollectionName}" is not created`
  );
}


function insertTask({ instanceName, taskType, duration, samplingInterval }) {
  if (!InstanceTasks) return logCollectionNotCreatedError('insert');
  InstanceTasks.insert({
    instanceName,
    taskType,
    duration,
    samplingInterval,
  });
}


function removeTask(id) {
  if (!InstanceTasks) return logCollectionNotCreatedError('remove');
  InstanceTasks.remove(id);
}


module.exports = {
  getCollection,
  insertTask,
  removeTask,
};
