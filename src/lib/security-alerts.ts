/**
 * Security Alert Webhook Integration
 * 
 * Sends security alerts to Slack or other webhook endpoints
 * Triggered by critical security events
 */

/**
 * Send security alert to Slack webhook
 */
export async function sendSlackAlert(message: string, severity: 'low' | 'medium' | 'high' | 'critical'): Promise<boolean> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.warn('SLACK_WEBHOOK_URL not configured, skipping alert');
    return false;
  }
  
  const colors: Record<string, string> = {
    low: '#36a64f', // Green
    medium: '#ff9900', // Orange
    high: '#ff6600', // Dark orange
    critical: '#ff0000', // Red
  };
  
  const payload = {
    text: `🚨 Security Alert [${severity.toUpperCase()}]`,
    attachments: [
      {
        color: colors[severity] || colors.medium,
        text: message,
        footer: 'Minalesh Security Monitoring',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      console.error('Failed to send Slack alert:', response.statusText);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error sending Slack alert:', error);
    return false;
  }
}

/**
 * Check if alert should be sent based on event
 */
export function shouldSendAlert(
  eventType: string,
  severity: string,
  ipAddress: string
): boolean {
  // Always send alerts for critical events
  if (severity === 'critical') {
    return true;
  }
  
  // Send alerts for high severity rate limit violations
  if (severity === 'high' && eventType === 'rate_limit_exceeded') {
    return true;
  }
  
  // Send alerts for security blocks
  if (eventType === 'security_block') {
    return true;
  }
  
  // Send alerts for blacklist blocks
  if (eventType === 'blacklist_block') {
    return true;
  }
  
  // Send alerts for Cloudflare threat detection
  if (eventType === 'cloudflare_threat_detected') {
    return true;
  }
  
  return false;
}

/**
 * Format security event for alert message
 */
export function formatAlertMessage(
  eventType: string,
  severity: string,
  ipAddress: string,
  userAgent?: string | null,
  endpoint?: string,
  metadata?: any
): string {
  const parts = [
    `*Event Type:* ${eventType}`,
    `*Severity:* ${severity}`,
    `*IP Address:* ${ipAddress}`,
  ];
  
  if (endpoint) {
    parts.push(`*Endpoint:* ${endpoint}`);
  }
  
  if (userAgent) {
    parts.push(`*User Agent:* ${userAgent}`);
  }
  
  if (metadata) {
    const reason = metadata.reason;
    if (reason) {
      parts.push(`*Reason:* ${reason}`);
    }
  }
  
  return parts.join('\n');
}

/**
 * Send alert for security event
 */
export async function alertSecurityEvent(
  eventType: string,
  severity: string,
  ipAddress: string,
  userAgent?: string | null,
  endpoint?: string,
  metadata?: any
): Promise<void> {
  if (!shouldSendAlert(eventType, severity, ipAddress)) {
    return;
  }
  
  const message = formatAlertMessage(
    eventType,
    severity,
    ipAddress,
    userAgent,
    endpoint,
    metadata
  );
  
  await sendSlackAlert(message, severity as any);
}
