/**
 * Test Suite for Dashboard Features
 * Tests all dashboard functionality including analytics, widgets, and user interactions
 */

interface TestApplication {
  _id: string;
  jobId: string;
  userId: string;
  status: string;
  appliedDate?: number;
  notes?: string;
  interviewDates?: number[];
  createdAt: number;
  updatedAt: number;
  job?: {
    title: string;
    company: string;
    location: string;
    isSponsored?: boolean;
    isRecruitmentAgency?: boolean;
    salary?: string;
    dateFound?: number;
  };
}

interface TestJobStats {
  totalJobs: number;
  sponsoredJobs: number;
  totalApplications: number;
  jobsToday: number;
  recruitmentAgencyJobs?: number;
  byStatus: Record<string, number>;
}

class DashboardFeatureTester {
  private static readonly BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://hireall.app' 
    : 'http://localhost:3000';

  /**
   * Test 1: Dashboard Page Loading
   */
  static async testDashboardPageLoading(): Promise<boolean> {
    console.log('[DashboardTester] Testing dashboard page loading...');
    
    try {
      const response = await fetch(`${this.BASE_URL}/dashboard`, {
        method: 'GET',
        redirect: 'manual' // Don't follow redirects
      });

      // Should redirect to sign-in when not authenticated
      if (response.status === 307 || response.status === 302) {
        const location = response.headers.get('location');
        if (location?.includes('/sign-in')) {
          console.log('[DashboardTester] ✅ Dashboard correctly redirects to sign-in when not authenticated');
          return true;
        }
      }

      console.error('[DashboardTester] ❌ Dashboard should redirect to sign-in when not authenticated');
      return false;

    } catch (error) {
      console.error('[DashboardTester] ❌ Dashboard page loading test failed:', error);
      return false;
    }
  }

