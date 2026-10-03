import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import cron, { ScheduledTask } from 'node-cron';
import { CronJob, Scheduler } from './scheduler.port';

interface RegisteredJob {
  job: CronJob;
  task?: ScheduledTask;
}

/**
 * Wrapper de node-cron. Los jobs se registran (job.register) durante el
 * onModuleInit de cada módulo que los define; este servicio los arranca
 * todos juntos en onApplicationBootstrap, cuando ya está garantizado que
 * toda la app (incluyendo esos módulos) terminó de inicializarse.
 *
 * A partir de node-cron v4 ya no existe la opción `scheduled: false`: la
 * tarea arranca sola en cuanto se crea con cron.schedule(). Por eso acá NO
 * se llama a cron.schedule() en register() (solo se guarda la definición
 * del job); la tarea real recién se crea y arranca en start(), cuando la
 * app ya terminó de inicializarse.
 */
@Injectable()
export class NodeCronScheduler
  implements Scheduler, OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(NodeCronScheduler.name);
  private readonly registeredJobs: RegisteredJob[] = [];

  register(job: CronJob): void {
    if (!cron.validate(job.cronExpression)) {
      throw new Error(
        `Expresión cron inválida para el job "${job.name}": "${job.cronExpression}"`,
      );
    }

    this.registeredJobs.push({ job });
    this.logger.log(
      `Job "${job.name}" registrado (cron: "${job.cronExpression}")`,
    );
  }

  async onApplicationBootstrap(): Promise<void> {
    await this.start();
  }

  async onModuleDestroy(): Promise<void> {
    await this.stop();
  }

  start(): Promise<void> {
    for (const registered of this.registeredJobs) {
      const { job } = registered;
      const tick = this.toTickHandler(job);

      registered.task = cron.schedule(
        job.cronExpression,
        () => {
          void tick();
        },
        { name: job.name },
      );

      this.logger.log(`Job "${job.name}" iniciado`);
    }

    return Promise.resolve();
  }

  async stop(): Promise<void> {
    for (const { task } of this.registeredJobs) {
      await task?.stop();
    }
  }

  private toTickHandler(job: CronJob): () => Promise<void> {
    const preventOverlap = job.preventOverlap ?? true;
    let running = false;

    return async () => {
      if (preventOverlap && running) {
        this.logger.warn(
          `Job "${job.name}": la corrida anterior aún está en curso, se omite este tick`,
        );
        return;
      }

      running = true;
      try {
        await job.run();
      } catch (err) {
        this.logger.error(
          `Job "${job.name}" falló de forma inesperada`,
          err as Error,
        );
      } finally {
        running = false;
      }
    };
  }
}
