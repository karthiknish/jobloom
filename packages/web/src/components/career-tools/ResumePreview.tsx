"use client";

import { motion } from "framer-motion";
import { Eye, Mail, Phone, MapPin, Linkedin, Globe, Briefcase, GraduationCap, Code, FolderOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ResumeData } from "@/types/resume";

interface ResumePreviewProps {
  data: ResumeData;
  className?: string;
}

/**
 * Live preview component that shows resume content in real-time
 * Updates as user types in the form fields
 */
export function ResumePreview({ data, className }: ResumePreviewProps) {
  const { personalInfo, experience, education, skills, projects } = data;
  
  const hasContent = Boolean(
    personalInfo?.fullName ||
    personalInfo?.email ||
    experience?.length ||
    education?.length ||
    skills?.length
  );

  if (!hasContent) {
    return (
      <Card className={`sticky top-24 ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Live Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Eye className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Start filling in the form to see your resume preview here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`sticky top-24 ${className}`}>
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Eye className="h-4 w-4 text-primary" />
          Live Preview
        </CardTitle>
      </CardHeader>
      <ScrollArea className="h-[calc(100vh-200px)]">
        <CardContent className="p-4 space-y-4">
          {/* Header / Personal Info */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-b pb-4"
          >
            {personalInfo?.fullName && (
              <h2 className="text-lg font-bold text-foreground">
                {personalInfo.fullName}
              </h2>
            )}
            {personalInfo?.summary && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {personalInfo.summary}
              </p>
            )}
            <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
              {personalInfo?.email && (
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {personalInfo.email}
                </span>
              )}
              {personalInfo?.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {personalInfo.phone}
                </span>
              )}
              {personalInfo?.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {personalInfo.location}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-1 text-xs text-primary">
              {personalInfo?.linkedin && (
                <span className="flex items-center gap-1">
                  <Linkedin className="h-3 w-3" />
                  LinkedIn
                </span>
              )}
              {personalInfo?.website && (
                <span className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  Portfolio
                </span>
              )}
            </div>
          </motion.div>

          {/* Experience */}
          {experience && experience.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-2"
            >
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Briefcase className="h-3 w-3" />
                Experience
              </h3>
              {experience.slice(0, 2).map((exp, index) => (
                <div key={exp.id || index} className="text-xs space-y-0.5">
                  <div className="font-medium text-foreground">{exp.position || "Position"}</div>
                  <div className="text-muted-foreground">
                    {exp.company || "Company"} 
                    {exp.location && ` • ${exp.location}`}
                  </div>
                  {exp.startDate && (
                    <div className="text-muted-foreground/70 text-[10px]">
                      {exp.startDate} - {exp.current ? "Present" : exp.endDate || "Present"}
                    </div>
                  )}
                </div>
              ))}
              {experience.length > 2 && (
                <p className="text-[10px] text-muted-foreground">+{experience.length - 2} more</p>
              )}
            </motion.div>
          )}

          {/* Education */}
          {education && education.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <GraduationCap className="h-3 w-3" />
                Education
              </h3>
              {education.slice(0, 2).map((edu, index) => (
                <div key={edu.id || index} className="text-xs space-y-0.5">
                  <div className="font-medium text-foreground">
                    {edu.degree || "Degree"} {edu.field && `in ${edu.field}`}
                  </div>
                  <div className="text-muted-foreground">{edu.institution || "Institution"}</div>
                </div>
              ))}
            </motion.div>
          )}

          {/* Skills */}
          {skills && skills.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-2"
            >
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Code className="h-3 w-3" />
                Skills
              </h3>
              <div className="flex flex-wrap gap-1">
                {skills.slice(0, 2).map((skillGroup, index) => (
                  <div key={index}>
                    {skillGroup.skills?.slice(0, 4).map((skill, skillIndex) => (
                      <Badge key={skillIndex} variant="secondary" className="text-[10px] px-1.5 py-0 mr-1 mb-1">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Projects */}
          {projects && projects.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-2"
            >
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <FolderOpen className="h-3 w-3" />
                Projects
              </h3>
              {projects.slice(0, 2).map((project, index) => (
                <div key={project.id || index} className="text-xs">
                  <div className="font-medium text-foreground">{project.name || "Project"}</div>
                  {project.description && (
                    <div className="text-muted-foreground line-clamp-1">{project.description}</div>
                  )}
                </div>
              ))}
            </motion.div>
          )}
        </CardContent>
      </ScrollArea>
    </Card>
  );
}
