import { describe, it, expect, beforeEach, vi } from 'vitest';
import { queueEmail, processEmailQueue, sendEmailImmediate } from '../lib/email';
import prisma from '../lib/prisma';

// Mock Prisma
vi.mock('../lib/prisma', () => ({
  default: {
    emailQueue: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      fields: {
        maxAttempts: 3,
      },
    },
  },
}));

// Mock logger
vi.mock('../lib/logger', () => ({
  logError: vi.fn(),
  logEvent: vi.fn(),
}));

// Mock Resend
vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockResolvedValue({
        data: { id: 'test-email-id' },
        error: null,
      }),
    },
  })),
}));

describe('Email Queue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('queueEmail', () => {
    it('should queue an email successfully', async () => {
      const mockEmail = {
        id: 'test-id',
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test Text',
        template: 'test-template',
        metadata: { test: 'data' },
        status: 'pending',
        scheduledFor: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        attempts: 0,
        maxAttempts: 3,
        lastError: null,
        lastAttemptAt: null,
        sentAt: null,
      };

      (prisma.emailQueue.create as any).mockResolvedValue(mockEmail);

      const emailId = await queueEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test Text',
        template: 'test-template',
        metadata: { test: 'data' },
      });

      expect(emailId).toBe('test-id');
      expect(prisma.emailQueue.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          to: 'test@example.com',
          subject: 'Test Subject',
          html: '<p>Test HTML</p>',
          text: 'Test Text',
          template: 'test-template',
          metadata: { test: 'data' },
          status: 'pending',
        }),
      });
    });

    it('should handle scheduled emails', async () => {
      const scheduledDate = new Date(Date.now() + 3600000); // 1 hour from now
      const mockEmail = {
        id: 'scheduled-id',
        to: 'test@example.com',
        subject: 'Scheduled Email',
        html: '<p>Test</p>',
        text: 'Test',
        template: null,
        metadata: null,
        status: 'pending',
        scheduledFor: scheduledDate,
        createdAt: new Date(),
        updatedAt: new Date(),
        attempts: 0,
        maxAttempts: 3,
        lastError: null,
        lastAttemptAt: null,
        sentAt: null,
      };

      (prisma.emailQueue.create as any).mockResolvedValue(mockEmail);

      await queueEmail(
        {
          to: 'test@example.com',
          subject: 'Scheduled Email',
          html: '<p>Test</p>',
          text: 'Test',
        },
        scheduledDate
      );

      expect(prisma.emailQueue.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          scheduledFor: scheduledDate,
        }),
      });
    });
  });

  describe('processEmailQueue', () => {
    it('should process pending emails', async () => {
      const mockEmails = [
        {
          id: 'email-1',
          to: 'test1@example.com',
          subject: 'Test 1',
          html: '<p>Test 1</p>',
          text: 'Test 1',
          template: null,
          metadata: null,
          status: 'pending',
          attempts: 0,
          maxAttempts: 3,
          lastError: null,
          lastAttemptAt: null,
          sentAt: null,
          scheduledFor: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'email-2',
          to: 'test2@example.com',
          subject: 'Test 2',
          html: '<p>Test 2</p>',
          text: 'Test 2',
          template: null,
          metadata: null,
          status: 'pending',
          attempts: 0,
          maxAttempts: 3,
          lastError: null,
          lastAttemptAt: null,
          sentAt: null,
          scheduledFor: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.emailQueue.findMany as any).mockResolvedValue(mockEmails);
      (prisma.emailQueue.update as any).mockImplementation(({ where, data }) => {
        return Promise.resolve({
          ...mockEmails.find((e) => e.id === where.id),
          ...data,
        });
      });

      const result = await processEmailQueue(10);

      expect(result.processed).toBe(2);
      expect(prisma.emailQueue.findMany).toHaveBeenCalled();
    });

    it('should handle empty queue', async () => {
      (prisma.emailQueue.findMany as any).mockResolvedValue([]);

      const result = await processEmailQueue(10);

      expect(result.processed).toBe(0);
      expect(result.sent).toBe(0);
      expect(result.failed).toBe(0);
    });

    it('should respect batch size', async () => {
      const mockEmails = Array.from({ length: 25 }, (_, i) => ({
        id: `email-${i}`,
        to: `test${i}@example.com`,
        subject: `Test ${i}`,
        html: `<p>Test ${i}</p>`,
        text: `Test ${i}`,
        template: null,
        metadata: null,
        status: 'pending',
        attempts: 0,
        maxAttempts: 3,
        lastError: null,
        lastAttemptAt: null,
        sentAt: null,
        scheduledFor: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      (prisma.emailQueue.findMany as any).mockResolvedValue(mockEmails.slice(0, 15));
      (prisma.emailQueue.update as any).mockImplementation(({ where, data }) => {
        return Promise.resolve({
          ...mockEmails.find((e) => e.id === where.id),
          ...data,
        });
      });

      const result = await processEmailQueue(15);

      expect(result.processed).toBe(15);
      expect(prisma.emailQueue.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 15,
        })
      );
    });
  });

  describe('sendEmailImmediate', () => {
    it('should send email in development mode', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const result = await sendEmailImmediate({
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML</p>',
        text: 'Test Text',
      });

      expect(result).toBe(true);
      expect(consoleLogSpy).toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
      consoleLogSpy.mockRestore();
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed emails up to max attempts', async () => {
      const mockEmail = {
        id: 'retry-email',
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>',
        text: 'Test',
        template: null,
        metadata: null,
        status: 'pending',
        attempts: 2, // Already tried twice
        maxAttempts: 3,
        lastError: 'Previous error',
        lastAttemptAt: new Date(),
        sentAt: null,
        scheduledFor: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.emailQueue.findMany as any).mockResolvedValue([mockEmail]);
      (prisma.emailQueue.update as any).mockImplementation(({ where, data }) => {
        return Promise.resolve({
          ...mockEmail,
          ...data,
        });
      });
      (prisma.emailQueue.findUnique as any).mockResolvedValue(mockEmail);

      await processEmailQueue(10);

      // Should update the email status
      expect(prisma.emailQueue.update).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      (prisma.emailQueue.create as any).mockRejectedValue(new Error('Database error'));

      await expect(
        queueEmail({
          to: 'test@example.com',
          subject: 'Test',
          html: '<p>Test</p>',
          text: 'Test',
        })
      ).rejects.toThrow('Database error');
    });

    it('should handle processing errors gracefully', async () => {
      (prisma.emailQueue.findMany as any).mockRejectedValue(
        new Error('Database connection lost')
      );

      await expect(processEmailQueue(10)).rejects.toThrow('Database connection lost');
    });
  });
});
