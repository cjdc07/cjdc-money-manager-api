import mongoose from 'mongoose';

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  connectTimeoutMS: 10000,
  useFindAndModify: false,
};

export const connect = (mongoDbUri: string) => mongoose.connect(mongoDbUri, options)
  .then(() => console.log(`Successfully connected to ${mongoDbUri}`))
  .catch(error => console.error(error));
