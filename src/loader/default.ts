import { INestApplication } from '@nestjs/common';

export default async (app: INestApplication) => {
  app.enableShutdownHooks();
};
