import { Setup, additionBreakdown, calculateSetup, signed } from "@/lib/baseline/racquet";
export default function CustomizationImpact({setup}: {setup:Setup}) {
  const points = additionBreakdown(setup).filter(p => p.mass !== 0);
  const result=calculateSetup(setup);
  return <section className="panel impact-panel"><div className="section-heading"><h3>Where the change comes from</h3><span className="badge">MASS DISTRIBUTION</span></div><p className="helper">Each addition’s estimated contribution. The positions are approximations measured from the butt.</p>
    {!points.length ? <p className="helper mt-4">No additions. The result matches your starting specifications.</p> : <div className="impact-list">{points.map(p => <div className="impact-row" key={p.label}><div><b>{p.label}</b><small>{p.position.toFixed(1)} cm from butt</small></div><span>{signed(p.mass)} <small>g</small></span><div className="impact-bar"><i style={{width:`${Math.min(100, Math.abs(p.sw) / Math.max(1,...points.map(a => Math.abs(a.sw))) * 100)}%`}} /></div><span>{signed(p.sw)} <small>SW</small></span></div>)}</div>}
    <div className="impact-total"><span>Total effect</span><b>{signed(result.added)} g</b><b>{signed((result.balance-setup.baseBalance)*10)} mm balance</b><b>{signed(result.swChange)} SW</b></div>
    <details className="method-note"><summary>Compare adding 1 gram at different locations</summary><div className="placement-grid">{additionBreakdown({...setup,lead12:1,lead39:1,throat:1,butt:1}).slice(0,4).map(p => <div key={p.label}><b>{p.label}</b><strong>+{p.sw.toFixed(2)} <small>SW / g</small></strong></div>)}</div><p>A head-light balance can coexist with a high swingweight. Butt-cap weight changes balance but does not undo hoop swingweight. No stiffness, power, spin or comfort rating is inferred here.</p><a href="https://twu.tennis-warehouse.com/learning_center/wtbalswt.php" target="_blank" rel="noreferrer">Weight, balance and swingweight · TWU ↗</a></details>
  </section>;
}
