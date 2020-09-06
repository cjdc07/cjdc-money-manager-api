import { connect } from './db';
import { server } from './server';

require('dotenv').config();

const dbUri: string = process.env.DB_URI!;
const port: string = process.env.PORT!;

connect(dbUri);

server.listen({ port }).then(({ url }: { url: string }) => console.log(`Server is running on ${url}`));
