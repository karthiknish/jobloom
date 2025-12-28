import { 
  parseResumeAnalysis, 
  parseResumeGenerationResponse, 
  manualKeywordExtraction,
  getFallbackCoverLetter
} from '../parsers';

describe('AI Parsers', () => {
  describe('parseResumeAnalysis', () => {
    it('should parse valid JSON from AI string', () => {
      const aiResponse = 'Based on my analysis: {"atsScore": 85, "keywords": ["react", "node"], "suggestions": ["add more", "fix this"]}';
      const result = parseResumeAnalysis(aiResponse);
      expect(result.atsScore).toBe(85);
      expect(result.keywords).toContain('react');
    });

    it('should return fallback for invalid JSON', () => {
      const aiResponse = 'The resume is good but I cannot provide JSON right now.';
      const result = parseResumeAnalysis(aiResponse);
      expect(result.atsScore).toBe(60); // Default fallback score
    });
  });

  describe('parseResumeGenerationResponse', () => {
    it('should extract structured sections from JSON', () => {
      const aiResponse = '```json {"summary": "Experienced dev", "experience": "Worked at X", "skills": "React, Node", "education": "Uni"} ```';
      const result = parseResumeGenerationResponse(aiResponse);
      expect(result.summary).toBe('Experienced dev');
      expect(result.skills).toBe('React, Node');
    });

    it('should throw error for empty response', () => {
      const aiResponse = '{}';
      expect(() => parseResumeGenerationResponse(aiResponse)).toThrow();
    });
  });

  describe('manualKeywordExtraction', () => {
    it('should find common technical keywords in text', () => {
      const jobDesc = 'We are looking for a Senior React Developer with AWS and Docker experience.';
      const userSkills = ['React', 'TypeScript'];
      const result = manualKeywordExtraction(jobDesc, userSkills);
      
      expect(result).toContain('react');
      expect(result).toContain('aws');
      expect(result).toContain('docker');
      expect(result.map(r => r.toLowerCase())).toContain('react');
    });

    it('should limit result count', () => {
      const jobDesc = 'leadership communication teamwork problem-solving analytical javascript python react node.js aws docker kubernetes agile scrum sql';
      const result = manualKeywordExtraction(jobDesc, []);
      expect(result.length).toBeLessThanOrEqual(12);
    });
  });

  describe('getFallbackCoverLetter', () => {
    it('should generate a sensible template', () => {
      const request: any = {
        jobTitle: 'Software Engineer',
        companyName: 'TechCorp',
        skills: ['React', 'Node'],
        experience: '5 years of experience'
      };
      const result = getFallbackCoverLetter(request, 'Test reason');
      expect(result.content).toContain('Software Engineer');
      expect(result.content).toContain('TechCorp');
      expect(result.content).toContain('React, Node');
    });
  });
});
