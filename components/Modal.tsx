"use client";
import { useEffect, useRef, ReactNode } from "react";
import Icon from "./Icons";
export default function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const backdropPress = useRef(false);
  useEffect(() => {
    const d = ref.current;
    const origin=document.activeElement as HTMLElement|null;
    d?.showModal();
    d?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    return () => {d?.close();if(origin?.isConnected)origin.focus({preventScroll:true});};
  }, []);
  return (
    <dialog
      ref={ref}
      className="bl-modal"
      data-baseline-modal="true"
      aria-label={title}
      onCancel={onClose}
      onPointerDown={e=>{backdropPress.current=e.target===e.currentTarget;}}
      onClick={(e) => {
        if (e.target === e.currentTarget && backdropPress.current) onClose();
        backdropPress.current=false;
      }}
    >
      <div className="bl-modal-inner">
        <div className="section-heading">
          <h2>{title}</h2>
          <button
            className="icon-button"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <Icon name="close" />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
