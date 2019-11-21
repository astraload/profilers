function logInColor(message) {
  console.log('\x1b[36m%s\x1b[0m', message);
}

function generateId() {
  const idLength = 12;
  return new Mongo.ObjectID().valueOf().slice(0, idLength);
}

module.exports = {
  logInColor,
  generateId,
};
