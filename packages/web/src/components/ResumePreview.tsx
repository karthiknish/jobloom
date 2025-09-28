"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  MapPin,
  Mail,
  Phone,
  Globe,
  Github,
  Linkedin,
  Calendar,
  Award,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface ResumeData {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    github?: string;
    website?: string;
    summary: string;
  };
  experience: Array<{
    id: string;
    company: string;
    position: string;
    location: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
    achievements: string[];
  }>;
  education: Array<{
    id: string;
    institution: string;
    degree: string;
    field: string;
    graduationDate: string;
    gpa?: string;
    honors?: string;
  }>;
  skills: Array<{
    category: string;
    skills: string[];
  }>;
  projects: Array<{
    id: string;
    name: string;
    description: string;
    technologies: string[];
    link?: string;
    github?: string;
  }>;
}

interface ResumePreviewProps {
  data: ResumeData;
  template?: 'modern' | 'classic' | 'creative' | 'minimal' | 'executive' | 'academic' | 'tech' | 'startup';
  className?: string;
}

export function ResumePreview({ data, template = 'modern', className }: ResumePreviewProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  const getTemplateStyles = () => {
    switch (template) {
      case 'modern':
        return {
          container: "bg-white text-gray-900",
          header: "border-b-2 border-blue-500 pb-4 mb-6",
          section: "mb-6",
          sectionTitle: "text-xl font-bold text-blue-600 mb-3 pb-2 border-b border-gray-200",
          subsection: "mb-4",
          text: "text-gray-700",
          muted: "text-gray-500",
        };
      case 'executive':
        return {
          container: "bg-white text-gray-900",
          header: "border-b-2 border-gray-800 pb-4 mb-6",
          section: "mb-6",
          sectionTitle: "text-lg font-bold text-gray-800 uppercase tracking-wide mb-3 pb-2 border-b border-gray-300",
          subsection: "mb-4",
          text: "text-gray-700",
          muted: "text-gray-500",
        };
      case 'classic':
        return {
          container: "bg-white text-gray-900",
          header: "border-b-2 border-gray-700 pb-4 mb-6",
          section: "mb-6",
          sectionTitle: "text-lg font-bold text-gray-700 uppercase tracking-wide mb-3 pb-2 border-b-2 border-gray-300",
          subsection: "mb-4",
          text: "text-gray-700",
          muted: "text-gray-500",
        };
      case 'creative':
        return {
          container: "bg-gradient-to-br from-purple-50 to-pink-50 text-gray-900",
          header: "border-b-2 border-purple-400 pb-4 mb-6",
          section: "mb-6",
          sectionTitle: "text-xl font-bold text-purple-600 mb-3 pb-2 border-b border-purple-200",
          subsection: "mb-4",
          text: "text-gray-700",
          muted: "text-gray-500",
        };
      case 'minimal':
        return {
          container: "bg-white text-gray-900",
          header: "border-b border-gray-200 pb-4 mb-6",
          section: "mb-6",
          sectionTitle: "text-lg font-medium text-gray-800 mb-3",
          subsection: "mb-4",
          text: "text-gray-700",
          muted: "text-gray-500",
        };
      case 'academic':
        return {
          container: "bg-white text-gray-900",
          header: "border-b-2 border-green-600 pb-4 mb-6",
          section: "mb-6",
          sectionTitle: "text-lg font-semibold text-green-700 mb-3 pb-2 border-b border-green-200",
          subsection: "mb-4",
          text: "text-gray-700",
          muted: "text-gray-500",
        };
      case 'tech':
        return {
          container: "bg-gray-50 text-gray-900",
          header: "border-b-2 border-blue-600 pb-4 mb-6",
          section: "mb-6",
          sectionTitle: "text-lg font-semibold text-blue-700 mb-3 pb-2 border-b border-blue-200",
          subsection: "mb-4",
          text: "text-gray-700",
          muted: "text-gray-500",
        };
      case 'startup':
        return {
          container: "bg-gradient-to-br from-orange-50 to-red-50 text-gray-900",
          header: "border-b-2 border-orange-500 pb-4 mb-6",
          section: "mb-6",
          sectionTitle: "text-lg font-semibold text-orange-700 mb-3 pb-2 border-b border-orange-200",
          subsection: "mb-4",
          text: "text-gray-700",
          muted: "text-gray-500",
        };
      default:
        return {
          container: "bg-white text-gray-900",
          header: "border-b-2 border-blue-500 pb-4 mb-6",
          section: "mb-6",
          sectionTitle: "text-xl font-bold text-blue-600 mb-3 pb-2 border-b border-gray-200",
          subsection: "mb-4",
          text: "text-gray-700",
          muted: "text-gray-500",
        };
    }
  };

  const styles = getTemplateStyles();

  return (
    <Card className={`w-full max-w-4xl mx-auto ${styles.container} ${className}`}>
      <CardContent className="p-8">
        {/* Header */}
        <div className={styles.header}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{data.personalInfo.fullName || 'Your Name'}</h1>
              {data.personalInfo.summary && (
                <p className={`${styles.text} text-lg leading-relaxed max-w-2xl`}>
                  {data.personalInfo.summary}
                </p>
              )}
            </div>

            <div className={`${styles.muted} text-sm space-y-1`}>
              {data.personalInfo.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {data.personalInfo.email}
                </div>
              )}
              {data.personalInfo.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {data.personalInfo.phone}
                </div>
              )}
              {data.personalInfo.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {data.personalInfo.location}
                </div>
              )}
            </div>
          </div>

          {/* Social Links */}
          {(data.personalInfo.linkedin || data.personalInfo.github || data.personalInfo.website) && (
            <div className="flex gap-4 mt-4">
              {data.personalInfo.linkedin && (
                <a href={data.personalInfo.linkedin} className={`${styles.muted} hover:text-blue-600 transition-colors`}>
                  <Linkedin className="h-4 w-4" />
                </a>
              )}
              {data.personalInfo.github && (
                <a href={data.personalInfo.github} className={`${styles.muted} hover:text-gray-900 transition-colors`}>
                  <Github className="h-4 w-4" />
                </a>
              )}
              {data.personalInfo.website && (
                <a href={data.personalInfo.website} className={`${styles.muted} hover:text-green-600 transition-colors`}>
                  <Globe className="h-4 w-4" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Experience Section */}
        {data.experience.length > 0 && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Experience</h2>
            <div className="space-y-6">
              {data.experience.map((exp) => (
                <div key={exp.id} className={styles.subsection}>
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg">{exp.position}</h3>
                      <p className={`${styles.text} font-medium`}>{exp.company}</p>
                    </div>
                    <div className={`${styles.muted} text-sm mt-1 md:mt-0 md:text-right`}>
                      {formatDate(exp.startDate)} - {exp.current ? 'Present' : formatDate(exp.endDate)}
                      {exp.location && (
                        <>
                          <br />
                          {exp.location}
                        </>
                      )}
                    </div>
                  </div>

                  {exp.description && (
                    <p className={`${styles.text} mb-3`}>{exp.description}</p>
                  )}

                  {exp.achievements.some(ach => ach.trim()) && (
                    <div className="space-y-1">
                      {exp.achievements.filter(ach => ach.trim()).map((achievement, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <span className="text-blue-500 mt-1">•</span>
                          <span className={styles.text}>{achievement}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education Section */}
        {data.education.length > 0 && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Education</h2>
            <div className="space-y-4">
              {data.education.map((edu) => (
                <div key={edu.id} className={styles.subsection}>
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="font-semibold">{edu.degree} in {edu.field}</h3>
                      <p className={`${styles.text} font-medium`}>{edu.institution}</p>
                      {edu.honors && (
                        <p className={`${styles.text} italic`}>{edu.honors}</p>
                      )}
                    </div>
                    <div className={`${styles.muted} text-sm mt-1 md:mt-0 md:text-right`}>
                      {formatDate(edu.graduationDate)}
                      {edu.gpa && (
                        <>
                          <br />
                          GPA: {edu.gpa}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills Section */}
        {data.skills.some(skill => skill.skills.length > 0) && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Skills</h2>
            <div className="space-y-4">
              {data.skills.filter(skill => skill.skills.length > 0).map((skillGroup) => (
                <div key={skillGroup.category}>
                  <h3 className="font-medium mb-2">{skillGroup.category}</h3>
                  <div className="flex flex-wrap gap-2">
                    {skillGroup.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects Section */}
        {data.projects.length > 0 && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Projects</h2>
            <div className="space-y-4">
              {data.projects.map((project) => (
                <div key={project.id} className={styles.subsection}>
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{project.name}</h3>
                        {project.link && (
                          <a href={project.link} className={`${styles.muted} hover:text-blue-600 transition-colors`}>
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                      {project.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {project.technologies.map((tech, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <p className={styles.text}>{project.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
