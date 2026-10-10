"use client";
export default function WorkspaceError({reset}: {reset: () => void}) {
  return <main style={{maxWidth:600,margin:'12vh auto',padding:32,fontFamily:'Arial, sans-serif'}}><h1>The workspace could not open.</h1><p>Your saved browser data has not been cleared. Try opening the workspace again.</p><button onClick={reset} style={{padding:'12px 20px',cursor:'pointer'}}>Try again</button><p><a href="/">Back to home</a></p></main>;
}
