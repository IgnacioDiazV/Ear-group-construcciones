"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { registrarEnvioHerramientas } from "./actions";
import { parsearMensajeWhatsApp, type HerramientaItem } from "./parser";
import styles from "./inventario.module.css";

type ObraOption = { id: number; nombre: string };

export function WhatsAppImportModal({ obras }: { obras: ObraOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"input" | "preview">("input");
  const [obraId, setObraId] = useState(obras[0]?.id.toString() ?? "");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [texto, setTexto] = useState("");
  const [items, setItems] = useState<HerramientaItem[]>([]);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  function handleTextChange(value: string) {
    setTexto(value);
  }

  function irAPrevisualizar() {
    setItems(parsearMensajeWhatsApp(texto));
    setStep("preview");
  }

  function updateItem(index: number, field: keyof HerramientaItem, value: string) {
    setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: field === "cantidad" ? Math.max(1, Number(value) || 1) : value } : item));
  }

  function eliminarItem(index: number) {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function cerrarModal() {
    setOpen(false);
    setStep("input");
    setTexto("");
    setItems([]);
    setMessage("");
  }

  function submit() {
    setPending(true);
    setMessage("");
    startTransition(async () => {
      const result = await registrarEnvioHerramientas({ obra_id: Number(obraId), fecha_entrega: fecha, items });
      setPending(false);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      cerrarModal();
      router.refresh();
    });
  }

  return (
    <>
      <button className={styles.primaryButton} onClick={() => setOpen(true)} type="button">📥 Cargar desde WhatsApp</button>
      {open && <div className={styles.modalBackdrop} onClick={() => !pending && cerrarModal()} role="presentation"><div aria-labelledby="whatsapp-title" aria-modal="true" className={styles.modal} onClick={(event) => event.stopPropagation()} role="dialog">
        <div className={styles.modalHeader}><div><p className={styles.eyebrow}>Carga rápida</p><h2 id="whatsapp-title">Cargar desde WhatsApp</h2></div><button aria-label="Cerrar" className={styles.closeButton} disabled={pending} onClick={cerrarModal} type="button">×</button></div>
        {step === "input" ? <>
          <div className={styles.formGrid}><label>Obra<select value={obraId} onChange={(event) => setObraId(event.target.value)}>{obras.map((obra) => <option key={obra.id} value={obra.id}>{obra.nombre}</option>)}</select></label><label>Fecha de entrega<input onChange={(event) => setFecha(event.target.value)} type="date" value={fecha} /></label></div>
          <label className={styles.textareaLabel}>Mensaje recibido<textarea onChange={(event) => handleTextChange(event.target.value)} placeholder={'Ejemplo:\n2 amoladoras\nuna hormigonera\n3 taladros'} value={texto} /></label>
          {message && <div className={styles.error} role="alert">{message}</div>}
          <div className={styles.modalActions}><button className={styles.secondaryButton} disabled={pending} onClick={cerrarModal} type="button">Cancelar</button><button className={styles.primaryButton} disabled={!obraId || !texto.trim()} onClick={irAPrevisualizar} type="button">Previsualizar</button></div>
        </> : <>
          <p>Revisá y corregí los ítems detectados antes de guardarlos.</p>
          {items.length > 0 ? <div className={styles.importTable}><div className={styles.importHeader}><span>Cantidad</span><span>Herramienta</span></div>{items.map((item, index) => <div className={styles.importRow} key={`${index}-${item.nombre}`}><input aria-label={`Cantidad de ${item.nombre}`} min="1" onChange={(event) => updateItem(index, "cantidad", event.target.value)} type="number" value={item.cantidad} /><input aria-label={`Nombre de herramienta ${index + 1}`} onChange={(event) => updateItem(index, "nombre", event.target.value)} value={item.nombre} /><button aria-label={`Quitar ${item.nombre}`} className={styles.secondaryButton} onClick={() => eliminarItem(index)} type="button">×</button></div>)}</div> : <div className={styles.error} role="alert">No se detectaron herramientas en el texto. Volvé y corregilo.</div>}
          {message && <div className={styles.error} role="alert">{message}</div>}
          <div className={styles.modalActions}><button className={styles.secondaryButton} disabled={pending} onClick={() => setStep("input")} type="button">Volver</button><button className={styles.primaryButton} disabled={pending || items.length === 0} onClick={submit} type="button">{pending ? "Registrando..." : "Confirmar y registrar"}</button></div>
        </>}
      </div></div>}
    </>
  );
}
