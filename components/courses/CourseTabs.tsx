"use client";

import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { CourseDetail } from "@/types/course";
import { CourseModuleAccordion } from "./CourseModuleAccordion";
import { CourseAssignments } from "./CourseAssignments";
import { BookOpen, FileText, CheckSquare, Users, MessageSquare } from "lucide-react";

interface Props {
  course: CourseDetail;
}

export function CourseTabs({ course }: Props) {
  const [activeTab, setActiveTab] = useState('curriculum');

  const tabs = [
    { id: 'curriculum', label: 'Curriculum', icon: BookOpen },
    { id: 'assignments', label: 'Assignments', icon: FileText },
    { id: 'quizzes', label: 'Quizzes', icon: CheckSquare },
    { id: 'discussions', label: 'Discussions', icon: MessageSquare },
  ];

  return (
    <div className="mt-6">
      {/* Tab Navigation */}
      <div className="flex overflow-x-auto custom-scrollbar border-b border-white/5 mb-8">
        <div className="flex gap-8 px-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 relative transition-colors focus:outline-none whitespace-nowrap ${
                  isActive ? "text-blue-400" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon size={18} />
                <span className="font-medium text-sm sm:text-base">{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'curriculum' && <CourseModuleAccordion modules={course.modules} />}
            {activeTab === 'assignments' && <CourseAssignments course={course} />}
            {activeTab === 'quizzes' && (
              <div className="glass-panel p-8 rounded-2xl text-center text-slate-400 border border-white/5">
                Quiz list component goes here
              </div>
            )}
            {activeTab === 'discussions' && (
              <div className="glass-panel p-8 rounded-2xl text-center text-slate-400 border border-white/5">
                Discussions component goes here
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
