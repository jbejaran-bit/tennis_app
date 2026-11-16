import { Match, PracticeSession, isMatch, isPracticeSession } from './data';
import { Setup, RacketTrial, isSetup, validRacketTrials, validMatchDayChoice, finalCondition } from './racquet';
import { SessionPlan, SESSION_PLAN_KEY, isSessionPlan } from './session-plan';
import { mergeById, readStored } from './storage';

export type Backup = { version: 2 | 3; matches: Match[]; practice: PracticeSession[]; setups: Setup[]; racketTrials?: RacketTrial[]; sessionPlan?: SessionPlan; matchDaySetupId?: string };
const matches = (v: unknown): v is Match[] => Array.isArray(v) && v.every(isMatch);
const practice = (v: unknown): v is PracticeSession[] => Array.isArray(v) && v.every(isPracticeSession);
const setups = (v: unknown): v is Setup[] => Array.isArray(v) && v.every(isSetup);
export function parseBackup(text: string): Backup {
  const d = JSON.parse(text);
  if (!d || ![2,3].includes(d.version) || !matches(d.matches) || !practice(d.practice) || !setups(d.setups) ||
    (d.version === 3 && !validRacketTrials(d.racketTrials)) ||
    (d.sessionPlan !== undefined && !isSessionPlan(d.sessionPlan)) ||
    (d.matchDaySetupId !== undefined && !validMatchDayChoice(d.matchDaySetupId))) throw new Error('Invalid backup');
  return d;
}
export function prepareBackup(storage: Pick<Storage,'getItem'>, backup: Backup) {
  const rows: { key: string; label: string; value: unknown; added: number; kept: number }[] = [];
  function merge<T extends {id:string}>(key: string, label: string, incoming: T[], validate: (v: unknown)=>v is T[]) {
    const current = readStored(storage,key,[],validate);
    const value = mergeById(current,incoming);
    const added = value.length-current.length;
    rows.push({key,label,value,added,kept:incoming.length-added});
    return value;
  }
  merge('baseline_matches','Matches',backup.matches,matches);
  merge('baseline_practice_v2','Practice sessions',backup.practice,practice);
  const frames=merge('baseline_setups_v2','Racket setups',backup.setups,setups);
  if(backup.version===3) merge('baseline_racket_trials_v1','Court tests',backup.racketTrials!,validRacketTrials);
  const currentPlan=readStored(storage,SESSION_PLAN_KEY,[],isSessionPlan);
  const planAdded=!currentPlan.length && !!backup.sessionPlan?.length;
  if(planAdded) rows.push({key:SESSION_PLAN_KEY,label:'Court plan',value:backup.sessionPlan,added:1,kept:0});
  const currentChoice=readStored(storage,'baseline_match_day_v1','',validMatchDayChoice);
  if(!currentChoice && backup.matchDaySetupId && frames.some(s=>s.id===backup.matchDaySetupId && !s.archived && finalCondition(s)==='strung')) {
    rows.push({key:'baseline_match_day_v1',label:'Match-day choice',value:backup.matchDaySetupId,added:1,kept:0});
  }
  return {rows, planKept:!!currentPlan.length && !!backup.sessionPlan?.length};
}
/** Prepare all sections before writing. Roll back completed writes if storage rejects one. */
export function applyBackup(storage: Pick<Storage,'getItem'|'setItem'|'removeItem'>, backup: Backup): string[] {
  const {rows}=prepareBackup(storage,backup);
  const writes=rows.map(r=>({key:r.key,before:storage.getItem(r.key),after:JSON.stringify(r.value)})).filter(r=>r.before!==r.after);
  const completed: typeof writes=[];
  try {
    for(const row of writes) { storage.setItem(row.key,row.after); completed.push(row); }
  } catch {
    let restored=true;
    for(const row of completed.reverse()) {
      try { if(row.before===null)storage.removeItem(row.key);else storage.setItem(row.key,row.before); } catch {restored=false;}
    }
    throw new Error(restored ? 'Import could not be saved. Your previous records were restored. Free some device storage and try again.' : 'Import stopped and some records may have been added. Keep your original backup and export the current records before retrying.');
  }
  return writes.map(r=>r.key);
}
