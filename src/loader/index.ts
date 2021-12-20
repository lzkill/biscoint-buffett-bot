import { INestApplication } from '@nestjs/common';
import defaultLoader from './default';

export default async (app: INestApplication) => {
  await defaultLoader(app);
};
