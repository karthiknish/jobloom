/**
 * Browser-compatible test runner for SOC and Sponsorship functionality
 * Copy this code and run in browser console on localhost:3000
 */

(function() {
  'use strict';

  const BASE_URL = window.location.origin;
  
  const UK_VISA_STANDARDS = {
    MINIMUM_SALARY: 38700,
    MINIMUM_SALARY_UNDER_26: 30960,
    MINIMUM_SALARY_NEW_ENTRANT: 25600,
    PHD_MINIMUM_SALARY: 30960,
    STEM_PHD_MINIMUM_SALARY: 25600,
    ELIGIBLE_SOC_LEVELS: ['Higher Skilled', 'High Skilled', 'Skilled'],
    SKILLED_WORKER_ROUTE: 'Skilled Worker'
  };

  class SOCSponsorshipTester {
    static async testSOCCodeSearch() {
      console.log('[SOCSponsorshipTester] Testing SOC code search...');
      
      const testQueries = ['engineer', 'software', 'manager', 'director', 'technician'];

      try {
        for (const query of testQueries) {
          const response = await fetch(`${BASE_URL}/api/soc-codes?q=${encodeURIComponent(query)}`);
          
          if (!response.ok) {
            console.error(`❌ SOC API request failed for query: ${query}`);
            return false;
          }

          const data = await response.json();
          
          if (!data.success || data.results.length === 0) {
            console.error(`❌ No SOC results found for query: ${query}`);
            return false;
          }

          const topResult = data.results[0];
          console.log(`✅ Found SOC ${topResult.code} - ${topResult.jobType} for "${query}" (Eligibility: ${topResult.eligibility})`);
        }

        console.log('✅ SOC code search test passed');
        return true;
      } catch (error) {
        console.error('❌ SOC code search test failed:', error);
        return false;
      }
    }

    static async testSponsorSearch() {
      console.log('[SOCSponsorshipTester] Testing sponsor search...');
      
      const testQueries = [
        { query: 'tech', city: 'london' },
        { query: 'technologies', city: 'london' },
        { query: 'financial', city: '' }
      ];

      try {
        for (const test of testQueries) {
          const params = new URLSearchParams({
            q: test.query,
            ...(test.city && { city: test.city })
          });
          
          const response = await fetch(`${BASE_URL}/api/sponsors?${params}`, {
            headers: {
              'Authorization': 'Bearer bW9jay1zaWduYXR1cmUtZm9yLXRlc3Rpbmc'
            }
          });
          
          if (!response.ok) {
            console.error(`❌ Sponsor API request failed for query: ${test.query}`);
            return false;
          }

          const data = await response.json();
          
          if (!data.success) {
            console.error(`❌ Sponsor search failed for query: ${test.query}`);
            return false;
          }

          const skilledWorkerSponsors = data.results.filter(s => s.isSkilledWorker);
          console.log(`✅ Found ${skilledWorkerSponsors.length} skilled worker sponsors for "${test.query}" in ${test.city || 'all cities'}`);
        }

        console.log('✅ Sponsor search test passed');
        return true;
      } catch (error) {
        console.error('❌ Sponsor search test failed:', error);
        return false;
      }
    }

    static async testUKVisaStandards() {
      console.log('[SOCSponsorshipTester] Testing UK visa standards compliance...');
      
      const testScenarios = [
        {
          salary: 45000,
          eligibility: 'Higher Skilled',
          isUnder26: false,
          expectedEligible: true
        },
        {
          salary: 30000,
          eligibility: 'Higher Skilled',
          isUnder26: false,
          expectedEligible: false // Below minimum salary
        },
        {
          salary: 35000,
          eligibility: 'Medium Skilled',
          isUnder26: false,
          expectedEligible: false // SOC level too low
        }
      ];

      try {
        for (const scenario of testScenarios) {
          const isEligible = this.checkUKVisaEligibility(scenario);
          
          if (isEligible !== scenario.expectedEligible) {
            console.error(`❌ Visa eligibility mismatch for salary £${scenario.salary} (${scenario.eligibility})`);
            return false;
          }
          
          console.log(`✅ Salary £${scenario.salary} (${scenario.eligibility}) - Eligible: ${isEligible}`);
        }

        console.log('✅ UK visa standards compliance test passed');
        return true;
      } catch (error) {
        console.error('❌ UK visa standards compliance test failed:', error);
        return false;
      }
    }

    static async testLinkedInExtraction() {
      console.log('[SOCSponsorshipTester] Testing LinkedIn job extraction simulation...');
      
      const testJobs = [
        {
          title: 'Senior Software Engineer',
          company: 'Tech Corp Ltd',
          location: 'London, England, United Kingdom',
          salary: '£65,000 - £85,000 per year'
        },
        {
          title: 'Data Analyst',
          company: 'Finance Solutions',
          location: 'Manchester, UK',
          salary: '£35,000 - £45,000 per year'
        },
        {
          title: 'IT Project Manager',
          company: 'Digital Agency Ltd',
          location: 'London, UK',
          salary: '£55,000 per year'
        }
      ];

      try {
        for (const job of testJobs) {
          const extracted = this.simulateLinkedInExtraction(job);
          
          if (!extracted.title || !extracted.company || !extracted.location) {
            console.error(`❌ Failed to extract job data for: ${job.title}`);
            return false;
          }

          const salary = this.parseSalary(extracted.salary || '');
          console.log(`✅ Extracted: ${extracted.title} at ${extracted.company} - Salary: £${salary}`);
        }

        console.log('✅ LinkedIn extraction simulation test passed');
        return true;
      } catch (error) {
        console.error('❌ LinkedIn extraction simulation test failed:', error);
        return false;
      }
    }

    static async testCompleteFlow() {
      console.log('[SOCSponsorshipTester] Testing complete integration flow...');
      
      try {
        // Step 1: Simulate job extraction
        const jobData = {
          title: 'IT specialist managers',
          company: 'Sky Technologies Ltd',
          location: 'London, England, United Kingdom',
          salary: '£55,000 per year'
        };

        const extractedJob = this.simulateLinkedInExtraction(jobData);
        
        // Step 2: Find matching SOC code
        const socResponse = await fetch(`${BASE_URL}/api/soc-codes?q=manager`);
        const socData = await socResponse.json();
        
        if (!socData.success || socData.results.length === 0) {
          console.error('❌ Failed to find SOC code for extracted job');
          return false;
        }

        const socCode = socData.results[0];
        
        // Step 3: Check if company is a sponsor
        const sponsorResponse = await fetch(`${BASE_URL}/api/sponsors?q=sky&city=london`, {
          headers: {
            'Authorization': 'Bearer bW9jay1zaWduYXR1cmUtZm9yLXRlc3Rpbmc'
          }
        });
        const sponsorData = await sponsorResponse.json();
        
        // Step 4: Check UK visa eligibility
        const salary = this.parseSalary(extractedJob.salary || '');
        const isEligible = this.checkUKVisaEligibility({
          salary,
          eligibility: socCode.eligibility,
          isUnder26: false
        });

        console.log('📊 Integration Test Results:');
        console.log(`  - Job: ${extractedJob.title} at ${extractedJob.company}`);
        console.log(`  - SOC Code: ${socCode.code} (${socCode.jobType})`);
        console.log(`  - Eligibility: ${socCode.eligibility}`);
        console.log(`  - Salary: £${salary}`);
        console.log(`  - Visa Eligible: ${isEligible ? '✅' : '❌'}`);
        console.log(`  - Company Sponsor: ${sponsorData.results.length > 0 ? '✅' : '❌'}`);

        console.log('✅ Complete integration flow test passed');
        return true;
      } catch (error) {
        console.error('❌ Complete integration flow test failed:', error);
        return false;
      }
    }

    static async runAllTests() {
      console.log('🚀 Starting SOC and Sponsorship Tests...');
      console.log('================================================');
      
      const tests = [
        { name: 'SOC Code Search', fn: this.testSOCCodeSearch },
        { name: 'Sponsor Search', fn: this.testSponsorSearch },
        { name: 'UK Visa Standards Compliance', fn: this.testUKVisaStandards },
        { name: 'LinkedIn Job Extraction', fn: this.testLinkedInExtraction },
        { name: 'Complete Integration Flow', fn: this.testCompleteFlow }
      ];

      const results = [];
      
      for (const test of tests) {
        try {
          const result = await test.fn.call(this);
          results.push({ name: test.name, passed: result });
        } catch (error) {
          console.error(`❌ Test "${test.name}" threw an error:`, error);
          results.push({ name: test.name, passed: false });
        }
      }

      console.log('================================================');
      console.log('📊 Test Results Summary:');
      
      results.forEach(result => {
        console.log(`${result.passed ? '✅' : '❌'} ${result.name}`);
      });

      const passedTests = results.filter(r => r.passed).length;
      const totalTests = results.length;
      
      console.log('================================================');
      console.log(`🎯 Overall: ${passedTests}/${totalTests} tests passed`);
      
      if (passedTests === totalTests) {
        console.log('🎉 All tests passed! SOC and Sponsorship extraction is working correctly.');
      } else {
        console.log('⚠️  Some tests failed. Check the logs above for details.');
      }

      return results;
    }

    // Helper methods
    static simulateLinkedInExtraction(jobData) {
      return {
        title: jobData.title.trim(),
        company: jobData.company.trim(),
        location: jobData.location.trim(),
        salary: jobData.salary?.trim(),
        dateFound: new Date().toISOString(),
        source: 'linkedin'
      };
    }

    static parseSalary(salaryString) {
      const match = salaryString.match(/£?(\d+(?:,\d+)*(?:\.\d+)?)/);
      if (match) {
        return parseInt(match[1].replace(/,/g, ''));
      }
      return 0;
    }

    static checkUKVisaEligibility(scenario) {
      const { salary, eligibility, isUnder26 } = scenario;
      
      // Check SOC level eligibility
      if (!this.UK_VISA_STANDARDS.ELIGIBLE_SOC_LEVELS.includes(eligibility)) {
        return false;
      }

      // Check salary requirements
      let minimumSalary = this.UK_VISA_STANDARDS.MINIMUM_SALARY;
      
      if (isUnder26) {
        minimumSalary = this.UK_VISA_STANDARDS.MINIMUM_SALARY_UNDER_26;
      }

      return salary >= minimumSalary;
    }
  }

  // Make available globally
  window.socSponsorshipTester = SOCSponsorshipTester;
  console.log('🧪 SOC Sponsorship Test Suite loaded!');
  console.log('📝 Available commands:');
  console.log('  - window.socSponsorshipTester.runAllTests() - Run all tests');
  console.log('  - window.socSponsorshipTester.testSOCCodeSearch() - Test SOC search');
  console.log('  - window.socSponsorshipTester.testSponsorSearch() - Test sponsor search');
  console.log('  - window.socSponsorshipTester.testUKVisaStandards() - Test visa standards');
  console.log('  - window.socSponsorshipTester.testLinkedInExtraction() - Test job extraction');
  console.log('  - window.socSponsorshipTester.testCompleteFlow() - Test integration');
  console.log('');
  console.log('🚀 Run window.socSponsorshipTester.runAllTests() to start testing!');

})();
