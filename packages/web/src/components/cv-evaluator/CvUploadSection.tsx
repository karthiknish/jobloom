"use client";

import { motion } from "framer-motion";
import { CvUploadForm } from "../../components/CvUploadForm";

interface CvUploadSectionProps {
  onResumeUpdate: (resume: any) => void;
  currentResume: any;
  currentAtsScore: any;
  setCurrentAtsScore: (score: any) => void;
}

export function CvUploadSection({
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
    >
      <div className="space-y-6">
        {/* Upload Form */}
        <CvUploadForm
          onResumeUpdate={onResumeUpdate}
          currentResume={currentResume}
          currentAtsScore={currentAtsScore}
          setCurrentAtsScore={setCurrentAtsScore}
        />
      </div>
    </motion.div>
  );
}
