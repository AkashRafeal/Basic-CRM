const fs = require('fs');
const path = require('path');

function findModals(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(findModals(fullPath));
    } else if (file.endsWith('.tsx') && !file.endsWith('ModalPortal.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('fixed inset-0')) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

const modalFiles = findModals('d:/Basic CRM/frontend/src/components');
console.log('Processing modal files:', modalFiles.length);

let updatedCount = 0;
for (const file of modalFiles) {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('ModalPortal') || content.includes('createPortal')) {
    continue;
  }

  const fileDir = path.dirname(file);
  let modalPortalPath = path.relative(fileDir, 'd:/Basic CRM/frontend/src/components/ModalPortal').replace(/\\/g, '/');
  if (!modalPortalPath.startsWith('.')) {
    modalPortalPath = './' + modalPortalPath;
  }
  const importStatement = `import { ModalPortal } from '${modalPortalPath}';\n`;

  // Prepend import
  content = importStatement + content;

  // Find the return statement for the modal
  const returnIdx = content.lastIndexOf('return (');
  if (returnIdx !== -1) {
    const beforeReturn = content.substring(0, returnIdx);
    const returnRest = content.substring(returnIdx);

    const replacedRest = returnRest.replace(/return \(\s*<div className=(["'`])fixed inset-0/m, 'return (\n    <ModalPortal>\n      <div className=$1fixed inset-0');
    const lastDivIdx = replacedRest.lastIndexOf('</div>\n  );');
    if (lastDivIdx !== -1) {
      const finalRest = replacedRest.substring(0, lastDivIdx) + '</div>\n    </ModalPortal>\n  );' + replacedRest.substring(lastDivIdx + '</div>\n  );'.length);
      content = beforeReturn + finalRest;
      fs.writeFileSync(file, content, 'utf8');
      updatedCount++;
      console.log('Updated:', path.basename(file));
    } else {
      // try with \r\n
      const lastDivCRLF = replacedRest.lastIndexOf('</div>\r\n  );');
      if (lastDivCRLF !== -1) {
        const finalRest = replacedRest.substring(0, lastDivCRLF) + '</div>\r\n    </ModalPortal>\r\n  );' + replacedRest.substring(lastDivCRLF + '</div>\r\n  );'.length);
        content = beforeReturn + finalRest;
        fs.writeFileSync(file, content, 'utf8');
        updatedCount++;
        console.log('Updated (CRLF):', path.basename(file));
      } else {
        console.log('Could not find closing div for:', path.basename(file));
      }
    }
  }
}
console.log('Successfully updated:', updatedCount, 'modals with ModalPortal');
