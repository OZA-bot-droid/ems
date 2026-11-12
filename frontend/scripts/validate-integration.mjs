#!/usr/bin/env node
/** Check migrated static relative imports and flag Member Fetch/Axios mismatches. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const src=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../src');
const JS=/\.(js|jsx|mjs)$/;
function walk(root){return fs.readdirSync(root,{withFileTypes:true}).flatMap(x=>x.isDirectory()?walk(path.join(root,x.name)):[path.join(root,x.name)]);}
const files=walk(src).filter(f=>JS.test(f));
const errors=[], warnings=[];
for(const file of files){
  const content=fs.readFileSync(file,'utf8');
  const pattern=/(?:\b(?:import|export)\s+(?:[^'";]*?\s+from\s*)?)(['"])([^'"\n]+)\1/g;
  for(const match of content.matchAll(pattern)){
    const spec=match[2];if(!spec.startsWith('.'))continue;
    const p=path.resolve(path.dirname(file),spec);
    if(!['','.js','.jsx','.css','.scss','/index.js','/index.jsx'].some(s=>fs.existsSync(p+s))) errors.push(`${path.relative(src,file)} imports missing ${spec}`);
  }
  if (/import\s*\{\s*useAuth\s*\}\s*from\s*['"][^'"]*context\/AuthContext(?:\.jsx)?['"]/.test(content)) errors.push(`${path.relative(src,file)} imports useAuth from AuthContext instead of hooks/useAuth`);
  if(file.includes('/features/member/') && /\b(?:res|response)\.json\(\)|\b(?:res|response)\.ok\b/.test(content)) warnings.push(`${path.relative(src,file)} still uses Fetch-only response API`);
  if(file.includes('/features/member/') && /http:\/\/localhost:8080/.test(content)) warnings.push(`${path.relative(src,file)} hardcodes localhost:8080`);
}
console.log(`Checked ${files.length} JS/JSX modules`);
for(const msg of warnings)console.log('WARN:',msg);
for(const msg of errors)console.error('ERROR:',msg);
if(errors.length)process.exitCode=1;
else console.log(`PASS: relative imports resolve (${warnings.length} warnings)`);
