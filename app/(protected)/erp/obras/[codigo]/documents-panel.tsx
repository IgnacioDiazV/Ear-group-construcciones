"use client";

import Image from "next/image";
import { type DragEvent, startTransition, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { createDocumentoObra, deleteDocumentoObra, type DocumentActionState } from "./actions";
import styles from "./obra-detalle.module.css";
import type { Database } from "@/lib/supabase/database.types";

type Documento = Database["public"]["Tables"]["documentos_obra"]["Row"];
const BUCKET = "obras-archivos";
const initialState: DocumentActionState = {};
const allowedTypes = ["image/png", "image/jpeg", "image/webp", "application/pdf"];

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function storagePathFromUrl(url: string) {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const index = url.indexOf(marker);
  return index >= 0 ? decodeURIComponent(url.slice(index + marker.length)) : "";
}

function sanitizeFolderName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "obra";
}

export function DocumentsPanel({ obraId, obraNombre, documents }: { obraId: number; obraNombre: string; documents: Documento[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [createState, setCreateState] = useState<DocumentActionState>(initialState);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setDragging] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isUploading, setUploading] = useState(false);

  function selectFile(file: File | undefined) {
    if (!file) return;
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Sólo se permiten imágenes PNG, JPG, WebP o archivos PDF.");
      return;
    }
    setUploadError("");
    setSelectedFile(file);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    selectFile(event.dataTransfer.files[0]);
  }

  async function uploadFile() {
    if (!selectedFile) return;
    setUploading(true);
    setUploadError("");
    const supabase = createSupabaseBrowserClient();
    const safeName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const folderName = sanitizeFolderName(obraNombre);
    const path = `${folderName}/${crypto.randomUUID()}-${safeName}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, selectedFile, { upsert: false });

    if (error) {
      setUploadError(`No se pudo subir el archivo: ${error.message}`);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const formData = new FormData();
    formData.set("obra_id", String(obraId));
    formData.set("titulo", selectedFile.name);
    formData.set("tipo", selectedFile.type === "application/pdf" ? "PDF" : "RENDER");
    formData.set("archivo_url", data.publicUrl);
    startTransition(async () => {
      const result = await createDocumentoObra(createState, formData);
      setCreateState(result);
      setUploading(false);
      if (result.error) {
        setUploadError(result.error);
        return;
      }

      setSelectedFile(null);
      router.refresh();
    });
  }

  async function downloadDocument(document: Documento) {
    const storagePath = storagePathFromUrl(document.archivo_url);
    if (!storagePath) {
      setDeleteError("No se pudo identificar la ruta del archivo para descargarlo.");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.storage.from(BUCKET).download(storagePath);
    if (error) {
      setDeleteError(`No se pudo descargar el archivo: ${error.message}`);
      return;
    }

    const objectUrl = URL.createObjectURL(data);
    const anchor = window.document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = document.titulo;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  }

  async function removeDocument(document: Documento) {
    if (!window.confirm(`¿Eliminar ${document.titulo}?`)) return;
    const formData = new FormData();
    formData.set("obra_id", String(obraId));
    formData.set("documento_id", String(document.id));
    formData.set("storage_path", storagePathFromUrl(document.archivo_url));
    setDeleteError("");
    setDeletingId(document.id);
    startTransition(async () => {
      const result = await deleteDocumentoObra(formData);
      setDeletingId(null);
      if (result.error) {
        setDeleteError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <section>
      <div className={styles.documentToolbar}>
        <div className={styles.tabs}><span className={`${styles.tab} ${styles.tabActive}`}>Planos y renders ({documents.length})</span></div>
      </div>
      <input accept="image/png,image/jpeg,image/webp,application/pdf" className={styles.hiddenInput} onChange={(event) => selectFile(event.target.files?.[0])} ref={inputRef} type="file" />
      <div
        className={`${styles.dropzone} ${isDragging ? styles.dropzoneActive : ""}`}
        onClick={() => !selectedFile && inputRef.current?.click()}
        onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
        onKeyDown={(event) => { if ((event.key === "Enter" || event.key === " ") && !selectedFile) inputRef.current?.click(); }}
        role="button"
        tabIndex={0}
      >
        {!selectedFile ? <><strong className={styles.dropzoneTitle}>Arrastrá planos o renders aquí, o hacé clic para explorar</strong><span className={styles.dropzoneHint}>Formatos admitidos: PNG, JPG, WebP o PDF</span></> : <div className={styles.selectedFile} onClick={(event) => event.stopPropagation()}>
          <div className={styles.fileIcon}>{selectedFile.type === "application/pdf" ? "PDF" : "IMG"}</div>
          <div className={styles.fileDetails}><strong>{selectedFile.name}</strong><span>{formatFileSize(selectedFile.size)}</span></div>
          <div className={styles.fileActions}><button className={styles.uploadButton} disabled={isUploading} onClick={uploadFile} type="button">{isUploading ? "Cargando..." : "Confirmar carga"}</button><button className={styles.cancelButton} disabled={isUploading} onClick={() => { setSelectedFile(null); setUploadError(""); }} type="button">Cancelar</button></div>
        </div>}
      </div>
      {(uploadError || createState.error || deleteError) && <div className={styles.error} role="alert">{uploadError || createState.error || deleteError}</div>}
      {createState.success && <div className={styles.success} role="status">{createState.success}</div>}
      {documents.length === 0 ? <div className={styles.empty}>No hay planos o renders vinculados a esta obra.</div> : <div className={styles.documentGrid}>{documents.map((document) => { const isPdf = document.tipo.toLowerCase() === "pdf" || document.archivo_url.toLowerCase().endsWith(".pdf"); return <article className={styles.documentCard} key={document.id}><a href={document.archivo_url} rel="noreferrer" target="_blank">{isPdf ? <div className={styles.pdfPreview}>PDF</div> : <Image alt={document.titulo} className={styles.documentPreview} height={130} sizes="(max-width: 620px) 100vw, (max-width: 1000px) 50vw, 33vw" src={document.archivo_url} width={240} />}</a><div className={styles.documentInfo}><p>{document.titulo}</p><div className={styles.documentActions}><a aria-label="Ver documento" className={styles.documentAction} href={document.archivo_url} rel="noopener noreferrer" target="_blank" title="Ver documento"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" /><circle cx="12" cy="12" r="2.5" /></svg></a><button aria-label="Descargar archivo" className={styles.documentAction} onClick={() => downloadDocument(document)} title="Descargar archivo" type="button"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 3v12m0 0 4-4m-4 4-4-4M4 20h16" /></svg></button><button aria-label="Eliminar archivo" className={`${styles.documentAction} ${styles.documentDeleteAction}`} disabled={deletingId === document.id} onClick={() => removeDocument(document)} title="Eliminar archivo" type="button"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="m6 6 12 12M18 6 6 18" /></svg></button></div></div></article>; })}</div>}
    </section>
  );
}
