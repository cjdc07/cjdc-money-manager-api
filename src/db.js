const mongoose = require('mongoose');

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  connectTimeoutMS: 10000,
};

const connect = (mongoDbUri) => mongoose.connect(mongoDbUri, options)
  .then(() => console.log(`Successfully connected to ${mongoDbUri}`))
  .catch(error => console.error(error));

module.exports = {
  connect,
}
