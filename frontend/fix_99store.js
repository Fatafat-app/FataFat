// Script to remove orphaned old dark 99 Store section (lines 1724–2032)
// and replace with a single Grey Divider
const fs = require('fs');
const filePath = 'd:\\ftafat\\FataFat\\frontend\\app\\(tabs)\\index.tsx';

const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split(/\r?\n/);

console.log('Total lines before:', lines.length);
console.log('Line 1723:', lines[1722].trim().substring(0, 60));
console.log('Line 2033:', lines[2032].trim().substring(0, 60));
console.log('Line 2034:', lines[2033].trim().substring(0, 60));

// Keep lines 1-1723 (index 0-1722), add Grey Divider, then lines 2033+ (index 2032+)
const before = lines.slice(0, 1723); // lines 1-1723
const greyDivider = [
  '',
  '            {/* Grey Divider */}',
  '            <View style={{ height: 8, backgroundColor: \'#F3F4F6\', marginVertical: 16 }} />',
  '',
];
const after = lines.slice(2032); // lines 2033 onward

const result = [...before, ...greyDivider, ...after];
console.log('Total lines after:', result.length);
console.log('Removed', lines.length - result.length + greyDivider.length, 'lines of orphaned code');

fs.writeFileSync(filePath, result.join('\r\n'), 'utf8');
console.log('Done! File saved.');
