import fs from 'node:fs';import {spawnSync} from 'node:child_process';
const config=JSON.parse(fs.readFileSync('.firebaserc','utf8'));
const targets=config.targets?.['citara-prod']?.hosting?.marketing;
if(!targets?.length||targets.includes('citara-prod')){console.error('Deployment stopped: configure marketing to a SEPARATE Hosting site. Never use the existing panel site citara-prod. See README.md.');process.exit(1)}
const result=spawnSync('firebase',['deploy','--only','hosting:marketing','--project','citara-prod'],{stdio:'inherit'});process.exit(result.status??1);
