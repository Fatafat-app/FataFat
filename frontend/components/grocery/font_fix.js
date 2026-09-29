const fs = require('fs');
const path = require('path');
const dir = 'd:/ftafat/FataFat/frontend/components/grocery';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Add import if not exists
  if (!content.includes('BOLD_FONT') && content.includes('fontWeight')) {
    if (content.includes('import { GColors')) {
      content = content.replace(
        /import \{ GColors/g, 
        "import { BOLD_FONT, STYLISH_FONT } from '../../constants/Theme';\nimport { GColors"
      );
    } else {
      content = "import { BOLD_FONT, STYLISH_FONT } from '../../constants/Theme';\n" + content;
    }
  }
  
  // Replace fontWeight with fontFamily: BOLD_FONT for heavy weights
  content = content.replace(/fontWeight:\s*['"](700|800|900|bold)['"]/g, 'fontFamily: BOLD_FONT');
  // Replace fontWeight with fontFamily: STYLISH_FONT for medium/regular
  content = content.replace(/fontWeight:\s*['"](500|600|normal)['"]/g, 'fontFamily: STYLISH_FONT');
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated ' + file);
}
