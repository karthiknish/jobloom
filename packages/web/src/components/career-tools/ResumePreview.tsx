"use client";

import React from "react";
import { motion } from "framer-motion";
import { Eye, Mail, Phone, MapPin, Linkedin, Globe, Briefcase, GraduationCap, Code, FolderOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ResumeData } from "@/components/application/types";
import type { ResumePDFOptions } from "@/lib/resumePDFGenerator";
import { cn } from "@/lib/utils";

interface ResumePreviewProps {
  data: ResumeData;
  options?: ResumePDFOptions;
  className?: string;
}

const THEME_COLORS = {
  hireall: {
    primary: "text-[#10B77F]",
    primaryBg: "bg-[#10B77F]",
    primaryBorder: "border-[#10B77F]",
    primaryLight: "bg-[#10B77F]/5",
    primaryMuted: "border-[#10B77F]/20",
    primaryDot: "bg-[#10B77F]/40",
  },
  blue: {
    primary: "text-blue-600",
    primaryBg: "bg-blue-600",
    primaryBorder: "border-blue-600",
    primaryLight: "bg-blue-600/5",
    primaryMuted: "border-blue-600/20",
    primaryDot: "bg-blue-600/40",
  },
  gray: {
    primary: "text-slate-700",
    primaryBg: "bg-slate-700",
    primaryBorder: "border-slate-700",
    primaryLight: "bg-slate-700/5",
    primaryMuted: "border-slate-700/20",
    primaryDot: "bg-slate-700/40",
  },
  green: {
    primary: "text-emerald-600",
    primaryBg: "bg-emerald-600",
    primaryBorder: "border-emerald-600",
    primaryLight: "bg-emerald-600/5",
    primaryMuted: "border-emerald-600/20",
    primaryDot: "bg-emerald-600/40",
  },
  purple: {
    primary: "text-purple-600",
    primaryBg: "bg-purple-600",
    primaryBorder: "border-purple-600",
    primaryLight: "bg-purple-600/5",
    primaryMuted: "border-purple-600/20",
    primaryDot: "bg-purple-600/40",
  },
  orange: {
    primary: "text-orange-600",
    primaryBg: "bg-orange-600",
    primaryBorder: "border-orange-600",
    primaryLight: "bg-orange-600/5",
    primaryMuted: "border-orange-600/20",
    primaryDot: "bg-orange-600/40",
  },
};

/**
 * Live preview component that shows resume content in real-time
 * Updates as user types in the form fields
 */
