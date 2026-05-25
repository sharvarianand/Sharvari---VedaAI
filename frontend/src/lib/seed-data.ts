import type { Assignment, QuestionPaper } from "@/types/assignment";

/**
 * Sample assignments used to populate the dashboard on a fresh install
 * so reviewers can see the "filled state" without manually creating data.
 * Cleared automatically when the user deletes them all.
 */

const DEMO_PAPER: QuestionPaper = {
  schoolName: "Delhi Public School, Sector-4, Bokaro",
  subject: "English",
  className: "5th",
  timeAllowedMinutes: 45,
  maximumMarks: 20,
  sections: [
    {
      id: "sec-a",
      title: "Section A",
      heading: "Short Answer Questions",
      instruction: "Attempt all questions. Each question carries 2 marks",
      questions: [
        { id: "q1", difficulty: "easy", marks: 2, text: "Define electroplating. Explain its purpose." },
        { id: "q2", difficulty: "moderate", marks: 2, text: "What is the role of a conductor in the process of electrolysis?" },
        { id: "q3", difficulty: "easy", marks: 2, text: "Why does a solution of copper sulfate conduct electricity?" },
        { id: "q4", difficulty: "moderate", marks: 2, text: "Describe one example of the chemical effect of electric current in daily life." },
        { id: "q5", difficulty: "moderate", marks: 2, text: "Explain why electric current is said to have chemical effects." },
        { id: "q6", difficulty: "hard", marks: 2, text: "How is sodium hydroxide prepared during the electrolysis of brine? Write the chemical reaction involved." },
        { id: "q7", difficulty: "hard", marks: 2, text: "What happens at the cathode and anode during the electrolysis of water? Name the gases evolved." },
        { id: "q8", difficulty: "easy", marks: 2, text: "Mention the type of current used in electroplating and justify why it is used." },
        { id: "q9", difficulty: "moderate", marks: 2, text: "What is the importance of electric current in the field of metallurgy?" },
        { id: "q10", difficulty: "hard", marks: 2, text: "Explain with a chemical equation how copper is deposited during the electroplating of an object." },
      ],
    },
  ],
  answerKey: [
    { questionId: "q1", answer: "Electroplating is the process of depositing a thin layer of metal on the surface of another metal using electric current. Its purpose is to prevent corrosion, improve appearance, or increase thickness." },
    { questionId: "q2", answer: "A conductor allows the flow of electric current, causing ions in the electrolyte to move and enabling chemical changes at electrodes." },
    { questionId: "q3", answer: "Copper sulfate solution contains free copper and sulfate ions which carry electric charge, thus conducting electricity." },
    { questionId: "q4", answer: "An example is the electroplating of silver on jewelry to prevent tarnishing." },
    { questionId: "q5", answer: "Electric current causes the movement of ions leading to chemical changes at the electrodes, hence it shows chemical effects." },
    { questionId: "q6", answer: "Sodium hydroxide is formed at the cathode during brine electrolysis as water gains electrons:\n2H₂O + 2e⁻ → H₂ + 2OH⁻\nNa⁺ + OH⁻ → NaOH (in solution)" },
    { questionId: "q7", answer: "At the cathode: water is reduced to hydrogen gas and hydroxide ions.\nAt the anode: water is oxidized to oxygen gas and hydrogen ions." },
    { questionId: "q8", answer: "Direct current (DC) is used because it ensures a steady, one-directional flow of ions for uniform metal deposition." },
    { questionId: "q9", answer: "Electric current is used in electrorefining, electroplating, and extraction of reactive metals from their ores." },
    { questionId: "q10", answer: "Cu²⁺ + 2e⁻ → Cu — copper ions in the electrolyte gain electrons at the cathode and deposit as a copper layer." },
  ],
};

function buildAssignment(index: number): Assignment {
  return {
    id: `demo-${index + 1}`,
    title: "Quiz on Electricity",
    assignedOn: "2025-06-20",
    dueOn: "2025-06-21",
    status: "ready",
    draft: {
      title: "Quiz on Electricity",
      file: null,
      dueDate: "2025-06-21",
      questionTypes: [],
      additionalInstructions: "",
    },
    currentVersion: 1,
    paperVersions: [
      {
        version: 1,
        title: "Quiz on Electricity",
        source: "ai",
        note: "Initial generated paper",
        paper: DEMO_PAPER,
        createdAt: "2025-06-20T09:30:00.000Z",
      },
    ],
    paper: DEMO_PAPER,
  };
}

export const DEMO_ASSIGNMENTS: Assignment[] = Array.from({ length: 7 }, (_, i) =>
  buildAssignment(i)
);
