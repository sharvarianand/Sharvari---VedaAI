import type { QuestionPaper } from "@/types/assignment";

export function exportDocx(
  paper: QuestionPaper,
  mode: "questions" | "answers" | "both",
  title: string
) {
  let content = `<div style="text-align: center; font-family: sans-serif;">`;
  content += `<h1 style="margin-bottom: 4px;">${paper.schoolName}</h1>`;
  content += `<h2 style="margin-top: 0; margin-bottom: 8px;">${paper.title}</h2>`;
  content += `<p style="margin: 4px 0;"><strong>Class:</strong> ${paper.className} | <strong>Subject:</strong> ${paper.subject}</p>`;
  content += `<p style="margin: 4px 0;"><strong>Maximum Marks:</strong> ${paper.totalMarks} | <strong>Time:</strong> ${paper.durationMinutes} mins</p>`;
  content += `</div><hr style="margin: 16px 0; border: 1px solid #000;" />`;

  if (mode === "questions" || mode === "both") {
    paper.sections.forEach((sec) => {
      content += `<h3 style="margin-top: 16px; font-family: sans-serif;">Section ${sec.name}</h3>`;
      if (sec.instructions) {
        content += `<p style="font-style: italic; font-family: sans-serif; margin-bottom: 12px;">${sec.instructions}</p>`;
      }
      sec.questions.forEach((q, i) => {
        content += `
          <table width="100%" style="font-family: sans-serif; margin-bottom: 8px;" cellpadding="0" cellspacing="0">
            <tr>
              <td valign="top" width="30"><strong>Q${i + 1}.</strong></td>
              <td valign="top">${q.text.replace(/\n/g, '<br/>')}</td>
              <td valign="top" width="80" align="right">(${q.marks} Marks)</td>
            </tr>
          </table>
        `;
      });
    });
  }

  if (mode === "both") {
    content += `<br clear="all" style="page-break-before:always" /><h2 style="text-align: center; font-family: sans-serif;">Answer Key</h2>`;
  }

  if (mode === "answers" || mode === "both") {
    paper.sections.forEach((sec) => {
      content += `<h3 style="margin-top: 16px; font-family: sans-serif;">Section ${sec.name} Answers</h3>`;
      sec.questions.forEach((q, i) => {
        content += `
          <table width="100%" style="font-family: sans-serif; margin-bottom: 8px;" cellpadding="0" cellspacing="0">
            <tr>
              <td valign="top" width="30"><strong>A${i + 1}.</strong></td>
              <td valign="top">${q.answer.replace(/\n/g, '<br/>')}</td>
            </tr>
          </table>
        `;
      });
    });
  }

  const html = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${title}</title>
      </head>
      <body>
        ${content}
      </body>
    </html>
  `;
  const blob = new Blob(["\ufeff", html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
