import { Global, Module } from '@nestjs/common';
import { NodeCronScheduler } from './node-cron.scheduler';

@Global()
@Module({
  providers: [NodeCronScheduler],
  exports: [NodeCronScheduler],
})
export class SchedulerModule {}
