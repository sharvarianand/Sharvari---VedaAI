import type { GenerationInput, LlmAdapter, QuestionPaper, QuestionTypeKey, GenerationResult } from "../types.js";

/**
 * Deterministic adapter used as the zero-config default.
 *
 * Builds a believable paper from the requested counts/marks so reviewers can
 * exercise the full pipeline without provisioning an API key. Output passes
 * the same schema validation as real adapters, which gives us free
 * regression coverage of the parser/contract.
 */

const TEMPLATES: Record<QuestionTypeKey, { heading: string; instruction: (mpq: number) => string; q: string[]; ans: string[] }> = {
  mcq: {
    heading: "Multiple Choice Questions",
    instruction: (mpq) => `Choose the correct option. Each question carries ${mpq} mark${mpq === 1 ? "" : "s"}.`,
    q: [
      "Which of the following is the SI unit of electric current? (A) Volt (B) Ampere (C) Ohm (D) Watt",
      "Photosynthesis primarily occurs in which organelle? (A) Mitochondria (B) Nucleus (C) Chloroplast (D) Ribosome",
      "Which planet is known as the Red Planet? (A) Venus (B) Mars (C) Jupiter (D) Saturn",
      "The chemical symbol for gold is — (A) Au (B) Ag (C) Gd (D) Go",
      "Sound travels fastest in — (A) Vacuum (B) Air (C) Water (D) Steel",
      "The largest mammal in the world is — (A) Elephant (B) Blue Whale (C) Giraffe (D) Polar Bear",
      "Which gas is most abundant in Earth's atmosphere? (A) Oxygen (B) Carbon dioxide (C) Nitrogen (D) Hydrogen",
      "The boiling point of pure water at sea level is — (A) 90°C (B) 100°C (C) 110°C (D) 120°C",
    ],
    ans: ["B", "C", "B", "A", "D", "B", "C", "B"],
  },
  short: {
    heading: "Short Answer Questions",
    instruction: (mpq) => `Attempt all questions. Each question carries ${mpq} mark${mpq === 1 ? "" : "s"}.`,
    q: [
      "Define electroplating and explain its purpose.",
      "What is the role of a conductor in electrolysis?",
      "Why does a solution of copper sulfate conduct electricity?",
      "Describe one example of the chemical effect of electric current in daily life.",
      "Explain why electric current is said to have chemical effects.",
      "State two differences between AC and DC current.",
      "What is the function of a battery in an electric circuit?",
      "Define resistance and state its SI unit.",
    ],
    ans: [
      "Electroplating deposits a thin layer of metal on another using electric current to prevent corrosion or improve appearance.",
      "A conductor allows electric current to flow, enabling ions in the electrolyte to move and react at the electrodes.",
      "Copper sulfate solution contains free Cu²⁺ and SO₄²⁻ ions that carry charge.",
      "Electroplating silver onto jewelry prevents tarnishing.",
      "Current causes ion migration that drives chemical reactions at electrodes.",
      "AC reverses direction periodically, DC flows in one direction; AC is used for transmission, DC for batteries.",
      "A battery supplies the EMF that drives current around the circuit.",
      "Resistance opposes current flow; SI unit is the ohm (Ω).",
    ],
  },
  long: {
    heading: "Long Answer Questions",
    instruction: (mpq) => `Answer in detail. Each question carries ${mpq} mark${mpq === 1 ? "" : "s"}.`,
    q: [
      "Describe the structure and function of a typical animal cell with a labelled sketch.",
      "Explain the water cycle with the help of a diagram.",
      "Discuss how renewable energy sources can address climate change.",
      "Compare the digestive systems of herbivores and carnivores.",
    ],
    ans: [
      "Cell membrane, cytoplasm, nucleus, mitochondria, ER, Golgi apparatus, ribosomes — describe each role.",
      "Evaporation, condensation, precipitation, infiltration, runoff — explain transitions and energy source.",
      "Solar/wind/hydro reduce CO₂ emissions, lower long-term cost, but need storage and grid upgrades.",
      "Herbivores have longer intestines and cellulose-fermentation chambers; carnivores have shorter, acidic guts.",
    ],
  },
  diagram: {
    heading: "Diagram-Based Questions",
    instruction: (mpq) => `Draw and label the diagrams. Each question carries ${mpq} mark${mpq === 1 ? "" : "s"}.`,
    q: [
      "Draw a labelled diagram of the human eye.",
      "Sketch a simple electric circuit with a battery, switch, and bulb.",
      "Draw and label the parts of a flowering plant.",
      "Sketch the cross-section of a leaf showing tissues.",
      "Draw a labelled diagram of the water cycle.",
    ],
    ans: [
      "Cornea, iris, pupil, lens, retina, optic nerve.",
      "Closed loop with battery (EMF source), switch (open/closed), bulb (load).",
      "Roots, stem, leaves, flower with petals, sepals, stamen, pistil.",
      "Upper/lower epidermis, palisade, spongy mesophyll, vascular bundle, stomata.",
      "Sun → evaporation → condensation → precipitation → collection.",
    ],
  },
  numerical: {
    heading: "Numerical Problems",
    instruction: (mpq) => `Show your working. Each question carries ${mpq} mark${mpq === 1 ? "" : "s"}.`,
    q: [
      "A current of 2 A flows for 30 seconds. Calculate the charge.",
      "A resistor of 10 Ω has a potential difference of 5 V across it. Find the current.",
      "Find the energy consumed by a 60 W bulb glowing for 2 hours.",
      "If a car travels 150 km in 3 hours, what is its average speed?",
      "Convert 72 km/h to m/s.",
    ],
    ans: ["Q = I·t = 2×30 = 60 C", "I = V/R = 5/10 = 0.5 A", "E = P·t = 60×7200 = 432 kJ", "v = d/t = 150/3 = 50 km/h", "72 × (1000/3600) = 20 m/s"],
  },
  "true-false": {
    heading: "True / False",
    instruction: (mpq) => `Mark T or F. Each statement carries ${mpq} mark${mpq === 1 ? "" : "s"}.`,
    q: [
      "Sound can travel through vacuum.",
      "The Sun rises in the east.",
      "Water boils at 90°C at sea level.",
      "Plants release oxygen during photosynthesis.",
      "An ohm is a unit of current.",
    ],
    ans: ["F", "T", "F", "T", "F"],
  },
  "fill-blanks": {
    heading: "Fill in the Blanks",
    instruction: (mpq) => `Fill the blanks. Each blank carries ${mpq} mark${mpq === 1 ? "" : "s"}.`,
    q: [
      "The freezing point of water is ____ °C.",
      "The chemical formula of water is ____.",
      "The largest planet in the solar system is ____.",
      "The unit of electric charge is the ____.",
      "Plants prepare food through the process of ____.",
    ],
    ans: ["0", "H₂O", "Jupiter", "coulomb", "photosynthesis"],
  },
};

