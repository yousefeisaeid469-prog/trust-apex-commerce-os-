import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import pg from 'pg';
const {Pool}=pg;
const root=process.cwd();
const dir=path.join(root,'db','migrations');
const files=(await fs.readdir(dir)).filter(f=>/^\d{3}_.+\.sql$/.test(f)).sort();
if(!files.length)throw new Error('No canonical migrations found');
const nums=files.map(f=>Number(f.slice(0,3))); const unique=new Set(nums); if(unique.size!==nums.length)throw new Error('Duplicate migration numbers detected');
if(nums.some((n,i)=>n!==i+1))throw new Error(`Migration sequence must be contiguous from 001; got ${nums.join(',')}`);
if(!process.env.DATABASE_URL)throw new Error('DATABASE_NOT_CONFIGURED');
const pool=new Pool({connectionString:process.env.DATABASE_URL,max:5});
const client=await pool.connect();
try{
 await client.query('begin');
 await client.query(`create table if not exists trust_schema_migrations(id text primary key, checksum text not null, applied_at timestamptz not null default now())`);
 for(const file of files){const sql=await fs.readFile(path.join(dir,file),'utf8');const checksum=crypto.createHash('sha256').update(sql).digest('hex');const existing=await client.query('select checksum from trust_schema_migrations where id=$1',[file]);if(existing.rows[0]){if(existing.rows[0].checksum!==checksum)throw new Error(`MIGRATION_CHECKSUM_MISMATCH:${file}`);continue;}await client.query(sql);await client.query('insert into trust_schema_migrations(id,checksum) values($1,$2)',[file,checksum]);console.log(`applied ${file}`);}
 await client.query('commit');
} catch(e){await client.query('rollback');throw e;} finally {client.release();await pool.end();}
