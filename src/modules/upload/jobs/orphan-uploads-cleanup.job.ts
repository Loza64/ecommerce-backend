import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NodeCronScheduler } from 'src/shared/scheduler/node-cron.scheduler';
import { CronJob } from 'src/shared/scheduler/scheduler.port';
import { UploadService } from '../service/upload.service';

@Injectable()
export class OrphanUploadsCleanupJob implements CronJob, OnModuleInit {
  private readonly logger = new Logger(OrphanUploadsCleanupJob.name);

  readonly name = 'orphan-uploads-cleanup';
  readonly cronExpression: string;
  readonly preventOverlap = true;

  private readonly minAgeMinutes: number;

  constructor(
    private readonly uploadService: UploadService,
    private readonly scheduler: NodeCronScheduler,
    config: ConfigService,
  ) {
    this.cronExpression =
      config.get<string>('ORPHAN_UPLOADS_CLEANUP_CRON') ?? '*/15 * * * *';
    this.minAgeMinutes =
      Number(config.get('ORPHAN_UPLOADS_MIN_AGE_MINUTES')) || 30;
  }

  onModuleInit(): void {
    this.scheduler.register(this);
  }

  async run(): Promise<void> {
    const olderThan = new Date(Date.now() - this.minAgeMinutes * 60_000);
    const orphans = await this.uploadService.findOrphans(olderThan);

    if (!orphans.length) return;

    this.logger.log(
      `Limpieza de uploads huérfanos: ${orphans.length} candidato(s) sin usuario asociado (id: ${orphans
        .map((upload) => upload.id)
        .join(', ')})`,
    );

    const results = await Promise.allSettled(
      orphans.map((upload) => this.uploadService.deleteFile(upload.id)),
    );

    let deleted = 0;
    const failed: Array<{ id: number; reason: string }> = [];

    results.forEach((result, index) => {
      const id = orphans[index].id;
      if (result.status === 'fulfilled') {
        deleted += 1;
        return;
      }
      const reason =
        result.reason instanceof Error
          ? result.reason.message
          : String(result.reason);
      failed.push({ id, reason });
      this.logger.error(
        `No se pudo limpiar el upload huérfano ${id}: ${reason}`,
      );
    });

    this.logger.log(
      `Limpieza de uploads huérfanos: ${orphans.length} escaneados, ${deleted} borrados, ${failed.length} fallidos`,
    );
  }
}
