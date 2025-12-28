import { scoreResume } from '../scoring-service';

describe('ATS Scoring Service', () => {
  describe('Industry Detection', () => {
    it('should detect healthcare industry correctly', () => {
      const content = 'Registered Nurse with extensive experience in clinical care, patient safety, and HIPAA compliance within acute care settings.';
      const result = scoreResume(content);
      expect(result.detailedMetrics!.technicalKeywordCount).toBeGreaterThan(0);
    });

    it('should detect finance industry correctly', () => {
      const content = 'Financial Analyst with expertise in financial modeling, valuation, and auditing GAAP standards for international firms.';
      const result = scoreResume(content);
      expect(result.detailedMetrics!.technicalKeywordCount).toBeGreaterThan(0);
    });

    it('should fall back to technology if no industry indicators are found', () => {
      const content = 'Generic professional with ten years of background in general management and operational strategy across diverse teams.';
      const result = scoreResume(content);
      expect(result.detailedMetrics).toBeDefined();
    });
  });

  describe('Bias Mitigation', () => {
    it('should not penalize a Nurse for missing Javascript/Python', () => {
      const nurseContent = `
        CONTACT INFO: nurse@example.com | 555-0199
        SUMMARY: Dedicated Registered Nurse with 5 years experience in acute healthcare settings.
        EXPERIENCE:
        Registered Nurse - Mercy Hospital
        - Provided patient care in the ICU for critically ill patients.
        - Managed medication administration for 20+ patients daily.
        - Improved triage efficiency by 15% through better communication.
        EDUCATION: B.S. in Nursing - State University
        SKILLS: CPR, Clinical Assessment, HIPAA, Vital Signs, Patient Care.
      `;
      const result = scoreResume(nurseContent);
      
      expect(result.score).toBeGreaterThanOrEqual(65);
      expect(result.detailedMetrics!.technicalKeywordCount).toBeGreaterThan(3);
    });

    it('should celebrate a Software Engineer for technical skills', () => {
      const techContent = `
        CONTACT INFO: dev@example.com | 555-0200 | San Francisco, CA
        SUMMARY: Dedicated Full Stack Developer specializing in TypeScript, React, and cloud-native architecture.
        EXPERIENCE:
        Senior Developer - TechFlow
        - Orchestrated microservices deployment on AWS cloud infrastructure for 10k+ users.
        - Engineered robust API integrations using GraphQL and Node.js.
        - Improved application performance by 30% through advanced code optimization.
        - Mentored junior developers and led code reviews for a team of 5.
        EDUCATION: B.S. in Computer Science - Tech Institute
        SKILLS: React, Node.js, TypeScript, SQL, Version Control, CI/CD, AWS, Docker, Kubernetes.
      `;
      const result = scoreResume(techContent);
      expect(result.score).toBeGreaterThanOrEqual(70);
      expect(result.detailedMetrics!.technicalKeywordCount).toBeGreaterThan(5);
    });
  });


  describe('Universal Impact Detection', () => {
    it('should detect impact for patients in healthcare', () => {
      const content = 'Successfully improved recovery times for 50+ patients in the cardiac recovery unit.';
      const result = scoreResume(content);
      expect(result.detailedMetrics!.quantifiedAchievements).toBeGreaterThan(0);
    });

    it('should detect impact for revenue and pipeline in sales', () => {
      const content = 'Generated $1.2M in new revenue and managed a $5M pipeline for the enterprise division.';
      const result = scoreResume(content);
      expect(result.detailedMetrics!.quantifiedAchievements).toBeGreaterThan(0);
    });

    it('should detect impact for students in education', () => {
      const content = 'Guided 30+ students to achieve 15% growth in literacy scores over the past academic year.';
      const result = scoreResume(content);
      expect(result.detailedMetrics!.quantifiedAchievements).toBeGreaterThan(1);
    });
  });

  describe('Edge Cases', () => {
    it('should return empty result for very short content', () => {
      const content = 'Too short.';
      const result = scoreResume(content);
      expect(result.score).toBe(0);
      expect(result.recommendations.high).toContain('Content too short for analysis');
    });

    it('should handle extreme keyword stuffing gracefully', () => {
      const content = 'React '.repeat(100) + ' ' + 'Node.js '.repeat(100);
      const result = scoreResume(content);
      // It should detect technical keywords but maybe not give a 100 score
      expect(result.score).toBeLessThan(100);
      expect(result.detailedMetrics!.technicalKeywordCount).toBeGreaterThan(0);
    });

    it('should handle resumes with missing sections', () => {
      const content = 'Just a summary of a professional with some skills: React, Node.js, TypeScript. No education or experience mentioned.';
      const result = scoreResume(content);
      expect(result.breakdown.structure).toBeLessThanOrEqual(20); // Should be low section score
    });

    it('should handle mixed industry indicators', () => {
      const content = 'Software Engineer with experience in healthcare settings, managing patient data and auditing financial records for GAAP compliance.';
      const result = scoreResume(content);
      // Should pick one or handle both
      expect(result.score).toBeGreaterThan(0);
      expect(result.detailedMetrics!.technicalKeywordCount).toBeGreaterThan(0);
    });
  });
});

