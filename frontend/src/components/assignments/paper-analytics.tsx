"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Clock, BrainCircuit, Target, CheckCircle2 } from "lucide-react";
import type { QuestionPaper } from "@/types/assignment";

interface PaperAnalyticsProps {
  paper: QuestionPaper;
}

const COLORS = {
  easy: "#10b981", // emerald-500
  moderate: "#f59e0b", // amber-500
  hard: "#ef4444", // red-500
  brand: "#f04e23", // brand color
  muted: "#e5e5e5"
};

export function PaperAnalytics({ paper }: PaperAnalyticsProps) {
  const stats = useMemo(() => {
    let easyCount = 0, moderateCount = 0, hardCount = 0;
    let easyMarks = 0, moderateMarks = 0, hardMarks = 0;
    
    // Simple Bloom's taxonomy estimation based on keywords
    const taxonomy = {
      remember: 0,
      understand: 0,
      apply: 0,
      analyze: 0
    };

    const questions = paper.sections.flatMap(s => s.questions);
    const totalQuestions = questions.length;
    
    for (const q of questions) {
      if (q.difficulty === "easy") { easyCount++; easyMarks += q.marks; }
      else if (q.difficulty === "moderate") { moderateCount++; moderateMarks += q.marks; }
      else if (q.difficulty === "hard") { hardCount++; hardMarks += q.marks; }

      // Rough bloom's heuristic
      const text = q.text.toLowerCase();
      if (text.match(/what|who|when|where|define|list|state|name/)) taxonomy.remember++;
      else if (text.match(/explain|describe|summarize|discuss|compare/)) taxonomy.understand++;
      else if (text.match(/use|solve|calculate|apply|show|demonstrate/)) taxonomy.apply++;
      else taxonomy.analyze++; // fallback for others (analyze, evaluate, create)
    }

    return {
      difficulty: [
        { name: "Easy", value: easyCount, fill: COLORS.easy },
        { name: "Moderate", value: moderateCount, fill: COLORS.moderate },
        { name: "Hard", value: hardCount, fill: COLORS.hard }
      ],
      marksDistribution: [
        { name: "Easy", marks: easyMarks, fill: COLORS.easy },
        { name: "Mod.", marks: moderateMarks, fill: COLORS.moderate },
        { name: "Hard", marks: hardMarks, fill: COLORS.hard }
      ],
      taxonomy: [
        { name: "Remember", value: Math.round((taxonomy.remember/totalQuestions)*100) || 0 },
        { name: "Understand", value: Math.round((taxonomy.understand/totalQuestions)*100) || 0 },
        { name: "Apply", value: Math.round((taxonomy.apply/totalQuestions)*100) || 0 },
        { name: "Analyze", value: Math.round((taxonomy.analyze/totalQuestions)*100) || 0 }
      ],
      estimatedTime: paper.timeAllowedMinutes,
      totalQuestions,
      totalMarks: paper.maximumMarks
    };
  }, [paper]);

  return (
    <div className="card-elevated rounded-3xl bg-surface p-5 sm:p-7 print:hidden">
      <div className="flex items-center gap-2 mb-6">
        <BrainCircuit className="h-5 w-5 text-brand" />
        <h2 className="text-[18px] font-semibold text-ink">Paper Analytics</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_200px] lg:grid-cols-[1fr_300px_250px]">
        
        {/* Main Stats Summary */}
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-surface-muted p-4 border border-line">
              <div className="flex items-center gap-2 text-ink-muted mb-2">
                <Target className="h-4 w-4" />
                <span className="text-[13px] font-semibold">Total Score</span>
              </div>
              <p className="text-2xl font-bold text-ink">{stats.totalMarks}</p>
              <p className="text-[12px] text-ink-subtle mt-1">{stats.totalQuestions} questions</p>
            </div>
            
            <div className="rounded-2xl bg-surface-muted p-4 border border-line">
              <div className="flex items-center gap-2 text-ink-muted mb-2">
                <Clock className="h-4 w-4" />
                <span className="text-[13px] font-semibold">Est. Time</span>
              </div>
              <p className="text-2xl font-bold text-ink">{stats.estimatedTime}m</p>
              <p className="text-[12px] text-ink-subtle mt-1">Average paced</p>
            </div>
          </div>

          {/* Bloom's Taxonomy Bars */}
          <div className="rounded-2xl bg-surface-muted p-4 border border-line flex-1">
            <h3 className="text-[13px] font-semibold text-ink-muted mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Cognitive Level Estimate (Bloom&apos;s)
            </h3>
            <div className="space-y-3">
              {stats.taxonomy.map(item => (
                <div key={item.name}>
                  <div className="flex justify-between text-[12px] mb-1 font-medium">
                    <span className="text-ink">{item.name}</span>
                    <span className="text-ink-muted">{item.value}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-line rounded-full overflow-hidden">
                    <div className="h-full bg-brand transition-all" style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Difficulty Chart */}
        <div className="rounded-2xl bg-surface-muted p-4 border border-line flex flex-col items-center justify-center min-h-[220px]">
          <h3 className="text-[13px] font-semibold text-ink-muted mb-2 w-full">Question Difficulty</h3>
          <div className="h-[140px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={10} minHeight={140}>
              <PieChart>
                <Pie
                  data={stats.difficulty}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {stats.difficulty.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontSize: '13px', fontWeight: 600 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-3 text-[11px] font-medium text-ink mt-2">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"/>Easy</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"/>Mod.</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"/>Hard</span>
          </div>
        </div>

        {/* Marks Distribution */}
        <div className="rounded-2xl bg-surface-muted p-4 border border-line flex flex-col min-h-[220px] lg:col-span-1 md:col-span-2">
          <h3 className="text-[13px] font-semibold text-ink-muted mb-4">Marks by Difficulty</h3>
          <div className="h-[140px] w-full mt-auto">
            <ResponsiveContainer width="100%" height="100%" minWidth={10} minHeight={140}>
              <BarChart data={stats.marksDistribution} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={COLORS.muted} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b6b6b' }} dy={5} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6b6b6b' }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="marks" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {stats.marksDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
