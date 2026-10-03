import {
  Global,
  Inject,
  Logger,
  Module,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Redis => {
        const logger = new Logger('Redis');
        const options = {
          // falla rápido si Redis no está disponible en vez de encolar comandos
          enableOfflineQueue: false,
          maxRetriesPerRequest: 2,
          connectTimeout: 5000,
        };

        const url = config.get<string>('REDIS_URL');
        const client = url
          ? new Redis(url, options)
          : new Redis({
              host: config.get<string>('REDIS_HOST', 'localhost'),
              port: Number(config.get<string>('REDIS_PORT', '6379')),
              password: config.get<string>('REDIS_PASSWORD') || undefined,
              db: Number(config.get<string>('REDIS_DB', '0')),
              ...options,
            });

        client.on('error', (err) => logger.error(err.message));
        client.on('ready', () => logger.log('Conectado'));
        return client;
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async onModuleDestroy(): Promise<void> {
    try {
      await this.redis.quit();
    } catch {
      this.redis.disconnect();
    }
  }
}
