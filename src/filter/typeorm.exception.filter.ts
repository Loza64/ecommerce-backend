import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { Response } from 'express';

interface PostgresError {
  code: string;
  detail?: string;
  table?: string;
  constraint?: string;
}

@Catch(QueryFailedError)
export class TypeOrmExceptionFilter implements ExceptionFilter {
  catch(exception: QueryFailedError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Default
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database query failed';

    const driverError = exception.driverError as unknown as
      | PostgresError
      | undefined;

    if (driverError) {
      switch (driverError.code) {
        case '23505': // Unique violation
          status = HttpStatus.CONFLICT;
          message = driverError.detail || 'Duplicate entry';
          break;
        case '23503': // Foreign key violation
          status = HttpStatus.BAD_REQUEST;
          message = driverError.detail || 'Invalid reference';
          break;
        case '23502': // Not null violation
          status = HttpStatus.BAD_REQUEST;
          message = driverError.detail || 'Missing required field';
          break;
        case '22001': // String too long
          status = HttpStatus.BAD_REQUEST;
          message = driverError.detail || 'Value too long for column';
          break;
        case '22003': // Numeric value out of range
          status = HttpStatus.BAD_REQUEST;
          message = driverError.detail || 'Numeric value out of range';
          break;
        case '22007': // Invalid datetime
          status = HttpStatus.BAD_REQUEST;
          message = driverError.detail || 'Invalid datetime format';
          break;
        case '22012': // Division by zero
          status = HttpStatus.BAD_REQUEST;
          message = driverError.detail || 'Division by zero';
          break;
        case '42601': // Syntax error
          status = HttpStatus.BAD_REQUEST;
          message = driverError.detail || 'SQL syntax error';
          break;
        case '42P01': // Table not found
          status = HttpStatus.BAD_REQUEST;
          message = driverError.detail || 'Table not found';
          break;
        case '42703': // Column not found
          status = HttpStatus.BAD_REQUEST;
          message = driverError.detail || 'Column not found';
          break;
        default:
          status = HttpStatus.BAD_REQUEST;
          message = driverError.detail || 'Database query failed';
      }
    }

    response.status(status).json({ status, message });
  }
}
