const mongoose = require('mongoose');

const config = { useNewUrlParser: true, useUnifiedTopology: true };

const connect = (mongoDbUri) => mongoose.connect(mongoDbUri, config)
  .then(() => console.log(`Successfully connected to ${mongoDbUri}`))
  .catch(error => console.error(error));

module.exports = {
  connect,
}
