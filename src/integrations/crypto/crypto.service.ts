import { Injectable } from '@nestjs/common';
import bcrypt from 'bcrypt';

@Injectable()
export class CryptoService {
  private readonly saltRounds = 10;

  async encrypt(password: string): Promise<string> {
    const hash: string = await bcrypt.hash(password, this.saltRounds);
    return hash;
  }

  async compare(password: string, hash: string): Promise<boolean> {
    const result: boolean = await bcrypt.compare(password, hash);
    return result;
  }
}
