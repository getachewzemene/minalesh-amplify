/**
 * Logger Utilities Tests
 */

import { describe, it, expect, vi } from 'vitest';
import logger, { 
  logApiRequest, 
  logError, 
  logEvent, 
  logMetric,
  logCache 
} from './logger';

describe('Logger Utilities', () => {
  describe('logApiRequest', () => {
    it('should log successful API requests', () => {
      const spy = vi.spyOn(logger, 'info');
      
      logApiRequest({
        method: 'GET',
        path: '/api/test',
        statusCode: 200,
        duration: 150,
      });
      
      expect(spy).toHaveBeenCalled();
      const logData = spy.mock.calls[0][0];
      expect(logData).toMatchObject({
        type: 'api_request',
        method: 'GET',
        path: '/api/test',
        statusCode: 200,
        duration: 150,
      });
      
      spy.mockRestore();
    });

    it('should log API errors with error level', () => {
      const spy = vi.spyOn(logger, 'error');
      
      logApiRequest({
        method: 'POST',
        path: '/api/test',
        statusCode: 500,
        duration: 100,
      });
      
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should log API warnings with warn level', () => {
      const spy = vi.spyOn(logger, 'warn');
      
      logApiRequest({
        method: 'GET',
        path: '/api/test',
        statusCode: 404,
        duration: 50,
      });
      
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('logError', () => {
    it('should log Error objects', () => {
      const spy = vi.spyOn(logger, 'error');
      const error = new Error('Test error');
      
      logError(error, { context: 'test' });
      
      expect(spy).toHaveBeenCalled();
      const logData = spy.mock.calls[0][0];
      expect(logData).toMatchObject({
        type: 'error',
        error: 'Test error',
        context: 'test',
      });
      expect(logData.stack).toBeDefined();
      
      spy.mockRestore();
    });

    it('should log string errors', () => {
      const spy = vi.spyOn(logger, 'error');
      
      logError('String error message');
      
      expect(spy).toHaveBeenCalled();
      const logData = spy.mock.calls[0][0];
      expect(logData).toMatchObject({
        type: 'error',
        error: 'String error message',
      });
      
      spy.mockRestore();
    });
  });

  describe('logEvent', () => {
    it('should log application events', () => {
      const spy = vi.spyOn(logger, 'info');
      
      logEvent('user_registered', {
        userId: '123',
        email: 'test@example.com',
      });
      
      expect(spy).toHaveBeenCalled();
      const logData = spy.mock.calls[0][0];
      expect(logData).toMatchObject({
        type: 'event',
        event: 'user_registered',
        userId: '123',
        email: 'test@example.com',
      });
      
      spy.mockRestore();
    });
  });

  describe('logMetric', () => {
    it('should log performance metrics', () => {
      const spy = vi.spyOn(logger, 'info');
      
      logMetric('api_response_time', 150, {
        endpoint: '/api/products',
      });
      
      expect(spy).toHaveBeenCalled();
      const logData = spy.mock.calls[0][0];
      expect(logData).toMatchObject({
        type: 'metric',
        metric: 'api_response_time',
        value: 150,
        endpoint: '/api/products',
      });
      
      spy.mockRestore();
    });
  });

  describe('logCache', () => {
    it('should log cache operations', () => {
      const spy = vi.spyOn(logger, 'debug');
      
      logCache('hit', 'products:all', { ttl: 300 });
      
      expect(spy).toHaveBeenCalled();
      const logData = spy.mock.calls[0][0];
      expect(logData).toMatchObject({
        type: 'cache',
        operation: 'hit',
        key: 'products:all',
        ttl: 300,
      });
      
      spy.mockRestore();
    });
  });
});
