"use client";

import { format } from "date-fns";
import { AlertTriangle, Check, Rocket, Lightbulb, CheckCircle, XCircle } from "lucide-react";
import type { CvAnalysis } from "../types/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EnhancedAtsScore } from "./EnhancedAtsScore";

interface CvAnalysisResultsProps {
  analysis: CvAnalysis;
}

export function CvAnalysisResults({ analysis }: CvAnalysisResultsProps) {
  if (!analysis) return null;

  const getScoreVariant = (score: number) => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "destructive";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return { text: "Excellent", bg: "bg-emerald-100", color: "text-emerald-700" };
    if (score >= 60) return { text: "Good", bg: "bg-amber-100", color: "text-amber-700" };
    if (score >= 40) return { text: "Fair", bg: "bg-orange-100", color: "text-orange-700" };
    return { text: "Needs Work", bg: "bg-red-100", color: "text-red-700" };
  };

  const scoreLabel = getScoreLabel(analysis.overallScore || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-medium text-foreground">
                {analysis.fileName}
              </h3>
              <p className="text-sm text-muted-foreground">
                Analyzed on{" "}
                {format(
                  new Date(analysis.createdAt),
                  "MMM d, yyyy 'at' h:mm a"
                )}
              </p>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${scoreLabel.bg} ${scoreLabel.color}`}>
                <span className="text-lg tabular-nums">{analysis.overallScore || 0}</span>
                <span className="text-xs opacity-75">/100</span>
                <span className="mx-1">•</span>
                {scoreLabel.text}
              </span>
            </div>
          </div>

          {/* ATS Quick Summary */}
          {analysis.atsCompatibility &&
            analysis.atsCompatibility.score < 80 && (
              <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <h4 className="text-sm font-medium text-amber-800 mb-2 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                  ATS Optimization Recommended
                </h4>
                <p className="text-sm text-amber-700">
                  Your CV scores {analysis.atsCompatibility.score}/100 on ATS compatibility. 
                  Review the breakdown below for specific improvements to increase your chances 
                  of passing automated screening systems.
                </p>
              </div>
            )}
        </CardContent>
      </Card>

      {/* Enhanced ATS Score Display */}
      {analysis.atsCompatibility ? (
        <EnhancedAtsScore
          score={{
            overall: analysis.overallScore || 0,
            ats: analysis.atsCompatibility.score,
            completeness: analysis.atsCompatibility.breakdown?.structure || 0,
            impact: analysis.atsCompatibility.breakdown?.keywords || 0,
            suggestions: analysis.atsCompatibility.suggestions || [],
            breakdown: {
              structure: analysis.atsCompatibility.breakdown?.structure || 0,
              content: analysis.atsCompatibility.breakdown?.keywords || 0,
              keywords: analysis.atsCompatibility.breakdown?.keywords || 0,
              readability: analysis.atsCompatibility.breakdown?.readability || 0,
              formatting: analysis.atsCompatibility.breakdown?.formatting || 0,
              impact: analysis.atsCompatibility.breakdown?.extras || 0,
              modernization: analysis.atsCompatibility.breakdown?.extras || 0
            },
            strengths: analysis.strengths || [],
            criticalIssues: analysis.atsCompatibility.issues || []
          }}
          showDetailed={true}
          animated={true}
          size="expanded"
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Overall Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="bg-muted rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${
                      (analysis.overallScore || 0) >= 80
                        ? "bg-green-500"
                        : (analysis.overallScore || 0) >= 60
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${analysis.overallScore || 0}%` }}
                  ></div>
                </div>
              </div>
              <span className="text-2xl font-bold text-foreground">
                {analysis.overallScore || 0}%
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Strengths */}
      {analysis.strengths && analysis.strengths.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.strengths.map((strength: string, index: number) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">•</span>
                  <span className="text-foreground">{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Weaknesses */}
      {analysis.weaknesses && analysis.weaknesses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
              Areas for Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.weaknesses.map((weakness: string, index: number) => (
                <li key={index} className="flex items-start">
                  <span className="text-red-500 mr-2 mt-1">•</span>
                  <span className="text-foreground">{weakness}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Missing Skills */}
      {analysis.missingSkills && analysis.missingSkills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Check className="w-4 h-4 text-blue-500 mr-2" />
              Missing Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {analysis.missingSkills.map((skill: string, index: number) => (
                <Badge key={index} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {analysis.recommendations && analysis.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lightbulb className="h-4 w-4 mr-2 text-secondary" />
              Actionable Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {analysis.recommendations.map(
                (recommendation: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <Check className="w-4 h-4 text-secondary mr-2 mt-1 flex-shrink-0" />
                    <span className="text-foreground">{recommendation}</span>
                  </li>
                )
              )}
            </ul>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <h5 className="text-sm font-medium text-blue-900 mb-2">
                <Rocket className="h-4 w-4 mr-2" /> Pro Tip for ATS
                Optimization:
              </h5>
              <p className="text-sm text-blue-800">
                Focus on incorporating the missing keywords identified above
                throughout your CV, especially in your job descriptions and
                skills section. Use natural language and avoid keyword stuffing.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Industry Alignment */}
        {analysis.industryAlignment && (
          <Card>
            <CardHeader>
              <CardTitle>Industry Alignment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Score</span>
                  <span className="text-sm font-medium">
                    {analysis.industryAlignment.score}/100
                  </span>
                </div>
                <div className="bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${analysis.industryAlignment.score}%` }}
                  ></div>
                </div>
              </div>
              <p className="text-sm text-foreground">
                {analysis.industryAlignment.feedback}
              </p>
            </CardContent>
          </Card>
        )}

        {/* ATS Compatibility */}
        {analysis.atsCompatibility && (
          <Card>
            <CardHeader>
              <CardTitle>ATS Compatibility</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Score</span>
                  <span className="text-sm font-medium">
                    {analysis.atsCompatibility.score}/100
                  </span>
                </div>
                <div className="bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      analysis.atsCompatibility.score >= 80
                        ? "bg-green-500"
                        : analysis.atsCompatibility.score >= 60
                        ? "bg-yellow-500"
                        : "bg-red-500"
                    }`}
                    style={{ width: `${analysis.atsCompatibility.score}%` }}
                  ></div>
                </div>
              </div>
              {analysis.atsCompatibility.breakdown && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {Object.entries(analysis.atsCompatibility.breakdown).map(
                    ([key, value]) => {
                      const labelMap: Record<string, string> = {
                        structure: "Structure",
                        contact: "Contact Details",
                        keywords: "Keyword Match",
                        formatting: "Formatting",
                        readability: "Readability",
                        extras: "Extras",
                      };
                      const maxMap: Record<string, number> = {
                        structure: 25,
                        contact: 20,
                        keywords: 25,
                        formatting: 15,
                        readability: 10,
                        extras: 15,
                      };
                      const label = labelMap[key] || key;
                      const max = maxMap[key] ?? 25;
                      const percentage = Math.min((value / max) * 100, 100);
                      return (
                        <div key={key} className="space-y-1">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{label}</span>
                            <span className="font-medium text-foreground">
                              {Math.round(value)}/{max}
                            </span>
                          </div>
                          <div className="bg-muted rounded-full h-2">
                            <div
                              className="h-2 rounded-full bg-primary"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              )}
              {analysis.atsCompatibility.issues &&
                analysis.atsCompatibility.issues.length > 0 && (
                  <div className="mt-4">
                    <h5 className="text-sm font-medium text-foreground mb-2">
                      Issues to Fix:
                    </h5>
                    <ul className="text-sm text-foreground space-y-2">
                      {analysis.atsCompatibility.issues.map(
                        (issue: string, index: number) => (
                          <li key={index} className="flex items-start">
                            <span className="text-red-500 mr-2 mt-1">•</span>
                            <span>{issue}</span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}
              {analysis.atsCompatibility.suggestions &&
                analysis.atsCompatibility.suggestions.length > 0 && (
                  <div className="mt-4">
                    <h5 className="text-sm font-medium text-foreground mb-2">
                      Improvement Suggestions:
                    </h5>
                    <ul className="text-sm text-foreground space-y-2">
                      {analysis.atsCompatibility.suggestions.map(
                        (suggestion: string, index: number) => (
                          <li key={index} className="flex items-start">
                            <Check className="w-4 h-4 text-green-500 mr-2 mt-1" />
                            <span>{suggestion}</span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Keyword Analysis */}
      {analysis.keywordAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle>Keyword Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h5 className="text-sm font-medium text-foreground mb-2">
                  Present Keywords
                </h5>
                <div className="flex flex-wrap gap-2">
                  {analysis.keywordAnalysis.presentKeywords?.map(
                    (keyword: string, index: number) => (
                      <Badge key={index} variant="default">
                        {keyword}
                      </Badge>
                    )
                  )}
                </div>
              </div>
              <div>
                <h5 className="text-sm font-medium text-foreground mb-2">
                  Missing Keywords
                </h5>
                <div className="flex flex-wrap gap-2">
                  {analysis.keywordAnalysis.missingKeywords?.map(
                    (keyword: string, index: number) => (
                      <Badge key={index} variant="destructive">
                        {keyword}
                      </Badge>
                    )
                  )}
                </div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-100">
              <h5 className="text-sm font-medium text-yellow-900 mb-2">
                ATS Keyword Optimization Tips:
              </h5>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>
                  • Incorporate missing keywords naturally throughout your CV
                </li>
                <li>
                  • Place important keywords in job titles and section headings
                </li>
                <li>• Use variations and synonyms of key terms</li>
                <li>• Avoid keyword stuffing - maintain readability</li>
              </ul>
            </div>
            <div className="mt-4">
              <span className="text-sm text-muted-foreground">
                Keyword Density: {analysis.keywordAnalysis.keywordDensity}%
              </span>
              <div className="mt-1 bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    analysis.keywordAnalysis.keywordDensity >= 3
                      ? "bg-green-500"
                      : analysis.keywordAnalysis.keywordDensity >= 1
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{
                    width: `${Math.min(
                      analysis.keywordAnalysis.keywordDensity * 10,
                      100
                    )}%`,
                  }}
                ></div>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {analysis.keywordAnalysis.keywordDensity >= 3
                  ? "Optimal keyword density"
                  : analysis.keywordAnalysis.keywordDensity >= 1
                  ? "Good keyword density, consider adding more relevant terms"
                  : "Low keyword density, incorporate more industry-specific terms"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section Analysis */}
      {analysis.sectionAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle>Section Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center">
                  <span
                    className={`mr-2 ${
                      analysis.sectionAnalysis.hasSummary
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {analysis.sectionAnalysis.hasSummary ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                  </span>
                  <span className="text-sm">Professional Summary</span>
                </div>
                <div className="flex items-center">
                  <span
                    className={`mr-2 ${
                      analysis.sectionAnalysis.hasExperience
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {analysis.sectionAnalysis.hasExperience ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                  </span>
                  <span className="text-sm">Work Experience</span>
                </div>
                <div className="flex items-center">
                  <span
                    className={`mr-2 ${
                      analysis.sectionAnalysis.hasEducation
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {analysis.sectionAnalysis.hasEducation ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                  </span>
                  <span className="text-sm">Education</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <span
                    className={`mr-2 ${
                      analysis.sectionAnalysis.hasSkills
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {analysis.sectionAnalysis.hasSkills ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                  </span>
                  <span className="text-sm">Skills</span>
                </div>
                <div className="flex items-center">
                  <span
                    className={`mr-2 ${
                      analysis.sectionAnalysis.hasContact
                        ? "text-green-500"
                        : "text-red-500"
                    }`}
                  >
                    {analysis.sectionAnalysis.hasContact ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                  </span>
                  <span className="text-sm">Contact Information</span>
                </div>
              </div>
            </div>
            {analysis.sectionAnalysis.missingsections &&
              analysis.sectionAnalysis.missingsections.length > 0 && (
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-foreground mb-2">
                    Missing Sections:
                  </h5>
                  <ul className="text-sm text-foreground">
                    {analysis.sectionAnalysis.missingsections.map(
                      (section: string, index: number) => (
                        <li key={index}>• {section}</li>
                      )
                    )}
                  </ul>
                </div>
              )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
