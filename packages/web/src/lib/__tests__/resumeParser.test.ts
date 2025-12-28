import { parseResumeText, toResumeData } from '../resumeParser';

describe('Resume Parser', () => {
  const sampleResume = `
John Smith
Software Engineer
john.smith@example.com | 07700 900000 | London, UK
linkedin.com/in/jsmith | github.com/jsmith

SUMMARY
Experienced software engineer with a focus on React and Node.js.

EXPERIENCE
Hireall | Lead Developer | London, UK | 2021 - Present
- Led a team of 5 developers to build high-scale web apps
- Improved deployment speed by 40% using CI/CD
- Optimized database queries for millions of records

EDUCATION
University of London | B.Sc. Computer Science | 2017 - 2020
- GPA: 3.8/4.0
- First Class Honors

SKILLS
Frontend: React, Next.js, TypeScript, CSS
Backend: Node.js, Express, PostgreSQL, Redis
Tools: Git, Jenkins, Terraform
`;

  it('should identify sections correctly', () => {
    const result = parseResumeText(sampleResume);
    const sectionNames = result.sections.map(s => s.name);
    
    expect(sectionNames).toContain('summary');
    expect(sectionNames).toContain('experience');
    expect(sectionNames).toContain('education');
    expect(sectionNames).toContain('skills');
  });

  it('should extract contact information', () => {
    const result = parseResumeText(sampleResume);
    expect(result.contact.name).toBe('John Smith');
    expect(result.contact.email).toBe('john.smith@example.com');
    expect(result.contact.phone).toBe('07700 900000');
    expect(result.contact.linkedin).toBe('jsmith');
    expect(result.contact.github).toBe('jsmith');
  });

  it('should extract experience items', () => {
    const result = parseResumeText(sampleResume);
    expect(result.experience.length).toBeGreaterThan(0);
    const leadDev = result.experience[0];
    expect(leadDev.company).toContain('Hireall');
    expect(leadDev.title).toContain('Lead Developer');
    expect(leadDev.achievements.length).toBe(3);
    expect(leadDev.current).toBe(true);
  });

  it('should extract education items', () => {
    const result = parseResumeText(sampleResume);
    expect(result.education.length).toBeGreaterThan(0);
    expect(result.education[0].institution).toContain('University of London');
    expect(result.education[0].gpa).toBe('3.8');
  });

  it('should extract skills categorized', () => {
    const result = parseResumeText(sampleResume);
    const frontendGroup = result.skills.find(s => s.category.toLowerCase() === 'frontend');
    expect(frontendGroup?.items).toContain('React');
    expect(frontendGroup?.items).toContain('TypeScript');
  });

  it('should convert to ResumeData format', () => {
    const parsed = parseResumeText(sampleResume);
    const resumeData = toResumeData(parsed);
    
    expect(resumeData.personalInfo.fullName).toBe('John Smith');
    expect(resumeData.experience[0].position).toContain('Lead Developer');
    expect(resumeData.skills.length).toBeGreaterThan(0);
  });
});
