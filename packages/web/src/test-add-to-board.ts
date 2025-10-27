/**
 * Test Suite for "Add to Board" Functionality
 * Tests the complete workflow from job extraction to board management
 */

interface TestJobData {
  title: string;
  company: string;
  location: string;
  url: string;
  description?: string;
  salary?: string;
  isSponsored?: boolean;
  source?: string;
}

interface JobBoardEntry {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  status: string;
  dateAdded: string;
}

class AddToBoardTester {
  private static readonly BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://hireall.app' 
    : 'http://localhost:3000';

  /**
   * Test 1: Job Creation API
   */
  static async testJobCreation(): Promise<boolean> {
    console.log('[AddToBoardTester] Testing job creation API...');
    
    const testJob: TestJobData = {
      title: 'Senior Software Engineer',
      company: 'Tech Solutions Ltd',
      location: 'London, England, United Kingdom',
      url: 'https://linkedin.com/jobs/view/senior-software-engineer-123456',
      description: 'We are looking for a Senior Software Engineer with experience in React, Node.js, and cloud technologies.',
      salary: '£65,000 - £85,000 per year',
      isSponsored: true,
      source: 'linkedin'
    };

    try {
      const response = await fetch(`${this.BASE_URL}/api/app/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer bW9jay1zaWduYXR1cmUtZm9yLXRlc3Rpbmc'
        },
        body: JSON.stringify({
          ...testJob,
          userId: 'test-user-id',
          skills: ['React', 'Node.js', 'TypeScript', 'AWS'],
          requirements: ['5+ years experience', 'Computer Science degree'],
          benefits: ['Health insurance', 'Flexible working'],
          jobType: 'Full-time',
          experienceLevel: 'Senior',
          remoteWork: true,
          companySize: '1000+',
          industry: 'Technology',
          postedDate: new Date().toISOString(),
          isRecruitmentAgency: false,
          sponsorshipType: 'visa_sponsorship'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`[AddToBoardTester] ❌ Job creation failed:`, errorData);
        return false;
      }

      const result = await response.json();
      
      if (!result.id) {
        console.error('[AddToBoardTester] ❌ No job ID returned from creation');
        return false;
      }

      console.log(`[AddToBoardTester] ✅ Job created successfully with ID: ${result.id}`);
      return true;

    } catch (error) {
      console.error('[AddToBoardTester] ❌ Job creation test failed:', error);
      return false;
    }
  }

  /**
   * Test 2: Application Creation API
   */
  static async testApplicationCreation(): Promise<boolean> {
    console.log('[AddToBoardTester] Testing application creation API...');
    
    try {
      // First create a job
      const jobResponse = await fetch(`${this.BASE_URL}/api/app/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer bW9jay1zaWduYXR1cmUtZm9yLXRlc3Rpbmc'
        },
        body: JSON.stringify({
          title: 'Data Analyst',
          company: 'Finance Corp',
          location: 'Manchester, UK',
          url: 'https://linkedin.com/jobs/view/data-analyst-789012',
          userId: 'test-user-id',
          source: 'linkedin'
        })
      });

      if (!jobResponse.ok) {
        console.error('[AddToBoardTester] ❌ Failed to create job for application test');
        return false;
      }

      const jobResult = await jobResponse.json();
      const jobId = jobResult.id;

