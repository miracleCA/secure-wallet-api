import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';  
import { Request, Response } from 'express'; 


@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : 500;

    response.status(status).json({
      success: false,
      statusCode: status,
      path: request.url,
      message:
        exception?.response?.message ||
        exception.message ||
        'Internal server error',
    });
  }
}