export function ResumePreview({ data, options, className }: ResumePreviewProps) {
  const { personalInfo, experience, education, skills, projects } = data;
  const theme = THEME_COLORS[options?.colorScheme || 'hireall'] || THEME_COLORS.hireall;
  const template = options?.template || 'modern';
  
  const hasContent = Boolean(
    personalInfo?.fullName ||
    personalInfo?.email ||
    (experience && experience.length > 0) ||
    (education && education.length > 0) ||
    (skills && skills.length > 0)
  );

  if (!hasContent) {
    return (
      <Card className={`lg:sticky lg:top-24 ${className}`}>
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

  const renderTemplate = () => {
    switch (template) {
      case 'classic':
        return <ClassicLayout data={data} theme={theme} />;
      case 'creative':
        return <CreativeLayout data={data} theme={theme} />;
      case 'executive':
        return <ExecutiveLayout data={data} theme={theme} />;
      case 'technical':
        return <TechnicalLayout data={data} theme={theme} />;
      case 'modern':
      default:
        return <ModernLayout data={data} theme={theme} />;
    }
  };

  return (
    <Card className={`lg:sticky lg:top-24 overflow-hidden border-none shadow-xl bg-slate-50/50 ${className}`}>
      <CardHeader className="pb-3 border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <CardTitle className="text-sm font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full animate-pulse", theme.primaryBg)} />
            <span className="bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
              Live Preview ({template.charAt(0).toUpperCase() + template.slice(1)})
            </span>
          </div>
          <Badge variant="outline" className={cn("text-[10px] font-bold uppercase tracking-wider border-none", theme.primaryLight, theme.primary)}>
            Real-time
          </Badge>
        </CardTitle>
      </CardHeader>
      <ScrollArea className="h-[calc(100vh-400px)] lg:h-[calc(100vh-200px)]">
        <CardContent className="p-0">
          <div className="bg-white mx-auto my-4 shadow-2xl border border-slate-200/60 min-h-[842px] w-full max-w-[595px] origin-top transition-transform duration-500">
            {renderTemplate()}
          </div>
        </CardContent>
      </ScrollArea>
    </Card>
  );
}

/**
 * MODERN LAYOUT
 */
function ModernLayout({ data, theme }: { data: ResumeData; theme: any }) {
  const { personalInfo, experience, education, skills, projects } = data;
  return (
    <div className="p-10 space-y-8">
      {/* Header / Personal Info */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn("border-b-2 pb-6", theme.primaryMuted)}
      >
        {personalInfo?.fullName && (
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            {personalInfo.fullName}
          </h2>
        )}
        
        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-[12px] text-slate-600">
          {personalInfo?.email && (
            <span className="flex items-center gap-1.5">
              <Mail className={cn("h-3.5 w-3.5", theme.primary)} />
              {personalInfo.email}
            </span>
          )}
          {personalInfo?.phone && (
            <span className="flex items-center gap-1.5">
              <Phone className={cn("h-3.5 w-3.5", theme.primary)} />
              {personalInfo.phone}
            </span>
          )}
          {personalInfo?.location && (
            <span className="flex items-center gap-1.5">
              <MapPin className={cn("h-3.5 w-3.5", theme.primary)} />
              {personalInfo.location}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 text-[12px] font-semibold">
          {personalInfo?.linkedin && (
            <span className="flex items-center gap-1.5 text-blue-600">
              <Linkedin className="h-3.5 w-3.5" />
              LinkedIn
            </span>
          )}
          {personalInfo?.website && (
            <span className="flex items-center gap-1.5 text-primary">
              <Globe className={cn("h-3.5 w-3.5", theme.primary)} />
              Portfolio
            </span>
          )}
        </div>

        {personalInfo?.summary && (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-[13px] text-slate-700 leading-relaxed font-medium italic opacity-90">
              &ldquo;{personalInfo.summary}&rdquo;
            </p>
          </div>
        )}
      </motion.div>

      {/* Experience */}
      {experience && experience.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-5"
        >
          <h3 className={cn("text-[12px] font-black uppercase tracking-[0.25em] flex items-center gap-2 border-b-2 border-slate-100 pb-2", theme.primary)}>
            <Briefcase className="h-4 w-4" />
            Professional Experience
          </h3>
          <div className="space-y-8">
            {experience.map((exp, index) => (
              <div key={exp.id || index} className="space-y-3 relative pl-4 border-l-2 border-slate-50">
                <div className={cn("absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-2", theme.primaryMuted)} />
                <div className="flex justify-between items-baseline gap-4">
                  <div className="font-bold text-[15px] text-slate-900 leading-tight">
                    {exp.position || "Position Title"}
                  </div>
                  {exp.startDate && (
                    <div className="text-slate-500 text-[11px] font-bold whitespace-nowrap bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                      {exp.startDate} &mdash; {exp.current ? "Present" : exp.endDate || "Present"}
                    </div>
                  )}
                </div>
                <div className={cn("text-[14px] font-bold", theme.primary)}>
                  {exp.company || "Company Name"} 
                  {exp.location && <span className="text-slate-400 font-medium"> • {exp.location}</span>}
                </div>
                {exp.description && (
                  <p className="text-[13px] text-slate-600 leading-relaxed">
                    {exp.description}
                  </p>
                )}
                {exp.achievements && exp.achievements.length > 0 && (
                  <ul className="space-y-2 mt-3">
                    {exp.achievements.map((ach, i) => ach && (
                      <li key={i} className="text-[12.5px] text-slate-600 flex gap-3">
                        <span className={cn("mt-2 flex-shrink-0 w-1.5 h-1.5 rounded-full", theme.primaryDot)} />
                        <span className="leading-snug">{ach}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-5"
        >
          <h3 className={cn("text-[12px] font-black uppercase tracking-[0.25em] flex items-center gap-2 border-b-2 border-slate-100 pb-2", theme.primary)}>
            <GraduationCap className="h-4 w-4" />
            Education
          </h3>
          <div className="space-y-5">
            {education.map((edu, index) => (
              <div key={edu.id || index} className="space-y-1.5">
                <div className="flex justify-between items-baseline gap-4">
                  <div className="font-bold text-[15px] text-slate-900 leading-tight">
                    {edu.degree || "Degree"} {edu.field && <span className="text-slate-500 font-semibold">in {edu.field}</span>}
                  </div>
                  {edu.graduationDate && (
                    <div className="text-slate-500 text-[11px] font-bold whitespace-nowrap">
                      {edu.graduationDate}
                    </div>
                  )}
                </div>
                <div className="text-[14px] font-bold text-slate-700">{edu.institution || "Institution Name"}</div>
                {edu.honors && (
                  <p className="text-[12px] text-slate-500 italic font-medium">{edu.honors}</p>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Skills */}
      {skills && skills.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-5"
        >
          <h3 className={cn("text-[12px] font-black uppercase tracking-[0.25em] flex items-center gap-2 border-b-2 border-slate-100 pb-2", theme.primary)}>
            <Code className="h-4 w-4" />
            Skills & Expertise
          </h3>
          <div className="flex flex-wrap gap-2.5">
            {skills.map((skillGroup, index) => (
              <React.Fragment key={index}>
                {skillGroup.skills?.map((skill, skillIndex) => (
                  <Badge 
                    key={skillIndex} 
                    variant="outline" 
                    className={cn("text-[12px] px-3 py-1 bg-slate-50 text-slate-800 border-slate-200 font-bold shadow-sm hover:bg-white transition-colors", theme.primaryLight, theme.primaryBorder)}
                  >
                    {skill}
                  </Badge>
                ))}
              </React.Fragment>
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
          className="space-y-5"
        >
          <h3 className={cn("text-[12px] font-black uppercase tracking-[0.25em] flex items-center gap-2 border-b-2 border-slate-100 pb-2", theme.primary)}>
            <FolderOpen className="h-4 w-4" />
            Key Projects
          </h3>
          <div className="space-y-5">
            {projects.map((project, index) => (
              <div key={project.id || index} className="space-y-2">
                <div className="font-bold text-[15px] text-slate-900 leading-tight">{project.name || "Project Name"}</div>
                {project.technologies && project.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {project.technologies.map((tech, i) => (
                      <span key={i} className={cn("text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded", theme.primaryLight, theme.primary)}>
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
                {project.description && (
                  <div className="text-[13px] text-slate-600 leading-relaxed font-medium">{project.description}</div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

/**
 * CLASSIC LAYOUT
 */
function ClassicLayout({ data, theme }: { data: ResumeData; theme: any }) {
  const { personalInfo, experience, education, skills, projects } = data;
  return (
    <div className="p-10 space-y-8 font-serif">
      {/* Centered Header */}
      <div className="text-center space-y-3 border-b pb-6">
        <h2 className="text-3xl font-bold text-slate-900 uppercase tracking-wide">
          {personalInfo?.fullName}
        </h2>
        <div className="flex justify-center flex-wrap gap-x-3 text-[12px] text-slate-600">
          {personalInfo?.email && <span>{personalInfo.email}</span>}
          {personalInfo?.phone && <span>• {personalInfo.phone}</span>}
          {personalInfo?.location && <span>• {personalInfo.location}</span>}
        </div>
        <div className="flex justify-center flex-wrap gap-x-3 text-[11px] font-bold text-slate-500">
          {personalInfo?.linkedin && <span>LINKEDIN: {personalInfo.linkedin}</span>}
          {personalInfo?.website && <span>PORTFOLIO: {personalInfo.website}</span>}
        </div>
      </div>

      {/* Summary */}
      {personalInfo?.summary && (
        <div className="space-y-2">
          <h3 className={cn("text-[13px] font-bold uppercase border-b pb-1", theme.primary)}>Professional Summary</h3>
          <p className="text-[13px] text-slate-700 leading-relaxed">{personalInfo.summary}</p>
        </div>
      )}

      {/* Experience */}
      {experience && experience.length > 0 && (
        <div className="space-y-4">
          <h3 className={cn("text-[13px] font-bold uppercase border-b pb-1", theme.primary)}>Experience</h3>
          <div className="space-y-6">
            {experience.map((exp, index) => (
              <div key={exp.id || index} className="space-y-1">
                <div className="flex justify-between font-bold text-[14px]">
                  <span>{exp.company}</span>
                  <span>{exp.startDate} - {exp.current ? "Present" : exp.endDate}</span>
                </div>
                <div className="italic text-[13px] text-slate-700">{exp.position}</div>
                {exp.description && <p className="text-[12px] text-slate-600 mt-1">{exp.description}</p>}
                {exp.achievements && (
                  <ul className="list-disc list-inside space-y-1 mt-2">
                    {exp.achievements.map((ach, i) => ach && (
                      <li key={i} className="text-[12px] text-slate-600">{ach}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <div className="space-y-4">
          <h3 className={cn("text-[13px] font-bold uppercase border-b pb-1", theme.primary)}>Education</h3>
          <div className="space-y-4">
            {education.map((edu, index) => (
              <div key={edu.id || index} className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-[14px]">{edu.institution}</div>
                  <div className="text-[13px]">{edu.degree} in {edu.field}</div>
                </div>
                <div className="text-[12px] font-bold">{edu.graduationDate}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * CREATIVE LAYOUT
 */
function CreativeLayout({ data, theme }: { data: ResumeData; theme: any }) {
  const { personalInfo, experience, education, skills, projects } = data;
  return (
    <div className="flex min-h-[842px]">
      {/* Sidebar */}
      <div className={cn("w-[200px] p-8 text-white space-y-8", theme.primaryBg)}>
        <div className="space-y-4">
          <h2 className="text-2xl font-black leading-tight uppercase">{personalInfo?.fullName}</h2>
          <div className="space-y-3 text-[11px] opacity-90">
            {personalInfo?.email && <div className="flex items-center gap-2"><Mail className="h-3 w-3" /> {personalInfo.email}</div>}
            {personalInfo?.phone && <div className="flex items-center gap-2"><Phone className="h-3 w-3" /> {personalInfo.phone}</div>}
            {personalInfo?.location && <div className="flex items-center gap-2"><MapPin className="h-3 w-3" /> {personalInfo.location}</div>}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-[12px] font-bold uppercase tracking-widest border-b border-white/20 pb-2">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {skills.flatMap(g => g.skills).map((s, i) => (
              <span key={i} className="text-[10px] bg-white/10 px-2 py-1 rounded">{s}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-10 space-y-8 bg-white">
        {personalInfo?.summary && (
          <div className="space-y-3">
            <h3 className={cn("text-[14px] font-black uppercase tracking-widest", theme.primary)}>About Me</h3>
            <p className="text-[13px] text-slate-600 leading-relaxed">{personalInfo.summary}</p>
          </div>
        )}

        <div className="space-y-6">
          <h3 className={cn("text-[14px] font-black uppercase tracking-widest", theme.primary)}>Experience</h3>
          <div className="space-y-8">
            {experience.map((exp, index) => (
              <div key={exp.id || index} className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <h4 className="font-bold text-slate-900">{exp.position}</h4>
                  <span className="text-[11px] font-bold text-slate-400">{exp.startDate} - {exp.current ? "Present" : exp.endDate}</span>
                </div>
                <div className={cn("text-[13px] font-bold", theme.primary)}>{exp.company}</div>
                <p className="text-[12px] text-slate-500">{exp.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * EXECUTIVE LAYOUT
 */
function ExecutiveLayout({ data, theme }: { data: ResumeData; theme: any }) {
  const { personalInfo, experience, education, skills, projects } = data;
  return (
    <div className="p-12 space-y-10 font-serif bg-[#fcfcfc]">
      <div className="border-l-4 border-slate-900 pl-6 py-2">
        <h2 className="text-4xl font-light text-slate-900 tracking-tight">{personalInfo?.fullName}</h2>
        <p className="text-sm text-slate-500 mt-2 tracking-widest uppercase">{personalInfo?.location}</p>
      </div>

      <div className="grid grid-cols-3 gap-10">
        <div className="col-span-2 space-y-8">
          <section className="space-y-4">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400">Executive Profile</h3>
            <p className="text-[14px] text-slate-800 leading-relaxed italic">&ldquo;{personalInfo.summary}&rdquo;</p>
          </section>

          <section className="space-y-6">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400">Professional History</h3>
            {experience.map((exp, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <h4 className="text-[16px] font-bold text-slate-900">{exp.company}</h4>
                  <span className="text-[12px] text-slate-500">{exp.startDate} - {exp.endDate}</span>
                </div>
                <p className={cn("text-[13px] font-semibold uppercase tracking-wider", theme.primary)}>{exp.position}</p>
                <ul className="space-y-1.5 mt-3">
                  {exp.achievements.map((ach, j) => (
                    <li key={j} className="text-[13px] text-slate-700 flex gap-3">
                      <span className="text-slate-300">•</span>
                      {ach}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        </div>

        <div className="space-y-8">
          <section className="space-y-4">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400">Contact</h3>
            <div className="space-y-2 text-[12px] text-slate-600">
              <p>{personalInfo.email}</p>
              <p>{personalInfo.phone}</p>
              <p className={theme.primary}>{personalInfo.linkedin}</p>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-400">Expertise</h3>
            <div className="flex flex-col gap-2">
              {skills.flatMap(g => g.skills).map((s, i) => (
                <span key={i} className="text-[12px] text-slate-700 font-medium border-b border-slate-100 pb-1">{s}</span>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

/**
 * TECHNICAL LAYOUT
 */
function TechnicalLayout({ data, theme }: { data: ResumeData; theme: any }) {
  const { personalInfo, experience, education, skills, projects } = data;
  return (
    <div className="p-10 space-y-8 font-mono text-[12px]">
      <div className="border-2 border-slate-900 p-6 space-y-2">
        <h2 className="text-2xl font-bold">{personalInfo?.fullName}</h2>
        <div className="flex flex-wrap gap-4 text-slate-600">
          <span>{personalInfo.email}</span>
          <span>{personalInfo.phone}</span>
          <span>{personalInfo.location}</span>
        </div>
      </div>

      <section className="space-y-4">
        <h3 className={cn("text-[14px] font-bold bg-slate-900 text-white px-2 py-1 inline-block", theme.primaryBg)}>./skills_and_tech</h3>
        <div className="grid grid-cols-2 gap-4">
          {skills.map((g, i) => (
            <div key={i} className="space-y-1">
              <div className="font-bold text-slate-900">{g.category}:</div>
              <div className="text-slate-600">{g.skills.join(', ')}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h3 className={cn("text-[14px] font-bold bg-slate-900 text-white px-2 py-1 inline-block", theme.primaryBg)}>./experience</h3>
        {experience.map((exp, i) => (
          <div key={i} className="space-y-2 border-l-2 border-slate-200 pl-4">
            <div className="flex justify-between font-bold">
              <span>{exp.position} @ {exp.company}</span>
              <span>[{exp.startDate} - {exp.endDate}]</span>
            </div>
            <p className="text-slate-600 leading-relaxed">{exp.description}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {exp.achievements.map((ach, j) => (
                <div key={j} className="bg-slate-50 p-2 rounded border border-slate-100 w-full">
                  &gt; {ach}
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
