import {
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import Redis from 'ioredis';
import { REDIS_CLIENT } from 'src/integrations/redis/redis.constants';

interface StoredRecord {
  status: 'processing' | 'completed';
  fingerprint: string;
  owner: string;
  response?: { body: unknown };
}

export type BeginResult =
  | { state: 'acquired'; owner: string }
  | { state: 'in_progress' }
  | { state: 'mismatch' }
  | { state: 'replay'; response: { body: unknown } };

/** Solo el dueño del lock puede completarlo (evita pisar a otra petición) */
const COMPLETE_SCRIPT = `
local v = redis.call('GET', KEYS[1])
if not v then return 0 end
local d = cjson.decode(v)
if d.owner ~= ARGV[1] then return 0 end
redis.call('SET', KEYS[1], ARGV[2], 'EX', tonumber(ARGV[3]))
return 1
`;

/** Libera el lock solo si sigue en "processing" y es nuestro */
const RELEASE_SCRIPT = `
local v = redis.call('GET', KEYS[1])
if not v then return 0 end
local d = cjson.decode(v)
if d.owner == ARGV[1] and d.status == 'processing' then
  return redis.call('DEL', KEYS[1])
end
return 0
`;

@Injectable()
export class IdempotencyService {
  private readonly logger = new Logger(IdempotencyService.name);
  private readonly lockTtlSeconds: number;
  private readonly resultTtlSeconds: number;
  private readonly eventTtlSeconds: number;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    config: ConfigService,
  ) {
    this.lockTtlSeconds =
      Number(config.get('IDEMPOTENCY_LOCK_TTL_SECONDS')) || 60;
    this.resultTtlSeconds =
      Number(config.get('IDEMPOTENCY_TTL_SECONDS')) || 24 * 60 * 60;
    this.eventTtlSeconds =
      Number(config.get('WEBHOOK_EVENT_TTL_SECONDS')) || 7 * 24 * 60 * 60;
  }

  /* ------------------------- peticiones HTTP (header) ------------------------ */

  /**
   * Intenta tomar la clave. Si Redis no responde falla cerrado (503):
   * es preferible rechazar un cobro antes que arriesgar duplicarlo.
   */
  async begin(key: string, fingerprint: string): Promise<BeginResult> {
    try {
      for (let attempt = 0; attempt < 3; attempt++) {
        const owner = randomUUID();
        const record: StoredRecord = {
          status: 'processing',
          fingerprint,
          owner,
        };
        const acquired = await this.redis.set(
          key,
          JSON.stringify(record),
          'EX',
          this.lockTtlSeconds,
          'NX',
        );
        if (acquired === 'OK') return { state: 'acquired', owner };

        const raw = await this.redis.get(key);
        if (!raw) continue; // expiró entre el SET y el GET: reintenta

        const existing = JSON.parse(raw) as StoredRecord;
        if (existing.fingerprint !== fingerprint) return { state: 'mismatch' };
        if (existing.status === 'processing') return { state: 'in_progress' };
        return {
          state: 'replay',
          response: existing.response ?? { body: null },
        };
      }
      return { state: 'in_progress' };
    } catch (err) {
      this.logger.error(`Redis no disponible (begin): ${String(err)}`);
      throw new ServiceUnavailableException(
        'No se pudo verificar la idempotencia. Intenta de nuevo en unos segundos.',
      );
    }
  }

  async complete(
    key: string,
    owner: string,
    fingerprint: string,
    body: unknown,
  ): Promise<void> {
    const record: StoredRecord = {
      status: 'completed',
      fingerprint,
      owner,
      response: { body: body ?? null },
    };
    try {
      await this.redis.eval(
        COMPLETE_SCRIPT,
        1,
        key,
        owner,
        JSON.stringify(record),
        String(this.resultTtlSeconds),
      );
    } catch (err) {
      // La operación ya se ejecutó; no se la hacemos fallar al cliente.
      this.logger.error(
        `No se pudo guardar la respuesta idempotente: ${String(err)}`,
      );
    }
  }

  async release(key: string, owner: string): Promise<void> {
    try {
      await this.redis.eval(RELEASE_SCRIPT, 1, key, owner);
    } catch (err) {
      this.logger.error(
        `No se pudo liberar la clave idempotente: ${String(err)}`,
      );
    }
  }

  /* ------------------------------ webhooks ------------------------------ */

  /**
   * true  => primera vez que vemos el evento (hay que procesarlo)
   * false => duplicado
   * Si Redis falla devuelve true: los handlers son idempotentes a nivel BD.
   */
  async claimEvent(eventId: string): Promise<boolean> {
    try {
      const res = await this.redis.set(
        `webhook:${eventId}`,
        '1',
        'EX',
        this.eventTtlSeconds,
        'NX',
      );
      return res === 'OK';
    } catch (err) {
      this.logger.error(`Redis no disponible (claimEvent): ${String(err)}`);
      return true;
    }
  }

  async releaseEvent(eventId: string): Promise<void> {
    try {
      await this.redis.del(`webhook:${eventId}`);
    } catch (err) {
      this.logger.error(
        `No se pudo liberar el evento ${eventId}: ${String(err)}`,
      );
    }
  }
}