      // Now create an application
      const applicationResponse = await fetch(`${this.BASE_URL}/api/app/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer bW9jay1zaWduYXR1cmUtZm9yLXRlc3Rpbmc'
        },
        body: JSON.stringify({
          jobId: jobId,
          userId: 'test-user-id',
          status: 'interested',
          notes: 'Found through LinkedIn search, matches my skills perfectly',
          appliedDate: null
        })
      });

      if (!applicationResponse.ok) {
        const errorData = await applicationResponse.json();
        console.error(`[AddToBoardTester] ❌ Application creation failed:`, errorData);
        return false;
      }

      const applicationResult = await applicationResponse.json();
      
      if (!applicationResult.id) {
        console.error('[AddToBoardTester] ❌ No application ID returned from creation');
        return false;
      }

      console.log(`[AddToBoardTester] ✅ Application created successfully with ID: ${applicationResult.id}`);
      return true;

    } catch (error) {
      console.error('[AddToBoardTester] ❌ Application creation test failed:', error);
      return false;
    }
  }

  /**
   * Test 3: Job Validation and Error Handling
   */
  static async testJobValidation(): Promise<boolean> {
    console.log('[AddToBoardTester] Testing job validation and error handling...');
    
    const invalidJobs = [
      {
        name: 'Missing title',
        data: {
          company: 'Tech Corp',
          location: 'London',
          url: 'https://example.com',
          userId: 'test-user-id'
        }
      },
      {
        name: 'Invalid URL',
        data: {
          title: 'Software Engineer',
          company: 'Tech Corp',
          location: 'London',
          url: 'not-a-valid-url',
          userId: 'test-user-id'
        }
      },
      {
        name: 'Missing user ID',
        data: {
          title: 'Software Engineer',
          company: 'Tech Corp',
          location: 'London',
          url: 'https://example.com/job'
        }
      }
    ];

    try {
      for (const test of invalidJobs) {
        const response = await fetch(`${this.BASE_URL}/api/app/jobs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer bW9jay1zaWduYXR1cmUtZm9yLXRlc3Rpbmc'
          },
          body: JSON.stringify(test.data)
        });

        if (response.ok) {
          console.error(`[AddToBoardTester] ❌ Validation should have failed for: ${test.name}`);
          return false;
        }

        const errorData = await response.json();
        if (!errorData.error) {
          console.error(`[AddToBoardTester] ❌ No error message returned for: ${test.name}`);
          return false;
        }

        console.log(`[AddToBoardTester] ✅ Validation correctly failed for: ${test.name} - ${errorData.error}`);
      }

      console.log('[AddToBoardTester] ✅ Job validation test passed');
      return true;

    } catch (error) {
      console.error('[AddToBoardTester] ❌ Job validation test failed:', error);
      return false;
    }
  }

  /**
   * Test 4: Complete Add to Board Workflow
   */
  static async testCompleteWorkflow(): Promise<boolean> {
    console.log('[AddToBoardTester] Testing complete add to board workflow...');
    
    const testJob: TestJobData = {
      title: 'IT Project Manager',
      company: 'Digital Solutions Ltd',
      location: 'Birmingham, England',
      url: 'https://linkedin.com/jobs/view/it-project-manager-345678',
      description: 'IT Project Manager required for leading digital transformation projects.',
      salary: '£55,000 per year',
      isSponsored: true,
      source: 'linkedin'
    };

    try {
      // Step 1: Create job
      const jobResponse = await fetch(`${this.BASE_URL}/api/app/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer bW9jay1zaWduYXR1cmUtZm9yLXRlc3Rpbmc'
        },
        body: JSON.stringify({
          ...testJob,
          userId: 'test-user-id',
          skills: ['Project Management', 'Agile', 'Scrum', 'ITIL'],
          requirements: ['PMP Certification', '5+ years experience'],
          benefits: ['Company car', 'Bonus scheme'],
          jobType: 'Full-time',
          experienceLevel: 'Mid-level',
          remoteWork: false,
          companySize: '500-1000',
          industry: 'Information Technology',
          postedDate: new Date().toISOString(),
          isRecruitmentAgency: false,
          sponsorshipType: 'visa_sponsorship',
          jobScore: 85 // High priority job
        })
      });

      if (!jobResponse.ok) {
        console.error('[AddToBoardTester] ❌ Step 1 failed: Job creation');
        return false;
      }

      const jobResult = await jobResponse.json();
      const jobId = jobResult.id;

      // Step 2: Create application with "interested" status
      const applicationResponse = await fetch(`${this.BASE_URL}/api/app/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer bW9jay1zaWduYXR1cmUtZm9yLXRlc3Rpbmc'
        },
        body: JSON.stringify({
          jobId: jobId,
          userId: 'test-user-id',
          status: 'interested',
          notes: 'SOC Code: 2133 (Confidence: 95.2%) | Department: IT | Seniority: Mid-level | Key skills: Project Management, Agile, Scrum, ITIL | Location: On-site | Salary: £55,000 per year',
          appliedDate: null
        })
      });

      if (!applicationResponse.ok) {
        console.error('[AddToBoardTester] ❌ Step 2 failed: Application creation');
        return false;
      }

      const applicationResult = await applicationResponse.json();
      const applicationId = applicationResult.id;

      console.log('[AddToBoardTester] 📊 Complete Workflow Results:');
      console.log(`  - Job ID: ${jobId}`);
      console.log(`  - Application ID: ${applicationId}`);
      console.log(`  - Job Title: ${testJob.title}`);
      console.log(`  - Company: ${testJob.company}`);
      console.log(`  - Status: interested`);
      console.log(`  - Sponsored: ${testJob.isSponsored ? 'Yes' : 'No'}`);
      console.log(`  - Job Score: 85 (High Priority)`);

      console.log('[AddToBoardTester] ✅ Complete workflow test passed');
      return true;

    } catch (error) {
      console.error('[AddToBoardTester] ❌ Complete workflow test failed:', error);
      return false;
    }
  }

  /**
   * Test 5: LinkedIn Job Data Extraction Simulation
   */
  static async testLinkedInJobExtraction(): Promise<boolean> {
    console.log('[AddToBoardTester] Testing LinkedIn job data extraction simulation...');
    
    // Simulate various LinkedIn job formats
    const linkedInJobs = [
      {
        title: 'Senior Software Engineer (React/Node.js)',
        company: 'Tech Innovations Ltd',
        location: 'London, England, United Kingdom',
        salary: '£70,000 - £90,000 per year',
        description: 'Senior Software Engineer with expertise in React and Node.js for our London office.'
      },
      {
        title: 'Data Scientist - Machine Learning',
        company: 'AI Analytics Corp',
        location: 'Manchester, UK',
        salary: '£60k-£75k',
        description: 'Machine Learning Data Scientist position with focus on NLP and computer vision.'
      },
      {
        title: 'Full Stack Developer',
        company: 'StartupHub',
        location: 'Remote - UK Based',
        salary: 'Competitive',
        description: 'Full Stack Developer for fast-growing startup.'
      }
    ];

    try {
      for (let i = 0; i < linkedInJobs.length; i++) {
        const job = linkedInJobs[i];
        
        // Simulate the extraction process
        const extractedJob = {
          title: job.title.trim(),
          company: job.company.trim(),
          location: job.location.trim(),
          url: `https://linkedin.com/jobs/view/job-${i + 1}`,
          description: job.description?.trim(),
          salary: job.salary?.trim(),
          isSponsored: Math.random() > 0.5,
          source: 'linkedin',
          dateFound: new Date().toISOString()
        };

        // Test creating the job with extracted data
        const response = await fetch(`${this.BASE_URL}/api/app/jobs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer bW9jay1zaWduYXR1cmUtZm9yLXRlc3Rpbmc'
          },
          body: JSON.stringify({
            ...extractedJob,
            userId: 'test-user-id',
            skills: this.extractSkills(job.title, job.description),
            jobType: 'Full-time',
            experienceLevel: this.extractExperienceLevel(job.title),
            remoteWork: job.location.includes('Remote'),
            industry: 'Technology'
          })
        });

        if (!response.ok) {
          console.error(`[AddToBoardTester] ❌ Failed to create extracted job ${i + 1}`);
          return false;
        }

        const result = await response.json();
        console.log(`[AddToBoardTester] ✅ LinkedIn job ${i + 1} extracted and added: ${extractedJob.title}`);
      }

      console.log('[AddToBoardTester] ✅ LinkedIn job extraction simulation test passed');
      return true;

    } catch (error) {
      console.error('[AddToBoardTester] ❌ LinkedIn job extraction simulation test failed:', error);
      return false;
    }
  }

  /**
   * Test 6: Board Management Operations
   */
  static async testBoardManagement(): Promise<boolean> {
    console.log('[AddToBoardTester] Testing board management operations...');
    
    try {
      // Create multiple jobs to test board operations
      const jobIds = [];
      
      for (let i = 0; i < 3; i++) {
        const jobResponse = await fetch(`${this.BASE_URL}/api/app/jobs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer bW9jay1zaWduYXR1cmUtZm9yLXRlc3Rpbmc'
          },
          body: JSON.stringify({
            title: `Test Job ${i + 1}`,
            company: `Test Company ${i + 1}`,
            location: `Test City ${i + 1}`,
            url: `https://example.com/job-${i + 1}`,
            userId: 'test-user-id',
            source: 'test'
          })
        });

        if (jobResponse.ok) {
          const jobResult = await jobResponse.json();
          jobIds.push(jobResult.id);
        }
      }

      if (jobIds.length === 0) {
        console.error('[AddToBoardTester] ❌ No jobs created for board management test');
        return false;
      }

      // Create applications for each job with different statuses
      const statuses = ['interested', 'applied', 'interviewing'];
      
      for (let i = 0; i < jobIds.length; i++) {
        const applicationResponse = await fetch(`${this.BASE_URL}/api/app/applications`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer bW9jay1zaWduYXR1cmUtZm9yLXRlc3Rpbmc'
          },
          body: JSON.stringify({
            jobId: jobIds[i],
            userId: 'test-user-id',
            status: statuses[i],
            notes: `Test notes for job ${i + 1}`,
            appliedDate: statuses[i] === 'applied' ? Date.now() : null
          })
        });

        if (!applicationResponse.ok) {
          console.error(`[AddToBoardTester] ❌ Failed to create application for job ${i + 1}`);
          return false;
        }

        console.log(`[AddToBoardTester] ✅ Created application with status: ${statuses[i]}`);
      }

      console.log('[AddToBoardTester] ✅ Board management operations test passed');
      return true;

    } catch (error) {
      console.error('[AddToBoardTester] ❌ Board management operations test failed:', error);
      return false;
    }
  }

  /**
   * Run all tests
   */
  static async runAllTests(): Promise<void> {
    console.log('[AddToBoardTester] 🚀 Starting Add to Board Tests...');
    console.log('[AddToBoardTester] ================================================');
    
    const tests = [
      { name: 'Job Creation API', fn: this.testJobCreation },
      { name: 'Application Creation API', fn: this.testApplicationCreation },
      { name: 'Job Validation and Error Handling', fn: this.testJobValidation },
      { name: 'Complete Add to Board Workflow', fn: this.testCompleteWorkflow },
      { name: 'LinkedIn Job Data Extraction', fn: this.testLinkedInJobExtraction },
      { name: 'Board Management Operations', fn: this.testBoardManagement }
    ];

    const results = [];
    
    for (const test of tests) {
      try {
        const result = await test.fn.call(this);
        results.push({ name: test.name, passed: result });
      } catch (error: any) {
        console.error(`[AddToBoardTester] ❌ Test "${test.name}" threw an error:`, error);
        results.push({ name: test.name, passed: false });
      }
    }

    console.log('[AddToBoardTester] ================================================');
    console.log('[AddToBoardTester] 📊 Test Results Summary:');
    
    results.forEach(result => {
      console.log(`[AddToBoardTester] ${result.passed ? '✅' : '❌'} ${result.name}`);
    });

    const passedTests = results.filter(r => r.passed).length;
    const totalTests = results.length;
    
    console.log('[AddToBoardTester] ================================================');
    console.log(`[AddToBoardTester] 🎯 Overall: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('[AddToBoardTester] 🎉 All tests passed! Add to Board functionality is working correctly.');
    } else {
      console.log('[AddToBoardTester] ⚠️  Some tests failed. Check the logs above for details.');
    }
  }

  // Helper methods
  private static extractSkills(title: string, description?: string): string[] {
    const skills: string[] = [];
    const skillKeywords = ['React', 'Node.js', 'Python', 'Java', 'JavaScript', 'TypeScript', 'AWS', 'Azure', 'Docker', 'Kubernetes', 'Agile', 'Scrum'];
    
    const text = `${title} ${description || ''}`.toLowerCase();
    
    skillKeywords.forEach(skill => {
      if (text.includes(skill.toLowerCase())) {
        skills.push(skill);
      }
    });
    
    return skills;
  }

  private static extractExperienceLevel(title: string): string {
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('senior') || titleLower.includes('lead') || titleLower.includes('principal')) {
      return 'Senior';
    } else if (titleLower.includes('junior') || titleLower.includes('entry') || titleLower.includes('graduate')) {
      return 'Junior';
    } else if (titleLower.includes('mid') || titleLower.includes('middle')) {
      return 'Mid-level';
    }
    
    return 'Not specified';
  }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).addToBoardTester = AddToBoardTester;
  console.log('[AddToBoardTester] Test suite available at window.addToBoardTester');
  console.log('[AddToBoardTester] Run window.addToBoardTester.runAllTests() to test all functionality');
}

export { AddToBoardTester };
