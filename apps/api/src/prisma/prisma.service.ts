import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@nhgp/database';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    // Retry connection to handle Neon serverless cold-start latency.
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        await this.$connect();
        this.logger.log('Database connected');
        return;
      } catch (err) {
        const isLast = attempt === 5;
        this.logger.warn(
          `DB connect attempt ${attempt}/5 failed: ${(err as Error).message}${isLast ? ' — giving up' : ', retrying in 3s…'}`,
        );
        if (isLast) throw err;
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
