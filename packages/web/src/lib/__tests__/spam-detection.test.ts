import { checkForSpam, recordSubmission } from '../spam-detection';

describe('Spam Detection', () => {
  const validData = {
    name: 'John Doe',
    email: 'john@example.com',
    message: 'Hello, I would like to inquire about your services. Thank you.',
    loadedAt: Date.now() - 10000,
    submittedAt: Date.now()
  };
  const ip = '127.0.0.1';

  it('should allow legitimate submissions', () => {
    const result = checkForSpam(validData, ip);
    expect(result.isSpam).toBe(false);
    expect(result.shouldBlock).toBe(false);
  });

  it('should detect honeypot spam', () => {
    const spamData = { ...validData, honeypot: 'bot-content' };
    const result = checkForSpam(spamData, ip);
    expect(result.isSpam).toBe(true);
    expect(result.shouldBlock).toBe(true);
    expect(result.reasons).toContain('Honeypot field filled');
  });

  it('should detect fast submissions (bot behavior)', () => {
    const fastData = { 
      ...validData, 
      loadedAt: Date.now(), 
      submittedAt: Date.now() + 500 // 500ms is too fast
    };
    const result = checkForSpam(fastData, ip + '2');
    expect(result.isSpam).toBe(true);
    expect(result.reasons).toContain('Form submitted too quickly');
  });

  it('should block disposable emails', () => {
    const spamData = { ...validData, email: 'user@mailinator.com' };
    const result = checkForSpam(spamData, ip + '3');
    expect(result.isSpam).toBe(true);
    expect(result.reasons).toContain('Disposable email address detected');
  });

  it('should detect spam keywords', () => {
    const spamData = { ...validData, message: 'Buy cheap viagra now! Get a prize and click here for crypto bitcoin lottery!' };
    const result = checkForSpam(spamData, ip + '4');
    expect(result.isSpam).toBe(true);
    expect(result.reasons[0]).toContain('Spam keywords detected');
  });

  it('should respect rate limits per IP', () => {
    const testIp = '10.0.0.1';
    // Max is 3 per hour
    for (let i = 0; i < 3; i++) {
      recordSubmission(testIp);
    }
    
    const result = checkForSpam(validData, testIp);
    expect(result.shouldBlock).toBe(true);
    expect(result.reasons[0]).toContain('Rate limit exceeded');
  });
});
