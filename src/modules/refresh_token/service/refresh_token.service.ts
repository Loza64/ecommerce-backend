import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createHash, randomUUID } from 'crypto';

import { User } from 'src/modules/user/domain/entity/user.entity';
import { RefreshToken } from '../domain/entity/refresh_token.entitiy';

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
  ) {}

  private hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async issue(user: User, familyId: string = randomUUID()): Promise<string> {
    const refreshTokenValue = randomUUID();

    const entity = this.refreshTokenRepo.create({
      token: this.hash(refreshTokenValue),
      familyId,
      user,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    });
    await this.refreshTokenRepo.save(entity);

    return refreshTokenValue;
  }

  async rotate(
    incomingToken: string,
  ): Promise<{ refreshToken: string; user: User }> {
    const hashed = this.hash(incomingToken);
    const stored = await this.refreshTokenRepo.findOne({
      where: { token: hashed },
      relations: { user: { role: { permissions: true } } },
    });

    if (!stored) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    if (stored.used || stored.revoked) {
      await this.revokeFamily(stored.familyId);
      throw new UnauthorizedException(
        'Reuso de refresh token detectado. Todas las sesiones fueron revocadas.',
      );
    }

    if (stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expirado');
    }

    if (stored.user.deletedAt !== null || stored.user.blocked) {
      throw new UnauthorizedException('Cuenta inactiva o bloqueada');
    }

    stored.used = true;
    await this.refreshTokenRepo.save(stored);

    const newRefreshToken = await this.issue(stored.user, stored.familyId);

    return { refreshToken: newRefreshToken, user: stored.user };
  }

  async revoke(incomingToken: string): Promise<void> {
    const hashed = this.hash(incomingToken);
    const stored = await this.refreshTokenRepo.findOne({
      where: { token: hashed },
    });
    if (stored) {
      await this.revokeFamily(stored.familyId);
    }
  }

  private async revokeFamily(familyId: string): Promise<void> {
    await this.refreshTokenRepo.update({ familyId }, { revoked: true });
  }
}
