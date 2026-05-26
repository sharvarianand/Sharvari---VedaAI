import { extractMaterialText, isMaterialTextUsable } from './src/services/material-service';
(async () => {
  const text = await extractMaterialText({
    storedPath: '/home/sharvarianand/Downloads/Sharvari-VedaAI /backend/uploads/4rv1wic3jirx/jemh1a1.pdf',
    mime: 'application/pdf'
  });
  console.log('Result usable?', isMaterialTextUsable(text));
  console.log('Result length:', text?.length);
})();
