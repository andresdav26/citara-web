// Vista previa en un canal temporal de Firebase Hosting: compila y publica en una URL aparte, sin tocar el sitio en vivo.
// Uso: npm run deploy:preview [-- <canal>] [--expires 7d]. Sin canal, usa el nombre de la rama actual.
import fs from 'node:fs';import {spawnSync} from 'node:child_process';
const config=JSON.parse(fs.readFileSync('.firebaserc','utf8'));
const targets=config.targets?.['citara-prod']?.hosting?.marketing;
if(!targets?.length||targets.includes('citara-prod')){console.error('Preview stopped: configure marketing to a SEPARATE Hosting site. Never use the existing panel site citara-prod. See README.md.');process.exit(1)}
const args=process.argv.slice(2);const at=args.indexOf('--expires');const expires=at>=0?args[at+1]:'7d';
if(!/^\d+[hd]$/.test(expires??'')){console.error('Preview stopped: --expires must look like 12h or 7d (Firebase allows up to 30d).');process.exit(1)}
const branch=spawnSync('git',['rev-parse','--abbrev-ref','HEAD'],{encoding:'utf8'}).stdout?.trim();
const raw=args.find((a,i)=>!a.startsWith('--')&&args[i-1]!=='--expires')??branch??'';
const channel=raw.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,40).replace(/-+$/,'');
if(!channel||channel==='live'||channel==='head'){console.error(`Preview stopped: "${raw}" is not a usable channel name. Pass one: npm run deploy:preview -- my-channel`);process.exit(1)}
console.log(`Building and deploying the preview channel "${channel}" (expires in ${expires}) on the marketing site.`);
const build=spawnSync('npm',['run','build'],{stdio:'inherit'});if(build.status!==0)process.exit(build.status??1);
const result=spawnSync('firebase',['hosting:channel:deploy',channel,'--only','marketing','--expires',expires,'--project','citara-prod'],{stdio:'inherit'});process.exit(result.status??1);
