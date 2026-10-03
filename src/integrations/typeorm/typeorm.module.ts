import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService): TypeOrmModuleOptions => {
        const isProduction = config.get<string>('NODE_ENV') === 'production';
        return {
          type: 'postgres',
          host: config.get<string>('DB_HOST'),
          port: Number(config.get<string>('DB_PORT')),
          username: config.get<string>('DB_USER'),
          password: config.get<string>('DB_PASSWORD'),
          database: config.get<string>('DB_NAME'),
          autoLoadEntities: true,
          synchronize: !isProduction,
          ssl: isProduction && { rejectUnauthorized: false },
          extra: {
            max: Number(config.get<string>('DB_POOL_MAX', '20')),
            min: Number(config.get<string>('DB_POOL_MIN', '5')),
            connectionTimeoutMillis: Number(
              config.get<string>('DB_POOL_ACQUIRE_TIMEOUT', '3000'),
            ),
            idleTimeoutMillis: Number(
              config.get<string>('DB_POOL_IDLE_TIMEOUT', '30000'),
            ),
          },
        };
      },
    }),
  ],
})
export class TypeormModule {}
