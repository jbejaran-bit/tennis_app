import { Setup, calculateSetup, finalCondition, isSetup } from './racquet';
export type ProSpec = {
 id:string; player:string; model:string; reportYear:number; date:string; era:string;
 condition:'strung'|'unstrung'; weight:number; balance:number; swingweight:number|null;
 evidence:string; notes:string; strings:string; tension:string; url:string;
};
/** Source snapshots reviewed 2026-10-13. Report years are not asserted equipment seasons. */
export const PRO_SPECS:ProSpec[] = [
 {id:'alcaraz-2025',player:'Carlos Alcaraz',model:'Babolat Pure Aero 98 / VS family',reportYear:2025,date:'2025-11-17',era:'Season not specified',condition:'strung',weight:330,balance:32.4,swingweight:327,evidence:'Source estimate',notes:'Approximate strung figures including overgrip. Source discusses uncertainty about the underlying VS layup. These are not a freshly measured 2026 frame.',strings:'Babolat RPM Team reported after RPM Blast 1.30',tension:'Not confirmed for this string change',url:'https://www.tennisnerd.net/gear/racquets/pro-player-racquets/carlos-alcaraz-racquet/26903'},
 {id:'federer-2018',player:'Roger Federer',model:'Wilson Pro Staff RF97 Autograph',reportYear:2018,date:'2018-01-26',era:'RF97 era · exact match year unspecified',condition:'strung',weight:366,balance:31.5,swingweight:340,evidence:'Reported match-used measurement',notes:'Uses the article’s player-specific figures, not its separate retail specification table. The author attributes them to a match-used racket in a January 2018 reply.',strings:'Natural gut / Luxilon Alu Power hybrid',tension:'Not specified for the measured frame',url:'https://www.tennisnerd.net/gear/racquets/pro-player-racquets/roger-federers-racquet-2/3065'},
 {id:'djokovic-2022',player:'Novak Djokovic',model:'HEAD PT 346.1',reportYear:2022,date:'2022-08-24',era:'Post-2018 configuration · reported in 2022',condition:'strung',weight:353,balance:32.4,swingweight:360,evidence:'Reported player specification',notes:'Player figures quoted by an author who owned a frame from his batch. The author’s own test with different strings and one fewer overgrip had different measurements; those are not used here.',strings:'Natural gut mains / Luxilon Alu Power Rough 16L crosses',tension:'27–28 kg mains / 26–27 kg crosses, depending on conditions',url:'https://www.tennisnerd.net/gear/racquets/pro-player-racquets/does-the-best-player-use-the-best-racquet/27743'},
 {id:'nadal-2026',player:'Rafael Nadal',model:'Babolat AeroPro Drive Original',reportYear:2026,date:'2026-05-21',era:'Late-career retrospective · exact season unspecified',condition:'strung',weight:340,balance:33.5,swingweight:370,evidence:'Reported approximate specification',notes:'Retrospective published in 2026, not a 2026 playing setup. Weight includes overgrip and dampener; balance is approximate. Retail Rafa Origin specifications are not substituted.',strings:'Babolat RPM Blast 1.35',tension:'Not specified in this report',url:'https://www.tennisnerd.net/gear/racquets/pro-player-racquets/rafa-nadals-racquet-player-profile/66028'},
 {id:'sinner-2026',player:'Jannik Sinner',model:'HEAD TGT 301.4',reportYear:2026,date:'2026-05-04',era:'Season not specified',condition:'unstrung',weight:302,balance:32.3,swingweight:296,evidence:'Reported specification',notes:'Source attributes these unstrung figures to a pro-stock specialist. No guessed string mass or strung swingweight is added. Accessory inclusion is not fully specified.',strings:'HEAD Hawk Touch 1.30',tension:'Around 28 kg, reported',url:'https://www.tennisnerd.net/gear/racquets/pro-player-racquets/jannik-sinners-racquet/23204'},
 {id:'sabalenka-2026',player:'Aryna Sabalenka',model:'Wilson Blade family',reportYear:2026,date:'2026-04-04',era:'Season not specified',condition:'strung',weight:324,balance:32.7,swingweight:326,evidence:'Reported specification',notes:'Article credits Tan Tennis for these figures. Its updated cosmetic discussion does not date the measurement or establish a specific Blade generation for it. Accessory inclusion is unspecified.',strings:'Luxilon Alu Power mains / Luxilon Ace crosses',tension:'Not specified in this report',url:'https://www.tennisnerd.net/gear/racquets/pro-player-racquets/aryna-sabalenkas-racquet/24697'},
];
export function compareProSpec(setup:Setup,pro:ProSpec) {
 const valid=isSetup(setup); const result=valid ? calculateSetup(setup) : null;
 const compatible=valid && finalCondition(setup)===pro.condition;
 const rows=[
  {label:'Weight',unit:'g',own:result?.weight??null,pro:pro.weight,digits:1},
  {label:'Balance from butt',unit:'cm',own:result?.balance??null,pro:pro.balance,digits:2},
  {label:'Swingweight',unit:'kg·cm²',own:result?.swingweight??null,pro:pro.swingweight,digits:1},
 ];
 return {valid,compatible,rows:rows.map(row=>({...row,delta:compatible && row.own!==null && row.pro!==null ? row.own-row.pro : null}))};
}