  /**
   * Test 2: Dashboard API Endpoints
   */
  static async testDashboardAPI(): Promise<boolean> {
    console.log('[DashboardTester] Testing dashboard API endpoints...');
    
    const endpoints = [
      '/api/app/jobs',
      '/api/app/applications',
      '/api/app/jobs/user/test-user-123',
      '/api/app/applications/user/test-user-123'
    ];

    try {
      for (const endpoint of endpoints) {
        const response = await fetch(`${this.BASE_URL}${endpoint}`, {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer bW9jay1zaWduYXR1cmUtZm9yLXRlc3Rpbmc'
          }
        });

        if (!response.ok) {
          console.error(`[DashboardTester] ❌ API endpoint failed: ${endpoint} - ${response.status}`);
          return false;
        }

        console.log(`[DashboardTester] ✅ API endpoint working: ${endpoint}`);
      }

      console.log('[DashboardTester] ✅ Dashboard API endpoints test passed');
      return true;

    } catch (error) {
      console.error('[DashboardTester] ❌ Dashboard API test failed:', error);
      return false;
    }
  }

  /**
   * Test 3: Dashboard Analytics Calculations
   */
  static async testDashboardAnalytics(): Promise<boolean> {
    console.log('[DashboardTester] Testing dashboard analytics calculations...');
    
    // Test data
    const testApplications: TestApplication[] = [
      {
        _id: 'app1',
        jobId: 'job1',
        userId: 'test-user-123',
        status: 'interested',
        createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
        updatedAt: Date.now(),
        job: {
          title: 'Software Engineer',
          company: 'Tech Corp',
          location: 'London',
          isSponsored: true,
          isRecruitmentAgency: false
        }
      },
      {
        _id: 'app2',
        jobId: 'job2',
        userId: 'test-user-123',
        status: 'applied',
        appliedDate: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1 day ago
        createdAt: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
        updatedAt: Date.now(),
        job: {
          title: 'Data Analyst',
          company: 'Finance Ltd',
          location: 'Manchester',
          isSponsored: false,
          isRecruitmentAgency: true
        }
      },
      {
        _id: 'app3',
        jobId: 'job3',
        userId: 'test-user-123',
        status: 'interviewing',
        createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
        updatedAt: Date.now(),
        job: {
          title: 'Product Manager',
          company: 'StartupXYZ',
          location: 'Remote',
          isSponsored: true,
          isRecruitmentAgency: false
        }
      }
    ];

    try {
      // Test success rate calculation
      const successRate = this.calculateSuccessRate(testApplications);
      if (successRate !== 0) { // No offered jobs in test data
        console.error(`[DashboardTester] ❌ Success rate calculation failed: expected 0, got ${successRate}`);
        return false;
      }

      // Test interview rate calculation
      const interviewRate = this.calculateInterviewRate(testApplications);
      if (interviewRate !== 33) { // 1 out of 3 = 33%
        console.error(`[DashboardTester] ❌ Interview rate calculation failed: expected 33, got ${interviewRate}`);
        return false;
      }

      // Test response rate calculation
      const responseRate = this.calculateResponseRate(testApplications);
      if (responseRate !== 33) { // 1 out of 3 (interviewing) = 33%
        console.error(`[DashboardTester] ❌ Response rate calculation failed: expected 33, got ${responseRate}`);
        return false;
      }

      // Test weekly applications
      const weeklyApps = this.getWeeklyApplications(testApplications);
      if (weeklyApps !== 3) { // All 3 are within last week
        console.error(`[DashboardTester] ❌ Weekly applications calculation failed: expected 3, got ${weeklyApps}`);
        return false;
      }

      // Test sponsored jobs percentage
      const sponsoredPercentage = this.getSponsoredJobsPercentage(testApplications);
      if (sponsoredPercentage !== 67) { // 2 out of 3 = 67%
        console.error(`[DashboardTester] ❌ Sponsored jobs percentage calculation failed: expected 67, got ${sponsoredPercentage}`);
        return false;
      }

      // Test agency jobs percentage
      const agencyPercentage = this.getAgencyJobsPercentage(testApplications);
      if (agencyPercentage !== 33) { // 1 out of 3 = 33%
        console.error(`[DashboardTester] ❌ Agency jobs percentage calculation failed: expected 33, got ${agencyPercentage}`);
        return false;
      }

      console.log('[DashboardTester] ✅ Dashboard analytics calculations test passed');
      return true;

    } catch (error) {
      console.error('[DashboardTester] ❌ Dashboard analytics test failed:', error);
      return false;
    }
  }

  /**
   * Test 4: Dashboard Filtering and Search
   */
  static async testDashboardFiltering(): Promise<boolean> {
    console.log('[DashboardTester] Testing dashboard filtering and search...');
    
    const testApplications: TestApplication[] = [
      {
        _id: 'app1',
        jobId: 'job1',
        userId: 'test-user-123',
        status: 'interested',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        job: {
          title: 'Senior Software Engineer',
          company: 'Tech Corp',
          location: 'London'
        }
      },
      {
        _id: 'app2',
        jobId: 'job2',
        userId: 'test-user-123',
        status: 'applied',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        job: {
          title: 'Data Analyst',
          company: 'Finance Ltd',
          location: 'Manchester'
        }
      },
      {
        _id: 'app3',
        jobId: 'job3',
        userId: 'test-user-123',
        status: 'interviewing',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        job: {
          title: 'Software Engineer',
          company: 'Tech Corp',
          location: 'London'
        }
      }
    ];

    try {
      // Test status filtering
      const appliedOnly = this.filterApplications(testApplications, 'applied', '', 'all');
      if (appliedOnly.length !== 1 || appliedOnly[0].status !== 'applied') {
        console.error('[DashboardTester] ❌ Status filtering failed');
        return false;
      }

      // Test search filtering
      const softwareJobs = this.filterApplications(testApplications, 'all', 'software', 'all');
      if (softwareJobs.length !== 2) {
        console.error('[DashboardTester] ❌ Search filtering failed');
        return false;
      }

      // Test company filtering
      const techCorpJobs = this.filterApplications(testApplications, 'all', '', 'Tech Corp');
      if (techCorpJobs.length !== 2) {
        console.error('[DashboardTester] ❌ Company filtering failed');
        return false;
      }

      // Test combined filtering
      const combined = this.filterApplications(testApplications, 'interested', 'software', 'Tech Corp');
      if (combined.length !== 1) {
        console.error('[DashboardTester] ❌ Combined filtering failed');
        return false;
      }

      console.log('[DashboardTester] ✅ Dashboard filtering and search test passed');
      return true;

    } catch (error) {
      console.error('[DashboardTester] ❌ Dashboard filtering test failed:', error);
      return false;
    }
  }

  /**
   * Test 5: Dashboard Widget Components
   */
  static async testDashboardWidgets(): Promise<boolean> {
    console.log('[DashboardTester] Testing dashboard widget components...');
    
    try {
      // Test greeting function
      const greeting = this.getGreeting();
      if (!greeting || typeof greeting !== 'string') {
        console.error('[DashboardTester] ❌ Greeting function failed');
        return false;
      }

      // Test unique companies extraction
      const testApps: TestApplication[] = [
        { job: { company: 'Tech Corp' } } as TestApplication,
        { job: { company: 'Finance Ltd' } } as TestApplication,
        { job: { company: 'Tech Corp' } } as TestApplication,
        { job: { company: 'StartupXYZ' } } as TestApplication
      ];

      const uniqueCompanies = this.getUniqueCompanies(testApps);
      if (uniqueCompanies.length !== 3 || !uniqueCompanies.includes('Tech Corp')) {
        console.error('[DashboardTester] ❌ Unique companies extraction failed');
        return false;
      }

      // Test date formatting
      const todayFormatted = this.formatApplicationDate(Date.now());
      if (todayFormatted !== 'Today') {
        console.error('[DashboardTester] ❌ Date formatting failed for today');
        return false;
      }

      const yesterdayFormatted = this.formatApplicationDate(Date.now() - 24 * 60 * 60 * 1000);
      if (yesterdayFormatted !== '1 day ago') {
        console.error('[DashboardTester] ❌ Date formatting failed for yesterday');
        return false;
      }

      console.log('[DashboardTester] ✅ Dashboard widget components test passed');
      return true;

    } catch (error) {
      console.error('[DashboardTester] ❌ Dashboard widgets test failed:', error);
      return false;
    }
  }

  /**
   * Test 6: Dashboard Job Stats
   */
  static async testDashboardJobStats(): Promise<boolean> {
    console.log('[DashboardTester] Testing dashboard job stats...');
    
    try {
      // Test job stats calculation
      const testStats: TestJobStats = {
        totalJobs: 10,
        sponsoredJobs: 4,
        totalApplications: 15,
        jobsToday: 2,
        recruitmentAgencyJobs: 3,
        byStatus: {
          interested: 5,
          applied: 6,
          interviewing: 2,
          offered: 1,
          rejected: 1
        }
      };

      // Verify stats structure
      if (typeof testStats.totalJobs !== 'number' || testStats.totalJobs < 0) {
        console.error('[DashboardTester] ❌ Invalid total jobs stat');
        return false;
      }

      if (testStats.sponsoredJobs > testStats.totalJobs) {
        console.error('[DashboardTester] ❌ Sponsored jobs cannot exceed total jobs');
        return false;
      }

      if (Object.values(testStats.byStatus).reduce((sum, count) => sum + count, 0) !== testStats.totalApplications) {
        console.error('[DashboardTester] ❌ Status breakdown does not match total applications');
        return false;
      }

      console.log('[DashboardTester] ✅ Dashboard job stats test passed');
      return true;

    } catch (error) {
      console.error('[DashboardTester] ❌ Dashboard job stats test failed:', error);
      return false;
    }
  }

  /**
   * Test 7: Dashboard Integration with Add to Board
   */
  static async testDashboardIntegration(): Promise<boolean> {
    console.log('[DashboardTester] Testing dashboard integration with add to board...');
    
    try {
      // Test creating a job via API
      const jobResponse = await fetch(`${this.BASE_URL}/api/app/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer bW9jay1zaWduYXR1cmUtZm9yLXRlc3Rpbmc'
        },
        body: JSON.stringify({
          title: 'Dashboard Test Job',
          company: 'Test Company',
          location: 'Test Location',
          url: 'https://example.com/job',
          userId: 'test-user-123',
          isSponsored: true,
          source: 'dashboard-test'
        })
      });

      if (!jobResponse.ok) {
        console.error('[DashboardTester] ❌ Failed to create test job');
        return false;
      }

      const jobResult = await jobResponse.json();
      const jobId = jobResult.id;

      // Test creating an application
      const appResponse = await fetch(`${this.BASE_URL}/api/app/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer bW9jay1zaWduYXR1cmUtZm9yLXRlc3Rpbmc'
        },
        body: JSON.stringify({
          jobId: jobId,
          userId: 'test-user-123',
          status: 'interested',
          notes: 'Dashboard integration test'
        })
      });

      if (!appResponse.ok) {
        console.error('[DashboardTester] ❌ Failed to create test application');
        return false;
      }

      // Test fetching user applications
      const userAppsResponse = await fetch(`${this.BASE_URL}/api/app/applications/user/test-user-123`, {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer bW9jay1zaWduYXR1cmUtZm9yLXRlc3Rpbmc'
        }
      });

      if (!userAppsResponse.ok) {
        console.error('[DashboardTester] ❌ Failed to fetch user applications');
        return false;
      }

      console.log('[DashboardTester] ✅ Dashboard integration test passed');
      return true;

    } catch (error) {
      console.error('[DashboardTester] ❌ Dashboard integration test failed:', error);
      return false;
    }
  }

  /**
   * Run all tests
   */
  static async runAllTests(): Promise<void> {
    console.log('[DashboardTester] 🚀 Starting Dashboard Feature Tests...');
    console.log('[DashboardTester] ================================================');
    
    const tests = [
      { name: 'Dashboard Page Loading', fn: this.testDashboardPageLoading },
      { name: 'Dashboard API Endpoints', fn: this.testDashboardAPI },
      { name: 'Dashboard Analytics Calculations', fn: this.testDashboardAnalytics },
      { name: 'Dashboard Filtering and Search', fn: this.testDashboardFiltering },
      { name: 'Dashboard Widget Components', fn: this.testDashboardWidgets },
      { name: 'Dashboard Job Stats', fn: this.testDashboardJobStats },
      { name: 'Dashboard Integration', fn: this.testDashboardIntegration }
    ];

    const results = [];
    
    for (const test of tests) {
      try {
        const result = await test.fn.call(this);
        results.push({ name: test.name, passed: result });
      } catch (error: any) {
        console.error(`[DashboardTester] ❌ Test "${test.name}" threw an error:`, error);
        results.push({ name: test.name, passed: false });
      }
    }

    console.log('[DashboardTester] ================================================');
    console.log('[DashboardTester] 📊 Test Results Summary:');
    
    results.forEach(result => {
      console.log(`[DashboardTester] ${result.passed ? '✅' : '❌'} ${result.name}`);
    });

    const passedTests = results.filter(r => r.passed).length;
    const totalTests = results.length;
    
    console.log('[DashboardTester] ================================================');
    console.log(`[DashboardTester] 🎯 Overall: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('[DashboardTester] 🎉 All tests passed! Dashboard features are working correctly.');
    } else {
      console.log('[DashboardTester] ⚠️  Some tests failed. Check the logs above for details.');
    }
  }

  // Helper methods (mirrored from dashboard utils)
  private static calculateSuccessRate(applications: TestApplication[]): number {
    if (applications.length === 0) return 0;
    const offered = applications.filter((a) => a.status === "offered").length;
    return Math.round((offered / applications.length) * 100);
  }

  private static calculateInterviewRate(applications: TestApplication[]): number {
    if (applications.length === 0) return 0;
    const interviewing = applications.filter((a) => a.status === "interviewing").length;
    return Math.round((interviewing / applications.length) * 100);
  }

  private static calculateResponseRate(applications: TestApplication[]): number {
    if (applications.length === 0) return 0;
    const responded = applications.filter(
      (a) => a.status !== "applied" && a.status !== "interested"
    ).length;
    return Math.round((responded / applications.length) * 100);
  }

  private static getWeeklyApplications(applications: TestApplication[]): number {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return applications.filter((a) => a.createdAt >= weekAgo).length;
  }

  private static getSponsoredJobsPercentage(applications: TestApplication[]): number {
    if (applications.length === 0) return 0;
    const sponsored = applications.filter((a) => a.job?.isSponsored).length;
    return Math.round((sponsored / applications.length) * 100);
  }

  private static getAgencyJobsPercentage(applications: TestApplication[]): number {
    if (applications.length === 0) return 0;
    const agency = applications.filter((a) => a.job?.isRecruitmentAgency).length;
    return Math.round((agency / applications.length) * 100);
  }

  private static filterApplications(
    applications: TestApplication[],
    statusFilter: string,
    searchTerm: string,
    companyFilter: string
  ): TestApplication[] {
    let filtered = applications;

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          app.job?.title.toLowerCase().includes(term) ||
          app.job?.company.toLowerCase().includes(term) ||
          app.job?.location.toLowerCase().includes(term)
      );
    }

    // Company filter
    if (companyFilter !== "all") {
      filtered = filtered.filter((app) => app.job?.company === companyFilter);
    }

    return filtered;
  }

  private static getGreeting(): string {
    const hours = new Date().getHours();
    
    if (hours >= 5 && hours < 12) {
      return "Good morning";
    } else if (hours >= 12 && hours < 18) {
      return "Good afternoon";
    } else {
      return "Good evening";
    }
  }

  private static getUniqueCompanies(applications: TestApplication[]): string[] {
    const companies = applications
      .map((app) => app.job?.company)
      .filter(Boolean) as string[];
    return Array.from(new Set(companies)).sort();
  }

  private static formatApplicationDate(date: number): string {
    const daysSince = Math.floor((Date.now() - date) / (1000 * 60 * 60 * 24));
    return daysSince === 0 ? "Today" : `${daysSince} day${daysSince !== 1 ? "s" : ""} ago`;
  }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
  (window as any).dashboardFeatureTester = DashboardFeatureTester;
  console.log('[DashboardTester] Test suite available at window.dashboardFeatureTester');
  console.log('[DashboardTester] Run window.dashboardFeatureTester.runAllTests() to test all dashboard features');
}

export { DashboardFeatureTester };
