import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

interface HttpResponseWithMessage {
  message?: string | string[];
  [key: string]: unknown;
}

interface CloudinaryError {
  message: string;
  http_code?: number;
  name?: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const { status, message } = this.getStatusAndMessage(exception);

    response.status(status).json({ status, message });
  }

  private getStatusAndMessage(exception: unknown): {
    status: number;
    message: string;
  } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();

      const message = this.extractMessage(
        this.isHttpResponseWithMessage(res)
          ? res
          : { message: this.stringifyResponse(res) },
      );

      return { status, message };
    }

    if (this.isCloudinaryError(exception)) {
      const status = exception.http_code ?? HttpStatus.INTERNAL_SERVER_ERROR;
      const message = exception.message ?? 'Internal server error';
      return { status, message };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    };
  }

  private extractMessage(response: HttpResponseWithMessage): string {
    const msg = response.message;
    if (Array.isArray(msg)) return msg.join(', ');
    if (typeof msg === 'string') return msg;
    return JSON.stringify(response);
  }

  private isCloudinaryError(exception: unknown): exception is CloudinaryError {
    return (
      typeof exception === 'object' &&
      exception !== null &&
      'message' in exception &&
      typeof (exception as Record<string, unknown>).message === 'string'
    );
  }

  private isHttpResponseWithMessage(
    obj: unknown,
  ): obj is HttpResponseWithMessage {
    return typeof obj === 'object' && obj !== null && 'message' in obj;
  }

  private stringifyResponse(res: unknown): string {
    try {
      return typeof res === 'object' && res !== null
        ? JSON.stringify(res)
        : String(res);
    } catch {
      return 'Cannot stringify response';
    }
  }
}
