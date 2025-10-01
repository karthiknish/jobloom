'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResumeData } from '../types';

interface CertificationsFormProps {
  certifications: ResumeData['certifications'];
  setCertifications: (certifications: ResumeData['certifications']) => void;
}

export default function CertificationsForm({ certifications, setCertifications }: CertificationsFormProps) {
  const [newCertification, setNewCertification] = useState({
    name: '',
    issuer: '',
    date: '',
    credentialId: ''
  });

  const addCertification = () => {
    if (newCertification.name && newCertification.issuer) {
      const certification = {
        id: Date.now().toString(),
        name: newCertification.name,
        issuer: newCertification.issuer,
        date: newCertification.date,
        credentialId: newCertification.credentialId || undefined
      };
      setCertifications([...(certifications || []), certification]);
      setNewCertification({
        name: '',
        issuer: '',
        date: '',
        credentialId: ''
      });
    }
  };

  const removeCertification = (id: string) => {
    setCertifications((certifications || []).filter(cert => cert.id !== id));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Certifications</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="certName">Certification Name</Label>
          <Input
            id="certName"
            type="text"
            placeholder="Certification Name"
            value={newCertification.name}
            onChange={(e) => setNewCertification({ ...newCertification, name: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="issuer">Issuing Organization</Label>
          <Input
            id="issuer"
            type="text"
            placeholder="Issuing Organization"
            value={newCertification.issuer}
            onChange={(e) => setNewCertification({ ...newCertification, issuer: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="certDate">Date Obtained</Label>
          <Input
            id="certDate"
            type="month"
            placeholder="Date Obtained"
            value={newCertification.date}
            onChange={(e) => setNewCertification({ ...newCertification, date: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="credentialId">Credential ID (optional)</Label>
          <Input
            id="credentialId"
            type="text"
            placeholder="Credential ID (optional)"
            value={newCertification.credentialId}
            onChange={(e) => setNewCertification({ ...newCertification, credentialId: e.target.value })}
          />
        </div>
      </div>
      
      <Button
        type="button"
        onClick={addCertification}
      >
        Add Certification
      </Button>

      {(certifications || []).map((cert) => (
        <div key={cert.id} className="p-4 border rounded-md">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-medium">{cert.name}</h4>
              <p className="text-muted-foreground">{cert.issuer}</p>
              <p className="text-sm text-muted-foreground">
                {cert.date}
                {cert.credentialId && ` • ID: ${cert.credentialId}`}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => removeCertification(cert.id)}
              className="text-destructive hover:text-destructive"
            >
              Remove
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}