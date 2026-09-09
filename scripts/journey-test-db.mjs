import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';

// Test-only SQLite adapter. Production uses a D1 binding, never this filesystem.
export function testDatabase() {
  const sqlite=new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../migrations/journeys/0001_visitor_paths.sql',import.meta.url),'utf8'));
  sqlite.exec(readFileSync(new URL('../migrations/journeys/0002_capacity_guards.sql',import.meta.url),'utf8'));
  const prepare=sql=>{
    let params=[];
    return {
      bind(...args){params=args;return this;},
      async first(){return sqlite.prepare(sql).get(...params)||null;},
      async all(){return {success:true,results:sqlite.prepare(sql).all(...params)};},
      async run(){return {success:true,meta:sqlite.prepare(sql).run(...params)};},
    };
  };
  return {sqlite,prepare,async batch(statements){
    sqlite.exec('BEGIN');
    try{const result=[];for(const statement of statements)result.push(await statement.run());sqlite.exec('COMMIT');return result;}
    catch(e){sqlite.exec('ROLLBACK');throw e;}
  }};
}

// Explicit TEST fixtures. Never usable as production backup verification.
export function testJourneyGuards(db, now=Date.now()) {
  db.sqlite.prepare('UPDATE journey_capacity SET archive_verified_at=?, storage_checked_at=? WHERE id=1').run(now,now);
  return {JOURNEY_RATE:{async limit(){return {success:true};}},
    JOURNEY_GLOBAL_RATE:{async limit(){return {success:true};}},
    JOURNEY_ARCHIVE:{async put(){throw new Error('Test fixture is not an archive');}}};
}
