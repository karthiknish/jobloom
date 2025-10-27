import { test, expect } from '@playwright/test';
import { request, APIRequestContext } from '@playwright/test';

test.describe('API Endpoints', () => {
  let apiContext: APIRequestContext;
  let authToken: string;

  test.beforeAll(async () => {
    // Create API context
    apiContext = await request.newContext({
      baseURL: 'http://localhost:3000/api',
    });

    // Sign in to get auth token
    const response = await apiContext.post('/auth/session', {
      data: {
        email: 'test@example.com',
        password: 'testpassword123'
      }
    });
    
    if (response.status() === 200) {
      const data = await response.json();
      authToken = data.token;
    }
  });

  test.afterAll(async () => {
    await apiContext.dispose();
  });

  test.describe('Health Check', () => {
    test('should return healthy status', async () => {
      const response = await apiContext.get('/health');
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('status', 'healthy');
    });
  });

  test.describe('Authentication', () => {
    test('should create user session', async () => {
      const response = await apiContext.post('/auth/session', {
        data: {
          email: 'test@example.com',
          password: 'testpassword123'
        }
      });
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('token');
      expect(data).toHaveProperty('user');
    });

    test('should reject invalid credentials', async () => {
      const response = await apiContext.post('/auth/session', {
        data: {
          email: 'test@example.com',
          password: 'wrongpassword'
        }
      });
      
      expect(response.status()).toBe(401);
    });

    test('should get current user session', async () => {
      const response = await apiContext.get('/auth/session', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('user');
    });

    test('should sign out user', async () => {
      const response = await apiContext.delete('/auth/session', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(response.status()).toBe(200);
    });
  });

  test.describe('Jobs API', () => {
    test('should get jobs list', async () => {
      const response = await apiContext.get('/app/jobs', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('jobs');
      expect(Array.isArray(data.jobs)).toBe(true);
    });

    test('should create new job', async () => {
      const response = await apiContext.post('/app/jobs', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          title: 'Software Engineer',
          company: 'Test Company',
          location: 'London, UK',
          description: 'Test job description',
          status: 'applied'
        }
      });
      
      expect(response.status()).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty('job');
      expect(data.job.title).toBe('Software Engineer');
    });

    test('should update job status', async () => {
      // First create a job
      const createResponse = await apiContext.post('/app/jobs', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          title: 'Software Engineer',
          company: 'Test Company',
          location: 'London, UK',
          description: 'Test job description',
          status: 'applied'
        }
      });
      
      const createData = await createResponse.json();
      const jobId = createData.job.id;

      // Update job status
      const response = await apiContext.put(`/app/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          status: 'interview'
        }
      });
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.job.status).toBe('interview');
    });

    test('should delete job', async () => {
      // First create a job
      const createResponse = await apiContext.post('/app/jobs', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          title: 'Software Engineer',
          company: 'Test Company',
          location: 'London, UK',
          description: 'Test job description',
          status: 'applied'
        }
      });
      
      const createData = await createResponse.json();
      const jobId = createData.job.id;

      // Delete job
      const response = await apiContext.delete(`/app/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(response.status()).toBe(200);
    });

    test('should get job statistics', async () => {
      const response = await apiContext.get('/app/jobs/stats/test-user-id', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('stats');
      expect(data.stats).toHaveProperty('totalJobs');
      expect(data.stats).toHaveProperty('sponsoredJobs');
      expect(data.stats).toHaveProperty('applications');
    });
  });

  test.describe('CV Evaluator API', () => {
    test('should upload and analyze CV', async () => {
      const response = await apiContext.post('/cv/upload', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        multipart: {
          file: {
            name: 'test-cv.pdf',
            mimeType: 'application/pdf',
            buffer: Buffer.from('test pdf content')
          }
        }
      });
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('analysis');
      expect(data.analysis).toHaveProperty('atsScore');
    });

    test('should get CV analysis history', async () => {
      const response = await apiContext.get('/cv/user/test-user-id', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('analyses');
      expect(Array.isArray(data.analyses)).toBe(true);
    });

    test('should get CV analysis statistics', async () => {
      const response = await apiContext.get('/app/cv-analysis/stats/test-user-id', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('stats');
      expect(data.stats).toHaveProperty('totalAnalyses');
      expect(data.stats).toHaveProperty('averageAtsScore');
    });
  });

  test.describe('Sponsors API', () => {
    test('should get sponsors list', async () => {
      const response = await apiContext.get('/sponsors');
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('sponsors');
      expect(Array.isArray(data.sponsors)).toBe(true);
    });

    test('should get authenticated sponsors', async () => {
      const response = await apiContext.get('/sponsors/authenticated', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('sponsors');
      expect(Array.isArray(data.sponsors)).toBe(true);
    });

    test('should check sponsorship eligibility', async () => {
      const response = await apiContext.post('/sponsors/check', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          company: 'Test Company',
          jobTitle: 'Software Engineer',
          salary: 50000,
          location: 'London, UK'
        }
      });
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('isEligible');
      expect(data).toHaveProperty('sponsorshipType');
    });
  });

  test.describe('SOC Codes API', () => {
    test('should get SOC codes', async () => {
      const response = await apiContext.get('/soc-codes');
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('socCodes');
      expect(Array.isArray(data.socCodes)).toBe(true);
    });

    test('should get authenticated SOC codes', async () => {
      const response = await apiContext.get('/soc-codes/authenticated', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('socCodes');
      expect(Array.isArray(data.socCodes)).toBe(true);
    });
  });

  test.describe('Settings API', () => {
    test('should get user settings', async () => {
      const response = await apiContext.get('/settings/preferences', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('settings');
    });

    test('should update user settings', async () => {
      const response = await apiContext.put('/settings/preferences', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          theme: 'dark',
          language: 'en-GB',
          emailNotifications: true
        }
      });
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('settings');
      expect(data.settings.theme).toBe('dark');
    });

    test('should export settings', async () => {
      const response = await apiContext.get('/settings/export', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('settings');
      expect(data).toHaveProperty('exportDate');
    });
  });

  test.describe('Subscription API', () => {
    test('should get subscription status', async () => {
      const response = await apiContext.get('/subscription/status', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('subscription');
      expect(data.subscription).toHaveProperty('plan');
    });

    test('should create checkout session', async () => {
      const response = await apiContext.post('/stripe/create-checkout-session', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          plan: 'premium',
          successUrl: 'http://localhost:3000/upgrade/success',
          cancelUrl: 'http://localhost:3000/upgrade'
        }
      });
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('sessionId');
      expect(data).toHaveProperty('url');
    });
  });

  test.describe('Rate Limiting', () => {
    test('should handle rate limiting on CV upload', async () => {
      const promises = Array(10).fill(null).map(() =>
        apiContext.post('/cv/upload', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          },
          multipart: {
            file: {
              name: 'test-cv.pdf',
              mimeType: 'application/pdf',
              buffer: Buffer.from('test pdf content')
            }
          }
        })
      );

      const responses = await Promise.all(promises);
      
      // At least one response should be rate limited
      const rateLimitedResponses = responses.filter(res => res.status() === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    test('should get rate limit status', async () => {
      const response = await apiContext.get('/rate-limit-status', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('limits');
      expect(data).toHaveProperty('usage');
    });
  });

  test.describe('Error Handling', () => {
    test('should handle invalid JSON', async () => {
      const response = await apiContext.post('/app/jobs', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: 'invalid json'
      });
      
      expect(response.status()).toBe(400);
    });

    test('should handle missing required fields', async () => {
      const response = await apiContext.post('/app/jobs', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          title: 'Software Engineer'
          // Missing required fields
        }
      });
      
      expect(response.status()).toBe(400);
    });

    test('should handle unauthorized access', async () => {
      const response = await apiContext.get('/app/jobs');
      
      expect(response.status()).toBe(401);
    });

    test('should handle invalid token', async () => {
      const response = await apiContext.get('/app/jobs', {
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      });
      
      expect(response.status()).toBe(401);
    });

    test('should handle CORS', async () => {
      const response = await apiContext.fetch('/app/jobs', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:3000'
        }
      });
      
      expect(response.status()).toBe(200);
      expect(response.headers()['access-control-allow-origin']).toBeTruthy();
    });
  });
});
