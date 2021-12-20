import { BotModule } from '@bot/bot.module';
import configHelper from '@config/config-helper';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';

@Module({
  imports: [
    BotModule,
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      load: [() => configHelper.createConfiguration()],
    }),
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'bbb.db',
      prepareDatabase: (db: any) => {
        db.pragma('journal_mode = TRUNCATE');
      },
      entities: [join(__dirname, '**', '*.entity.{ts,js}')],
      synchronize: true,
    }),
    EventEmitterModule.forRoot({ wildcard: true }),
  ],
})
export class AppModule {}