const SECTION_TITLES = ["Section A", "Section B", "Section C", "Section D", "Section E", "Section F", "Section G"];

function hashInput(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) % 2147483647;
  }
  return hash;
}

function rotate<T>(items: T[], offset: number): T[] {
  if (items.length === 0) return items;
  const normalized = ((offset % items.length) + items.length) % items.length;
  return [...items.slice(normalized), ...items.slice(0, normalized)];
}

function formatMcq(text: string): string {
  return text.replace(/\s+\(([A-D])\)\s+/g, "\n($1) ");
}

function difficultyFromInstructions(
  index: number,
  total: number,
  instructions: string
): "easy" | "moderate" | "hard" {
  const normalized = instructions.toLowerCase();
  if (normalized.includes("harder") || normalized.includes("difficult")) {
    if (index < Math.max(1, Math.floor(total * 0.3))) return "moderate";
    return "hard";
  }
  if (normalized.includes("easier") || normalized.includes("simple")) {
    if (index < Math.max(1, Math.floor(total * 0.7))) return "easy";
    return "moderate";
  }
  return pickDifficulty(index, total);
}

/**
 * Pick a difficulty for a given index roughly matching 30/50/20 distribution.
 */
function pickDifficulty(index: number, total: number): "easy" | "moderate" | "hard" {
  const ratio = index / Math.max(1, total - 1);
  if (ratio < 0.3) return "easy";
  if (ratio < 0.8) return "moderate";
  return "hard";
}

export class MockLlmAdapter implements LlmAdapter {
  readonly name = "mock";

