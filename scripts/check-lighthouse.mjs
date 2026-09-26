import fs from 'node:fs';
const file=process.argv[2]||'qa/lighthouse-mobile.json';
if(!fs.existsSync(file)){console.error('Missing Lighthouse report. Run npm run audit:mobile first.');process.exit(1)}
const report=JSON.parse(fs.readFileSync(file,'utf8'));const score=report.categories?.performance?.score;
if(report.runtimeError||typeof score!=='number'){console.error('Invalid Lighthouse run.',report.runtimeError);process.exit(1)}
console.log(`Mobile performance: ${Math.round(score*100)}/100`);if(score<.9)process.exit(1);
