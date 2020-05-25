require('dotenv').config()

const db = require('./db');
const { server } = require('./server');

const mongoDbUri = process.env.MONGODB_URI;
const port = process.env.PORT;

db.connect(mongoDbUri);

server.listen({port}).then(({ url }) => console.log(`Server is running on ${url}`));
