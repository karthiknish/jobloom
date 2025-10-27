"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Loader2, Play, TestTube } from "lucide-react";

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration?: number;
}

export default function SOCSponsorshipTestPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [currentTest, setCurrentTest] = useState<string>("");
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    // Load the test script
    const script = document.createElement('script');
    script.src = '/test-soc-sponsorship.js';
    script.async = true;
    document.body.appendChild(script);

    // Override console.log to capture test output
    const originalLog = console.log;
    console.log = (...args) => {
      originalLog(...args);
      const message = args.join(' ');
      if (message.includes('[SOCSponsorshipTester]')) {
        setLogs(prev => [...prev.slice(-50), message]);
      }
    };

    return () => {
      console.log = originalLog;
      document.body.removeChild(script);
    };
  }, []);

  const runTests = async () => {
    if (typeof window === 'undefined' || !(window as any).socSponsorshipTester) {
      alert('Test suite not loaded. Please refresh the page.');
      return;
    }

    setIsRunning(true);
    setResults([]);
    setLogs([]);
    setCurrentTest("Initializing tests...");

    try {
      const tester = (window as any).socSponsorshipTester;
      
      // Run individual tests to capture results
      const tests = [
        { name: 'LinkedIn Job Extraction', fn: tester.testLinkedInJobExtraction },
        { name: 'SOC Code Search', fn: tester.testSOCCodeSearch },
        { name: 'Sponsor Search', fn: tester.testSponsorSearch },
        { name: 'UK Visa Standards Compliance', fn: tester.testUKVisaStandards },
        { name: 'LinkedIn Extraction Robustness', fn: tester.testLinkedInExtractionRobustness },
        { name: 'Complete Integration Flow', fn: tester.testCompleteFlow }
      ];

      const testResults: TestResult[] = [];

      for (const test of tests) {
        setCurrentTest(test.name);
        const startTime = Date.now();
        
        try {
          const result = await test.fn();
          testResults.push({
            name: test.name,
            passed: result,
            duration: Date.now() - startTime
          });
        } catch (error: any) {
          testResults.push({
            name: test.name,
            passed: false,
            error: error.message || 'Unknown error',
            duration: Date.now() - startTime
          });
        }
      }

      setResults(testResults);
      
      // Run the complete test suite for detailed logs
      setCurrentTest("Running complete analysis...");
      await tester.runAllTests();
      
    } catch (error: any) {
      console.error('Test execution failed:', error);
      setLogs(prev => [...prev, `ERROR: ${error.message}`]);
    } finally {
      setIsRunning(false);
      setCurrentTest("");
    }
  };

  const passedTests = results.filter(r => r.passed).length;
  const totalTests = results.length;
  const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <TestTube className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">SOC Code & Sponsorship Test Suite</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Comprehensive testing for UK visa sponsorship compliance, LinkedIn job extraction, 
            and SOC code matching according to UK Home Office standards
          </p>
        </div>

        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Test Controls
            </CardTitle>
            <CardDescription>
              Run the complete test suite to verify SOC code and sponsorship extraction functionality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Button 
                onClick={runTests} 
                disabled={isRunning}
                size="lg"
                className="min-w-[150px]"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run All Tests
                  </>
                )}
              </Button>
              
              {currentTest && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {currentTest}
                </div>
              )}
            </div>

            {/* Results Summary */}
            {results.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{passedTests}</div>
                  <div className="text-sm text-muted-foreground">Passed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-destructive">{totalTests - passedTests}</div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{totalTests}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{successRate.toFixed(1)}%</div>
                  <div className="text-sm text-muted-foreground">Success Rate</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Results */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  {successRate === 100 ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  )}
                  Test Results
                </span>
                <Badge variant={successRate === 100 ? "default" : "secondary"}>
                  {successRate === 100 ? "All Passed" : "Some Failed"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {results.map((result, index) => (
                  <div 
                    key={index} 
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      result.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {result.passed ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      )}
                      <div>
                        <div className="font-medium">{result.name}</div>
                        {result.error && (
                          <div className="text-sm text-red-600 mt-1">{result.error}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {result.duration && (
                        <span className="text-sm text-muted-foreground">
                          {result.duration}ms
                        </span>
                      )}
                      <Badge variant={result.passed ? "default" : "destructive"}>
                        {result.passed ? "PASS" : "FAIL"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Test Logs */}
        {logs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Test Logs</CardTitle>
              <CardDescription>
                Real-time output from the test execution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto">
                {logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Test Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>LinkedIn Job Extraction</CardTitle>
              <CardDescription>
                Tests the robustness of job data extraction from LinkedIn
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm">✅ Job title extraction</div>
              <div className="text-sm">✅ Company name detection</div>
              <div className="text-sm">✅ Location parsing</div>
              <div className="text-sm">✅ Salary extraction</div>
              <div className="text-sm">✅ Sponsored job detection</div>
              <div className="text-sm">✅ Special character handling</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>UK Visa Standards</CardTitle>
              <CardDescription>
                Validates compliance with UK Home Office sponsorship requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-sm">✅ Minimum salary thresholds (£38,700)</div>
              <div className="text-sm">✅ Age-based reductions (Under 26: £30,960)</div>
              <div className="text-sm">✅ New entrant rates (£25,600)</div>
              <div className="text-sm">✅ PhD holder concessions</div>
              <div className="text-sm">✅ SOC code eligibility (RQF Level 6+)</div>
              <div className="text-sm">✅ Skilled Worker route validation</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
