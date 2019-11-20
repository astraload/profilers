function logInColor(message) {
  console.log('\x1b[36m%s\x1b[0m', message);
}

module.exports = { logInColor };
