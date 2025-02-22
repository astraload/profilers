const CollectionName = 'instanceTasks';

let InstanceTasks = null;


function createCollection() {
  InstanceTasks = new Mongo.Collection(CollectionName, { defineMutationMethods: false });
  InstanceTasks.rawCollection().createIndex({ instanceName: 1 }).catch(() => {});
}


export function getCollection() {
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


export async function insertTask({ instanceName, taskType, duration, samplingInterval }) {
  if (!InstanceTasks) return logCollectionNotCreatedError('insert');
  await InstanceTasks.insertAsync({
    instanceName,
    taskType,
    duration,
    samplingInterval,
  });
}


export async function removeTask(id) {
  if (!InstanceTasks) return logCollectionNotCreatedError('remove');
  await InstanceTasks.removeAsync(id);
}
