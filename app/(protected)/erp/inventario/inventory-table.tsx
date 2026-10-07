"use client";

import { startTransition, useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { registrarDevolucion, transferirHerramienta, editarAsignacionHerramienta } from "./actions";
import styles from "./inventario.module.css";

type HerramientaActiva = { id: number; obra_id: number; descripcion_libre: string; cantidad: number; cantidad_devuelta: number; fecha_entrega: string; obra_nombre: string; tipo_item: 'herramienta' | 'material' };
type ObraOption = { id: number; nombre: string };
type FilterType = "all" | "herramientas" | "materiales";

const PAGE_SIZE = 10;

export function InventoryTable({ items, obras }: { items: HerramientaActiva[]; obras: ObraOption[] }) {
  const router = useRouter();
  const [selectedObraId, setSelectedObraId] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [transferItem, setTransferItem] = useState<HerramientaActiva | null>(null);
  const [transferDestino, setTransferDestino] = useState("");
  const [transferCantidad, setTransferCantidad] = useState(1);
  const [editItem, setEditItem] = useState<HerramientaActiva | null>(null);
  const [editDescripcion, setEditDescripcion] = useState("");
  const [editCantidad, setEditCantidad] = useState(1);
  const [editObraId, setEditObraId] = useState("");
  const [editTipoItem, setEditTipoItem] = useState<'herramienta' | 'material'>("herramienta");

  // Resetea página cuando cambian filtros para evitar IndexOutOfBounds
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [selectedObraId, filterType, searchQuery]);

  const filteredItems = useMemo(() => {
    let result = selectedObraId === "all"
      ? items
      : items.filter((item) => item.obra_id === Number(selectedObraId));

    if (filterType !== "all") {
      const tipoFilter = filterType === "herramientas" ? "herramienta" : "material";
      result = result.filter((item) => item.tipo_item === tipoFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((item) =>
        item.descripcion_libre.toLowerCase().includes(query) ||
        item.obra_nombre.toLowerCase().includes(query)
      );
    }

    return result;
  }, [items, selectedObraId, filterType, searchQuery]);

  const totalPages = Math.ceil(filteredItems.length / PAGE_SIZE) || 1;
  const itemsPaginados = filteredItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const desde = filteredItems.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const hasta = Math.min(currentPage * PAGE_SIZE, filteredItems.length);

  function returnTool(item: HerramientaActiva) {
    const pendiente = item.cantidad - item.cantidad_devuelta;
    const quantity = Number(window.prompt(`Cantidad a devolver (máximo ${pendiente})`, String(pendiente)));
    if (!Number.isFinite(quantity) || quantity <= 0) return;
    setPendingId(item.id);
    setError("");
    startTransition(async () => {
      const result = await registrarDevolucion(item.id, quantity, item.cantidad, item.cantidad_devuelta);
      setPendingId(null);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function openTransferModal(item: HerramientaActiva) {
    setTransferItem(item);
    setTransferDestino("");
    setTransferCantidad(1);
    setError("");
  }

  function confirmarTransferencia() {
    if (!transferItem || !transferDestino || transferCantidad < 1) return;
    const destinoObraId = Number(transferDestino);
    const cantidadPendiente = transferItem.cantidad - transferItem.cantidad_devuelta;
    if (transferCantidad > cantidadPendiente) return;
    setPendingId(transferItem.id);
    setError("");
    startTransition(async () => {
      const result = await transferirHerramienta(transferItem.id, destinoObraId, null, transferCantidad);
      setPendingId(null);
      if (result.error) {
        setError(result.error);
        return;
      }
      setTransferItem(null);
      router.refresh();
    });
  }

  function openEditModal(item: HerramientaActiva) {
    setEditItem(item);
    setEditDescripcion(item.descripcion_libre);
    setEditCantidad(item.cantidad);
    setEditObraId(String(item.obra_id));
    setEditTipoItem(item.tipo_item);
    setError("");
  }

  function confirmarEdicion() {
    if (!editItem || !editDescripcion.trim() || editCantidad <= 0 || !editObraId) return;
    setPendingId(editItem.id);
    setError("");
    startTransition(async () => {
      const result = await editarAsignacionHerramienta(editItem.id, {
        descripcion_libre: editDescripcion,
        cantidad: editCantidad,
        obra_id: Number(editObraId),
        tipo_item: editTipoItem,
      });
      setPendingId(null);
      if (result.error) {
        setError(result.error);
        return;
      }
      setEditItem(null);
      router.refresh();
    });
  }

  const typeFilters: { key: FilterType; label: string; count: number }[] = [
    {
      key: "all",
      label: "Todos",
      count: items.filter((item) => selectedObraId === "all" || item.obra_id === Number(selectedObraId)).length,
    },
    {
      key: "herramientas",
      label: "Herramientas",
      count: items
        .filter((item) => (selectedObraId === "all" || item.obra_id === Number(selectedObraId)) && item.tipo_item === "herramienta")
        .length,
    },
    {
      key: "materiales",
      label: "Materiales",
      count: items
        .filter((item) => (selectedObraId === "all" || item.obra_id === Number(selectedObraId)) && item.tipo_item === "material")
        .length,
    },
  ];

  if (items.length === 0) return <div className={styles.empty}>No hay herramientas activas asignadas a obras.</div>;

  return <div className={styles.tableWrapper}>
    <div className={styles.integratedToolbar}>
      <div className={styles.searchBarContainer}>
        <input
          className={styles.searchInput}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Buscar por nombre de herramienta u obra..."
          type="text"
          value={searchQuery}
        />
        <span className={styles.searchIcon}>🔍</span>
      </div>

      <div className={styles.filterControls}>
        <div className={styles.typeFilters}>
          {typeFilters.map((filter) => (
            <button
              key={filter.key}
              className={`${styles.typeFilterButton} ${filterType === filter.key ? styles.typeFilterButtonActive : ""}`}
              onClick={() => setFilterType(filter.key)}
              type="button"
            >
              {filter.label}
              <span className={styles.typeFilterBadge}>{filter.count}</span>
            </button>
          ))}
        </div>

        <label className={styles.filterLabel} htmlFor="obra-filter">Filtrar por obra
          <select className={styles.filterSelect} id="obra-filter" onChange={(event) => setSelectedObraId(event.target.value)} value={selectedObraId}>
            <option value="all">Todas las obras</option>
            {obras.map((obra) => <option key={obra.id} value={obra.id}>{obra.nombre}</option>)}
          </select>
        </label>
      </div>
    </div>

    <p className={styles.tableCount}>{filteredItems.length} {selectedObraId === "all" ? "asignaciones pendientes de devolución" : "asignaciones en esta obra"}.</p>
    {error && <div className={styles.error} role="alert">{error}</div>}
    {filteredItems.length === 0 ? <div className={styles.empty}>No hay herramientas activas para los filtros seleccionados.</div> : <>
      <table className={styles.table}><thead><tr><th>Herramienta</th><th>Obra destino</th><th>Saldo pendiente</th><th>Fecha de envío</th><th>Acción</th></tr></thead><tbody>{itemsPaginados.map((item) => <tr key={item.id}><td><span className={styles.itemBadge} data-type={item.tipo_item}>{item.tipo_item === "herramienta" ? "Herramienta" : "Material"}</span> {item.descripcion_libre}</td><td>{item.obra_nombre}</td><td>{item.cantidad - item.cantidad_devuelta} de {item.cantidad}</td><td>{item.fecha_entrega}</td><td><div className={styles.actionsContainer}>
        <button aria-label="Marcar devuelto" className={styles.iconButton} disabled={pendingId === item.id} onClick={() => returnTool(item)} title="Marcar Devuelto" type="button">✓</button>
        <button aria-label="Transferir" className={styles.iconButton} disabled={pendingId === item.id} onClick={() => openTransferModal(item)} title="Transferir" type="button">⭾</button>
        <button aria-label="Editar" className={styles.iconButton} disabled={pendingId === item.id} onClick={() => openEditModal(item)} title="Editar" type="button">✎</button>
      </div></td></tr>)}</tbody></table>

      {/* Pie de página con paginador */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid #d3cec9', padding: '12px 16px' }} className="sm:flex-row sm:items-center sm:justify-between">
        <div style={{ fontSize: '12px', color: '#8b7a73' }}>
          Mostrando {desde} a {hasta} de {filteredItems.length} artículos
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="bg-[#2B1810] text-white hover:bg-[#3D2318] rounded-lg px-3.5 py-1.5 text-xs font-semibold shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition"
            type="button"
          >
            Anterior
          </button>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#4a3f3a' }}>
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="bg-[#2B1810] text-white hover:bg-[#3D2318] rounded-lg px-3.5 py-1.5 text-xs font-semibold shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition"
            type="button"
          >
            Siguiente
          </button>
        </div>
      </div>
    </>}
    {transferItem && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setTransferItem(null)} role="presentation">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150" onClick={(event) => event.stopPropagation()} role="dialog">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#8D6E63]">Transferencia</p>
          <h2 className="text-xl font-bold text-neutral-800">Transferir &quot;{transferItem.descripcion_libre}&quot;</h2>
        </div>
        <label className="block">
          <span className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">Destino</span>
          <select className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm text-neutral-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#3E2723]" onChange={(event) => setTransferDestino(event.target.value)} value={transferDestino}>
            <option value="">Seleccioná un destino</option>
            {obras.filter((obra) => obra.id !== transferItem.obra_id).map((obra) => <option key={obra.id} value={String(obra.id)}>{obra.nombre}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">Cantidad a Transferir</span>
          <input 
            type="number" 
            min="1" 
            max={transferItem.cantidad - transferItem.cantidad_devuelta}
            value={transferCantidad}
            onChange={(event) => setTransferCantidad(Math.max(1, Math.min(Number(event.target.value) || 1, transferItem.cantidad - transferItem.cantidad_devuelta)))}
            className="w-full border rounded-lg px-3 py-2 text-sm text-neutral-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#3E2723]"
            style={{ borderColor: "#e7e0db" }}
          />
          <p className="text-xs text-neutral-500 mt-1">Disponible para transferir: {transferItem.cantidad - transferItem.cantidad_devuelta} unidades</p>
        </label>
        <div className="flex justify-end gap-3 pt-2">
          <button className="border border-neutral-300 text-neutral-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-50 transition" onClick={() => setTransferItem(null)} type="button">Cancelar</button>
          <button className="bg-[#3E2723] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2C1B17] transition disabled:opacity-50" disabled={!transferDestino || transferCantidad < 1 || transferCantidad > (transferItem.cantidad - transferItem.cantidad_devuelta) || pendingId === transferItem.id} onClick={confirmarTransferencia} type="button">{pendingId === transferItem.id ? "Transfiriendo..." : "Confirmar"}</button>
        </div>
      </div>
    </div>}
    {editItem && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setEditItem(null)} role="presentation">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150" onClick={(event) => event.stopPropagation()} role="dialog">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#8D6E63]">Edición</p>
          <h2 className="text-xl font-bold text-neutral-800">Editar herramienta</h2>
        </div>
        <label className="block">
          <span className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">Nombre / concepto</span>
          <input className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm text-neutral-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#3E2723]" onChange={(event) => setEditDescripcion(event.target.value)} value={editDescripcion} />
        </label>
        <label className="block">
          <span className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">Tipo de ítem</span>
          <select className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm text-neutral-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#3E2723]" onChange={(event) => setEditTipoItem(event.target.value as 'herramienta' | 'material')} value={editTipoItem}>
            <option value="herramienta">Herramienta</option>
            <option value="material">Material/Consumible</option>
          </select>
        </label>
        <label className="block">
          <span className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">Cantidad</span>
          <input className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm text-neutral-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#3E2723]" min="1" onChange={(event) => setEditCantidad(Math.max(1, Number(event.target.value) || 1))} type="number" value={editCantidad} />
        </label>
        <label className="block">
          <span className="block text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-1">Obra asignada</span>
          <select className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm text-neutral-800 bg-white focus:outline-none focus:ring-2 focus:ring-[#3E2723]" onChange={(event) => setEditObraId(event.target.value)} value={editObraId}>
            {obras.map((obra) => <option key={obra.id} value={obra.id}>{obra.nombre}</option>)}
          </select>
        </label>
        <div className="flex justify-end gap-3 pt-2">
          <button className="border border-neutral-300 text-neutral-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-50 transition" onClick={() => setEditItem(null)} type="button">Cancelar</button>
          <button className="bg-[#3E2723] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2C1B17] transition disabled:opacity-50" disabled={!editDescripcion.trim() || editCantidad <= 0 || pendingId === editItem.id} onClick={confirmarEdicion} type="button">{pendingId === editItem.id ? "Guardando..." : "Guardar cambios"}</button>
        </div>
      </div>
    </div>}
  </div>;
}
