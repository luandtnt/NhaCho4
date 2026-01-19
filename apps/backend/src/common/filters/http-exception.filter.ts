import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorResponse: any = {
      error_code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      request_id: request.headers['x-request-id'] || 'unknown',
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        errorResponse = {
          ...errorResponse,
          ...exceptionResponse,
        };
      } else {
        errorResponse.message = exceptionResponse;
      }
    } else if (exception instanceof Error) {
      errorResponse.message = exception.message;
    }

    // Don't log sensitive data (C-009)
    console.error(`[${errorResponse.request_id}] Error:`, {
      status,
      error_code: errorResponse.error_code,
      message: errorResponse.message,
      path: request.url,
    });

    response.status(status).json(errorResponse);
  }
}
