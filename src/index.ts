require('dotenv').config()

import { connect } from './db';
import { server } from './server';

const mongoDbUri: string = process.env.MONGODB_URI!;
const port: string = process.env.PORT!;

connect(mongoDbUri);

server.listen({ port }).then(({ url }: { url: string }) => console.log(`Server is running on ${url}`));
