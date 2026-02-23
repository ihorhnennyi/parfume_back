

import { ErrorUtil } from './error.util';
import {
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  UnprocessableEntityException,
  TooManyRequestsException,
  BadGatewayException,
  ServiceUnavailableException,
  GatewayTimeoutException,
} from '../exceptions/custom-exceptions';


export class ErrorExamples {
  
  static badRequest(message: string, details?: any) {
    return new BadRequestException(message, details);
    
    
  }

  
  static unauthorized(message: string = 'Unauthorized', details?: any) {
    return new UnauthorizedException(message, details);
  }

  
  static forbidden(message: string = 'Forbidden', details?: any) {
    return new ForbiddenException(message, details);
  }

  
  static notFound(resource: string = 'Resource', details?: any) {
    return new NotFoundException(`${resource} not found`, details);
  }

  
  static conflict(message: string, details?: any) {
    return new ConflictException(message, details);
  }

  
  static unprocessableEntity(
    message: string | string[],
    details?: any,
  ) {
    return new UnprocessableEntityException(message, details);
  }

  
  static tooManyRequests(message: string = 'Too many requests', details?: any) {
    return new TooManyRequestsException(message, details);
  }

  
  static internalServerError(
    message: string = 'Internal server error',
    details?: any,
  ) {
    return new InternalServerErrorException(message, details);
  }

  
  static badGateway(message: string = 'Bad gateway', details?: any) {
    return new BadGatewayException(message, details);
  }

  
  static serviceUnavailable(
    message: string = 'Service unavailable',
    details?: any,
  ) {
    return new ServiceUnavailableException(message, details);
  }

  
  static gatewayTimeout(message: string = 'Gateway timeout', details?: any) {
    return new GatewayTimeoutException(message, details);
  }

  
  static custom(statusCode: number, message: string, details?: any) {
    return ErrorUtil.createError(statusCode, message, undefined, details);
  }
}




