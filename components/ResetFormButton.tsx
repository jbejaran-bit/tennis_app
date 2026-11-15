"use client";
import {useRef,useState} from 'react';
/** Restore form defaults only after a local confirmation; never submits a record. */
export default function ResetFormButton(){
 const [confirm,setConfirm]=useState(false);const form=useRef<HTMLFormElement|null>(null);
 return confirm ? <span className="reset-confirm"><span>Discard these unsaved form edits?</span><button type="button" className="button" onClick={()=>{form.current?.reset();setConfirm(false);}}>Yes, reset form</button><button type="button" className="text-button" onClick={()=>setConfirm(false)}>Keep editing</button></span> : <button type="button" className="button" onClick={e=>{form.current=e.currentTarget.closest('form');setConfirm(true);}}>Reset form</button>;
}
