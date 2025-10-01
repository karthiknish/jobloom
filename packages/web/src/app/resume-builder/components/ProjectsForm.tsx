'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ResumeData } from '../types';

interface ProjectsFormProps {
  projects: ResumeData['projects'];
  setProjects: (projects: ResumeData['projects']) => void;
}

export default function ProjectsForm({ projects, setProjects }: ProjectsFormProps) {
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    technologies: '',
    link: '',
    github: '',
    users: '',
    performance: '',
    revenue: ''
  });

  const addProject = () => {
    if (newProject.name && newProject.description) {
      const project = {
        id: Date.now().toString(),
        name: newProject.name,
        description: newProject.description,
        technologies: newProject.technologies.split(',').map(t => t.trim()).filter(t => t),
        link: newProject.link || undefined,
        github: newProject.github || undefined,
        metrics: {
          users: newProject.users || undefined,
          performance: newProject.performance || undefined,
          revenue: newProject.revenue || undefined
        }
      };
      setProjects([...projects, project]);
      setNewProject({
        name: '',
        description: '',
        technologies: '',
        link: '',
        github: '',
        users: '',
        performance: '',
        revenue: ''
      });
    }
  };

  const removeProject = (id: string) => {
    setProjects(projects.filter(project => project.id !== id));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Projects</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="projectName">Project Name</Label>
          <Input
            id="projectName"
            type="text"
            placeholder="Project Name"
            value={newProject.name}
            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="technologies">Technologies (comma-separated)</Label>
          <Input
            id="technologies"
            type="text"
            placeholder="Technologies (comma-separated)"
            value={newProject.technologies}
            onChange={(e) => setNewProject({ ...newProject, technologies: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="projectLink">Project Link (optional)</Label>
          <Input
            id="projectLink"
            type="url"
            placeholder="Project Link (optional)"
            value={newProject.link}
            onChange={(e) => setNewProject({ ...newProject, link: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="githubUrl">GitHub URL (optional)</Label>
          <Input
            id="githubUrl"
            type="url"
            placeholder="GitHub URL (optional)"
            value={newProject.github}
            onChange={(e) => setNewProject({ ...newProject, github: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="users">Users/Scale (optional)</Label>
          <Input
            id="users"
            type="text"
            placeholder="Users/Scale (optional)"
            value={newProject.users}
            onChange={(e) => setNewProject({ ...newProject, users: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="performance">Performance Metrics (optional)</Label>
          <Input
            id="performance"
            type="text"
            placeholder="Performance Metrics (optional)"
            value={newProject.performance}
            onChange={(e) => setNewProject({ ...newProject, performance: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="revenue">Revenue Impact (optional)</Label>
          <Input
            id="revenue"
            type="text"
            placeholder="Revenue Impact (optional)"
            value={newProject.revenue}
            onChange={(e) => setNewProject({ ...newProject, revenue: e.target.value })}
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="projectDescription">Project Description</Label>
        <Textarea
          id="projectDescription"
          placeholder="Project Description"
          value={newProject.description}
          onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
          rows={3}
        />
      </div>
      
      <Button
        type="button"
        onClick={addProject}
      >
        Add Project
      </Button>

      {projects.map((project) => (
        <div key={project.id} className="p-4 border rounded-md">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h4 className="font-medium">{project.name}</h4>
              <p className="text-muted-foreground mt-1">{project.description}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {project.technologies.map((tech, index) => (
                  <span key={index} className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded">
                    {tech}
                  </span>
                ))}
              </div>
              {(project.link || project.github) && (
                <div className="flex gap-4 mt-2">
                  {project.link && (
                    <a href={project.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
                      Live Demo
                    </a>
                  )}
                  {project.github && (
                    <a href={project.github} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">
                      GitHub
                    </a>
                  )}
                </div>
              )}
              {project.metrics && (
                <div className="text-sm text-muted-foreground mt-2">
                  {project.metrics.users && <span>📊 {project.metrics.users} • </span>}
                  {project.metrics.performance && <span>⚡ {project.metrics.performance} • </span>}
                  {project.metrics.revenue && <span>💰 {project.metrics.revenue}</span>}
                </div>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => removeProject(project.id)}
              className="text-destructive hover:text-destructive ml-4"
            >
              Remove
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}