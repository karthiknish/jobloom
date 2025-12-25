"use client";

import { motion } from "framer-motion";
import { CvUploadForm } from "../CvUploadForm";

interface CvUploadSectionProps {
  userId: string;
  onResumeUpdate: (resume: any) => void;
  currentResume: any;
  currentAtsScore: any;
  setCurrentAtsScore: (score: any) => void;
}

export function CvUploadSection({
  userId,
  onResumeUpdate,
  currentResume,
  currentAtsScore,
  setCurrentAtsScore,
}: CvUploadSectionProps) {
  return (
    <motion.div
      key="upload"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      data-tour="cv-upload"
    >
      <div className="space-y-6">
        {/* Upload Form */}
        <CvUploadForm
          userId={userId}
          onResumeUpdate={onResumeUpdate}
          currentResume={currentResume}
          currentAtsScore={currentAtsScore}
          setCurrentAtsScore={setCurrentAtsScore}
        />
      </div>
    </motion.div>
  );
}
