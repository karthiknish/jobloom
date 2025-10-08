"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PreConfiguredTabs, TabContent } from "@/lib/tabs-utils";
import { CvUploadSection } from "./CvUploadSection";
import { CvAnalysisHistory } from "../../CvAnalysisHistory";
import { CvImprovementTracker } from "../../CvImprovementTracker";

interface CvAnalysisTabsProps {
  cvAnalyses?: any[];
  loading: boolean;
  onResumeUpdate: (resume: any) => void;
  currentResume: any;
  currentAtsScore: any;
  setCurrentAtsScore: (score: any) => void;
}

export function CvAnalysisTabs({
  cvAnalyses,
  loading,
  onResumeUpdate,
  currentResume,
  currentAtsScore,
  setCurrentAtsScore,
}: CvAnalysisTabsProps) {
  const [activeTab, setActiveTab] = useState("upload");

  return (
    <div className="space-y-6">
      {/* Centralized Tab Navigation */}
      <PreConfiguredTabs
        configKey="CV_MANAGER"
        initialTab="upload"
        onTabChange={setActiveTab}
        variant="default"
        showIcons={true}
        showDescriptions={true}
      />

      {/* Upload Tab */}
      <TabContent value="upload" activeTab={activeTab}>
        <CvUploadSection
          onResumeUpdate={onResumeUpdate}
          currentResume={currentResume}
          currentAtsScore={currentAtsScore}
          setCurrentAtsScore={setCurrentAtsScore}
        />
      </TabContent>

      {/* Analysis Results Tab */}
      <TabContent value="analyze" activeTab={activeTab}>
        <motion.div
          key="analyze"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <div className="text-center py-12">
            <p className="text-gray-500">Upload a CV first to see analysis results</p>
          </div>
        </motion.div>
      </TabContent>

      {/* History Tab */}
      <TabContent value="history" activeTab={activeTab}>
        <motion.div
          key="history"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="h-4 w-32 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 w-48 bg-gray-200 rounded mb-4"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-8 w-20 bg-gray-200 rounded"></div>
                    <div className="h-2 w-24 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <CvAnalysisHistory analyses={cvAnalyses ?? []} />
          )}
        </motion.div>
      </TabContent>

      {/* Progress Tracking Tab */}
      <TabContent value="tracking" activeTab={activeTab}>
        <motion.div
          key="tracking"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading progress data...</p>
            </div>
          ) : (
            <CvImprovementTracker analyses={cvAnalyses ?? []} />
          )}
        </motion.div>
      </TabContent>
    </div>
  );
}
