import type { LogEntry } from './types';

const SERVICES = [
  'auth-service',
  'payment-service',
  'discount-service',
  'order-service',
  'shipping-service',
  'inventory-service',
  'notification-service'
];

const INFO_MESSAGES = [
  'User login successful for user_id=USR-{id}',
  'Order created successfully order_id=ORD-{id}',
  'Payment token generated for transaction_id=TXN-{id}',
  'Sent email notification to user_id=USR-{id}',
  'Inventory check completed for SKU-{id}',
  'Successfully applied discount code',
  'Cache hit for user profile USR-{id}',
  'Successfully generated invoice INV-{id}',
  'Shipping label printed for order_id=ORD-{id}',
  'API request completed in {time}ms'
];

const DEBUG_MESSAGES = [
  'Database connection established pool_size=20',
  'Checking cache status for key user:session:{id}',
  'Evaluating discount rules for coupon validation',
  'Garbage collection executed, freed {time}MB',
  'Payload parsed successfully: {id}',
  'HTTP GET /v1/health status=200',
  'Config loaded from Consul client',
  'Cron job trigger success for clean_tokens'
];

const WARNING_MESSAGES = [
  'Slow database query detected: {time}ms',
  'Cache miss for key user:session:{id}',
  'API response time degraded for auth-service: {time}ms',
  'Rate limit warning for client IP 192.168.1.{time}',
  'Failed lookup for discount coupon code: EXPIRED-{id}',
  'Disk usage alert: 78% on /data volume',
  'Connection pool threshold reached (80%)',
  'Retry attempt #{retry} for dependency shipping-service'
];

const ERROR_MESSAGES = [
  'payment service error: credit card processing declined',
  'database timeout: connection lost during transaction commit',
  'user login failed: password hash mismatch for USR-{id}',
  'apply discount: discount service returned HTTP 503 Service Unavailable',
  'inventory-service: Out of stock for product SKU-{id}',
  'shipping-service: Address verification failed',
  'Internal server error: NullPointerException at auth-service index.ts:42',
  'Failed to write to audit log: permission denied',
  'Failed to acquire lock for order-creation-{id}'
];

export function generateMockLogs(): LogEntry[] {
  const count = 50000;
  const logs: LogEntry[] = new Array(count);
  const now = Date.now();
  const startTime = now - 24 * 60 * 60 * 1000; // 24 hours ago
  const averageGap = (24 * 60 * 60 * 1000) / count; // ~1728ms

  // Seeded random helper for reproducible results
  let seed = 42;
  function random() {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  for (let i = 0; i < count; i++) {
    // Determine level with realistic distribution: INFO (65%), DEBUG (15%), WARNING (12%), ERROR (8%)
    const randVal = random();
    let level: LogEntry['level'];
    let messageTemplate = '';
    
    if (randVal < 0.65) {
      level = 'INFO';
      messageTemplate = INFO_MESSAGES[Math.floor(random() * INFO_MESSAGES.length)];
    } else if (randVal < 0.80) {
      level = 'DEBUG';
      messageTemplate = DEBUG_MESSAGES[Math.floor(random() * DEBUG_MESSAGES.length)];
    } else if (randVal < 0.92) {
      level = 'WARNING';
      messageTemplate = WARNING_MESSAGES[Math.floor(random() * WARNING_MESSAGES.length)];
    } else {
      level = 'ERROR';
      messageTemplate = ERROR_MESSAGES[Math.floor(random() * ERROR_MESSAGES.length)];
    }

    const service = SERVICES[Math.floor(random() * SERVICES.length)];
    const mockId = Math.floor(random() * 100000);
    const mockTime = Math.floor(random() * 300) + 50;
    const mockRetry = Math.floor(random() * 3) + 1;

    const message = messageTemplate
      .replace('{id}', mockId.toString())
      .replace('{time}', mockTime.toString())
      .replace('{retry}', mockRetry.toString());

    // Generate chronological timestamp with slight jitter
    const timestamp = startTime + i * averageGap + (random() - 0.5) * 1000;

    logs[i] = {
      id: `log-${i + 1}`,
      timestamp: Math.min(timestamp, now), // don't exceed current time
      level,
      service,
      message
    };
  }

  return logs;
}