  async generatePaper(input: GenerationInput): Promise<GenerationResult> {
    const paperA = this.generateSingle(input, "Set A");

    if (input.generateVariants) {
      const paperB = this.generateSingle(input, "Set B");
      return { paper: paperA, variantPaper: paperB };
    }

    return { paper: paperA };
  }

  private generateSingle(input: GenerationInput, variantLabel?: string): QuestionPaper {
    let qid = 0;
    let totalMarks = 0;
    const instructionSeed = hashInput(
      [
        input.subject,
        input.className,
        input.additionalInstructions,
        input.regenerationInstructions ?? "",
        variantLabel ?? "",
        new Date().toISOString(),
      ].join("|")
    );
    const revisionNote = input.regenerationInstructions?.trim();
    const lockedTextsQueue: string[] = [];
    if (revisionNote?.includes("You MUST perfectly retain")) {
      const match = revisionNote.match(/\d+\.\s+([\s\S]*?)(?=\n\d+\.\s+|$)/g);
      if (match) {
        match.forEach(m => {
          const lockedText = m.replace(/^\d+\.\s+/, "").trim();
          if (lockedText.length > 5) lockedTextsQueue.push(lockedText);
        });
      }
    }

    const sections = input.questionTypes.map((qt, sIdx) => {
      const tpl = TEMPLATES[qt.type];
      const questionPool = rotate(tpl.q, instructionSeed + sIdx);
      const sectionId = `sec-${sIdx + 1}`;
      
      const questions = Array.from({ length: qt.count }, (_, i) => {
        qid += 1;
        totalMarks += qt.marksPerQuestion;
        const rawText = questionPool[i % questionPool.length] ?? tpl.q[i % tpl.q.length];
        
        let text = qt.type === "mcq" ? formatMcq(rawText) : rawText;
        if (variantLabel === "Set B") {
          text = text.replace(/SI unit/i, "standard SI unit")
                     .replace(/SI unit of electric current/i, "SI unit of charge")
                     .replace(/SI unit/i, "derived unit")
                     .replace(/water/i, "heavy water")
                     .replace(/animal cell/i, "plant cell");
        }

        // Try to inject locked questions if any are present in the instructions
        if (lockedTextsQueue.length > 0) {
           text = lockedTextsQueue.shift()!;
        }

        return {
          id: `q${qid}`,
          text,
          difficulty: revisionNote
            ? difficultyFromInstructions(i, qt.count, revisionNote)
            : pickDifficulty(i, qt.count),
          marks: qt.marksPerQuestion,
        };
      });

      const sectionTitle = SECTION_TITLES[sIdx] ?? `Section ${sIdx + 1}`;
      return {
        id: sectionId,
        title: variantLabel ? `${sectionTitle} (${variantLabel})` : sectionTitle,
        heading: tpl.heading,
        instruction: revisionNote
          ? `${tpl.instruction(qt.marksPerQuestion)} Revision focus: ${revisionNote.split("CRITICAL INSTRUCTION")[0].trim()}`
          : tpl.instruction(qt.marksPerQuestion),
        questions,
      };
    });

    // Build the answer key in the same id order as the questions appear.
    let ansIndex = 0;
    const answerKey: { questionId: string; answer: string }[] = [];
    for (const [sIdx, qt] of input.questionTypes.entries()) {
      const tpl = TEMPLATES[qt.type];
      const answerPool = rotate(tpl.ans, instructionSeed + sIdx);
      const section = sections[sIdx]!;
      for (let i = 0; i < qt.count; i += 1) {
        const q = section.questions[i]!;
        answerKey.push({
          questionId: q.id,
          answer:
            answerPool[i % answerPool.length] ??
            tpl.ans[i % tpl.ans.length] ??
            "(model answer omitted)",
        });
        ansIndex += 1;
      }
    }
    void ansIndex;

    const totalQuestions = sections.reduce((s, x) => s + x.questions.length, 0);

    return {
      schoolName: input.schoolName,
      subject: input.subject,
      className: input.className,
      timeAllowedMinutes: Math.max(20, Math.min(180, totalQuestions * 3)),
      maximumMarks: totalMarks,
      sections,
      answerKey,
    };
  }
}
