export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      adelantos_sueldos: {
        Row: {
          descontado_en_quincena: string | null
          empleado_id: number
          estado: string | null
          fecha: string
          id: number
          monto: number
          obra_id: number | null
        }
        Insert: {
          descontado_en_quincena?: string | null
          empleado_id: number
          estado?: string | null
          fecha?: string
          id?: number
          monto: number
          obra_id?: number | null
        }
        Update: {
          descontado_en_quincena?: string | null
          empleado_id?: number
          estado?: string | null
          fecha?: string
          id?: number
          monto?: number
          obra_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "adelantos_sueldos_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "empleados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adelantos_sueldos_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      anticipos_clientes: {
        Row: {
          created_at: string | null
          descripcion: string
          estado: string | null
          fecha_cobro_real: string | null
          fecha_emision: string
          fecha_estimada_cobro: string | null
          id: number
          metodo_pago: string
          moneda: string | null
          monto: number
          numero_cuota: number | null
          obra_id: number
          tipo_cambio: number | null
          total_cuotas: number | null
        }
        Insert: {
          created_at?: string | null
          descripcion: string
          estado?: string | null
          fecha_cobro_real?: string | null
          fecha_emision?: string
          fecha_estimada_cobro?: string | null
          id?: number
          metodo_pago: string
          moneda?: string | null
          monto: number
          numero_cuota?: number | null
          obra_id: number
          tipo_cambio?: number | null
          total_cuotas?: number | null
        }
        Update: {
          created_at?: string | null
          descripcion?: string
          estado?: string | null
          fecha_cobro_real?: string | null
          fecha_emision?: string
          fecha_estimada_cobro?: string | null
          id?: number
          metodo_pago?: string
          moneda?: string | null
          monto?: number
          numero_cuota?: number | null
          obra_id?: number
          tipo_cambio?: number | null
          total_cuotas?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "anticipos_clientes_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      articulos: {
        Row: {
          categoria: string
          codigo: string
          id: number
          nombre: string
          precio_referencia: number | null
          stock_minimo_alerta: number | null
          tipo: string
          unidad_medida: string
        }
        Insert: {
          categoria: string
          codigo: string
          id?: number
          nombre: string
          precio_referencia?: number | null
          stock_minimo_alerta?: number | null
          tipo: string
          unidad_medida: string
        }
        Update: {
          categoria?: string
          codigo?: string
          id?: number
          nombre?: string
          precio_referencia?: number | null
          stock_minimo_alerta?: number | null
          tipo?: string
          unidad_medida?: string
        }
        Relationships: []
      }
      asignacion_herramientas: {
        Row: {
          articulo_id: number
          empleado_responsable_id: number | null
          estado_herramienta: string | null
          fecha_devolucion: string | null
          fecha_entrega: string
          id: number
          obra_id: number
          observaciones: string | null
        }
        Insert: {
          articulo_id: number
          empleado_responsable_id?: number | null
          estado_herramienta?: string | null
          fecha_devolucion?: string | null
          fecha_entrega?: string
          id?: number
          obra_id: number
          observaciones?: string | null
        }
        Update: {
          articulo_id?: number
          empleado_responsable_id?: number | null
          estado_herramienta?: string | null
          fecha_devolucion?: string | null
          fecha_entrega?: string
          id?: number
          obra_id?: number
          observaciones?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "asignacion_herramientas_articulo_id_fkey"
            columns: ["articulo_id"]
            isOneToOne: false
            referencedRelation: "articulos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asignacion_herramientas_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_empleado_herramienta"
            columns: ["empleado_responsable_id"]
            isOneToOne: false
            referencedRelation: "empleados"
            referencedColumns: ["id"]
          },
        ]
      }
      asistencia_horas: {
        Row: {
          empleado_id: number
          horas_extras_100: number | null
          horas_extras_50: number | null
          horas_normales: number | null
          id: number
          parte_diario_id: number
        }
        Insert: {
          empleado_id: number
          horas_extras_100?: number | null
          horas_extras_50?: number | null
          horas_normales?: number | null
          id?: number
          parte_diario_id: number
        }
        Update: {
          empleado_id?: number
          horas_extras_100?: number | null
          horas_extras_50?: number | null
          horas_normales?: number | null
          id?: number
          parte_diario_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "asistencia_horas_empleado_id_fkey"
            columns: ["empleado_id"]
            isOneToOne: false
            referencedRelation: "empleados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "asistencia_horas_parte_diario_id_fkey"
            columns: ["parte_diario_id"]
            isOneToOne: false
            referencedRelation: "partes_diarios_obra"
            referencedColumns: ["id"]
          },
        ]
      }
      cheques: {
        Row: {
          anticipo_id: number | null
          banco: string
          created_at: string | null
          cuit_emisor: string | null
          destino_detalle: string | null
          estado: string | null
          fecha_emision: string
          fecha_pago_diferido: string
          id: number
          librador_nombre: string | null
          monto: number
          numero_cheque: string
          tipo: string | null
        }
        Insert: {
          anticipo_id?: number | null
          banco: string
          created_at?: string | null
          cuit_emisor?: string | null
          destino_detalle?: string | null
          estado?: string | null
          fecha_emision: string
          fecha_pago_diferido: string
          id?: number
          librador_nombre?: string | null
          monto: number
          numero_cheque: string
          tipo?: string | null
        }
        Update: {
          anticipo_id?: number | null
          banco?: string
          created_at?: string | null
          cuit_emisor?: string | null
          destino_detalle?: string | null
          estado?: string | null
          fecha_emision?: string
          fecha_pago_diferido?: string
          id?: number
          librador_nombre?: string | null
          monto?: number
          numero_cheque?: string
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cheques_anticipo_id_fkey"
            columns: ["anticipo_id"]
            isOneToOne: false
            referencedRelation: "anticipos_clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          created_at: string | null
          cuit_dni: string | null
          direccion: string | null
          email: string | null
          id: number
          nombre_razon_social: string
          telefono: string | null
          tipo_persona: string | null
        }
        Insert: {
          created_at?: string | null
          cuit_dni?: string | null
          direccion?: string | null
          email?: string | null
          id?: number
          nombre_razon_social: string
          telefono?: string | null
          tipo_persona?: string | null
        }
        Update: {
          created_at?: string | null
          cuit_dni?: string | null
          direccion?: string | null
          email?: string | null
          id?: number
          nombre_razon_social?: string
          telefono?: string | null
          tipo_persona?: string | null
        }
        Relationships: []
      }
      contactos_leads_web: {
        Row: {
          created_at: string | null
          email: string
          estado: string | null
          id: number
          mensaje: string | null
          nombre: string
          telefono: string | null
          tipo_proyecto_interes: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          estado?: string | null
          id?: number
          mensaje?: string | null
          nombre: string
          telefono?: string | null
          tipo_proyecto_interes?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          estado?: string | null
          id?: number
          mensaje?: string | null
          nombre?: string
          telefono?: string | null
          tipo_proyecto_interes?: string | null
        }
        Relationships: []
      }
      depositos: {
        Row: {
          es_obrador: boolean | null
          id: number
          nombre: string
          obra_vinculada_id: number | null
          ubicacion: string | null
        }
        Insert: {
          es_obrador?: boolean | null
          id?: number
          nombre: string
          obra_vinculada_id?: number | null
          ubicacion?: string | null
        }
        Update: {
          es_obrador?: boolean | null
          id?: number
          nombre?: string
          obra_vinculada_id?: number | null
          ubicacion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "depositos_obra_vinculada_id_fkey"
            columns: ["obra_vinculada_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      documentos_obra: {
        Row: {
          archivo_url: string
          created_at: string | null
          id: number
          obra_id: number
          rubro_tecnico: string | null
          subido_por: number | null
          tipo: string
          titulo: string
          version: number | null
          visible_en_web: boolean | null
        }
        Insert: {
          archivo_url: string
          created_at?: string | null
          id?: number
          obra_id: number
          rubro_tecnico?: string | null
          subido_por?: number | null
          tipo: string
          titulo: string
          version?: number | null
          visible_en_web?: boolean | null
        }
        Update: {
          archivo_url?: string
          created_at?: string | null
          id?: number
          obra_id?: number
          rubro_tecnico?: string | null
          subido_por?: number | null
          tipo?: string
          titulo?: string
          version?: number | null
          visible_en_web?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "documentos_obra_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentos_obra_subido_por_fkey"
            columns: ["subido_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      empleados: {
        Row: {
          activo: boolean | null
          apellido: string
          categoria: string
          contacto_emergencia_nombre: string | null
          cuil: string
          fecha_alta: string
          id: number
          legajo: string
          nombre: string
          telefono: string
          telefono_emergencia: string | null
          tipo_contratacion: string | null
          valor_hora: number
        }
        Insert: {
          activo?: boolean | null
          apellido: string
          categoria: string
          contacto_emergencia_nombre?: string | null
          cuil: string
          fecha_alta?: string
          id?: number
          legajo: string
          nombre: string
          telefono: string
          telefono_emergencia?: string | null
          tipo_contratacion?: string | null
          valor_hora?: number
        }
        Update: {
          activo?: boolean | null
          apellido?: string
          categoria?: string
          contacto_emergencia_nombre?: string | null
          cuil?: string
          fecha_alta?: string
          id?: number
          legajo?: string
          nombre?: string
          telefono?: string
          telefono_emergencia?: string | null
          tipo_contratacion?: string | null
          valor_hora?: number
        }
        Relationships: []
      }
      gastos_obra: {
        Row: {
          cantidad: number | null
          comprobante_archivo_url: string | null
          created_at: string | null
          descripcion: string
          fecha: string
          id: number
          moneda: string | null
          numero_comprobante: string | null
          obra_id: number
          precio_unitario: number
          proveedor_id: number | null
          rubro: string
          subtotal: number | null
          tipo_cambio: number | null
          tipo_comprobante: string | null
          unidad: string | null
        }
        Insert: {
          cantidad?: number | null
          comprobante_archivo_url?: string | null
          created_at?: string | null
          descripcion: string
          fecha: string
          id?: number
          moneda?: string | null
          numero_comprobante?: string | null
          obra_id: number
          precio_unitario: number
          proveedor_id?: number | null
          rubro: string
          subtotal?: number | null
          tipo_cambio?: number | null
          tipo_comprobante?: string | null
          unidad?: string | null
        }
        Update: {
          cantidad?: number | null
          comprobante_archivo_url?: string | null
          created_at?: string | null
          descripcion?: string
          fecha?: string
          id?: number
          moneda?: string | null
          numero_comprobante?: string | null
          obra_id?: number
          precio_unitario?: number
          proveedor_id?: number | null
          rubro?: string
          subtotal?: number | null
          tipo_cambio?: number | null
          tipo_comprobante?: string | null
          unidad?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gastos_obra_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gastos_obra_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
        ]
      }
      movimientos_stock: {
        Row: {
          articulo_id: number
          cantidad: number
          destino_deposito_id: number | null
          fecha: string | null
          id: number
          obra_id: number | null
          observaciones: string | null
          origen_deposito_id: number | null
          remito_numero: string | null
          tipo_movimiento: string
          usuario_id: number | null
        }
        Insert: {
          articulo_id: number
          cantidad: number
          destino_deposito_id?: number | null
          fecha?: string | null
          id?: number
          obra_id?: number | null
          observaciones?: string | null
          origen_deposito_id?: number | null
          remito_numero?: string | null
          tipo_movimiento: string
          usuario_id?: number | null
        }
        Update: {
          articulo_id?: number
          cantidad?: number
          destino_deposito_id?: number | null
          fecha?: string | null
          id?: number
          obra_id?: number | null
          observaciones?: string | null
          origen_deposito_id?: number | null
          remito_numero?: string | null
          tipo_movimiento?: string
          usuario_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "movimientos_stock_articulo_id_fkey"
            columns: ["articulo_id"]
            isOneToOne: false
            referencedRelation: "articulos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_stock_destino_deposito_id_fkey"
            columns: ["destino_deposito_id"]
            isOneToOne: false
            referencedRelation: "depositos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_stock_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_stock_origen_deposito_id_fkey"
            columns: ["origen_deposito_id"]
            isOneToOne: false
            referencedRelation: "depositos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_stock_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      movimientos_vehiculo: {
        Row: {
          combustible_litros: number | null
          fecha: string
          gasto_combustible_pesos: number | null
          id: number
          km_llegada: number | null
          km_salida: number | null
          obra_id: number
          observaciones: string | null
          usuario_id: number | null
          vehiculo_id: number
        }
        Insert: {
          combustible_litros?: number | null
          fecha?: string
          gasto_combustible_pesos?: number | null
          id?: number
          km_llegada?: number | null
          km_salida?: number | null
          obra_id: number
          observaciones?: string | null
          usuario_id?: number | null
          vehiculo_id: number
        }
        Update: {
          combustible_litros?: number | null
          fecha?: string
          gasto_combustible_pesos?: number | null
          id?: number
          km_llegada?: number | null
          km_salida?: number | null
          obra_id?: number
          observaciones?: string | null
          usuario_id?: number | null
          vehiculo_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "movimientos_vehiculo_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_vehiculo_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_vehiculo_vehiculo_id_fkey"
            columns: ["vehiculo_id"]
            isOneToOne: false
            referencedRelation: "vehiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      obras: {
        Row: {
          cliente_id: number | null
          codigo: string
          created_at: string | null
          direccion: string | null
          es_publica_web: boolean | null
          estado: string | null
          fecha_cierre_real: string | null
          fecha_fin_estimada: string | null
          fecha_inicio: string | null
          id: number
          moneda_base: string | null
          nombre: string
          presupuesto_base: number | null
          tipo_obra: string
        }
        Insert: {
          cliente_id?: number | null
          codigo: string
          created_at?: string | null
          direccion?: string | null
          es_publica_web?: boolean | null
          estado?: string | null
          fecha_cierre_real?: string | null
          fecha_fin_estimada?: string | null
          fecha_inicio?: string | null
          id?: number
          moneda_base?: string | null
          nombre: string
          presupuesto_base?: number | null
          tipo_obra: string
        }
        Update: {
          cliente_id?: number | null
          codigo?: string
          created_at?: string | null
          direccion?: string | null
          es_publica_web?: boolean | null
          estado?: string | null
          fecha_cierre_real?: string | null
          fecha_fin_estimada?: string | null
          fecha_inicio?: string | null
          id?: number
          moneda_base?: string | null
          nombre?: string
          presupuesto_base?: number | null
          tipo_obra?: string
        }
        Relationships: [
          {
            foreignKeyName: "obras_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      partes_diarios_obra: {
        Row: {
          capataz_id: number | null
          clima: string | null
          fecha: string
          id: number
          obra_id: number
          observaciones: string | null
        }
        Insert: {
          capataz_id?: number | null
          clima?: string | null
          fecha?: string
          id?: number
          obra_id: number
          observaciones?: string | null
        }
        Update: {
          capataz_id?: number | null
          clima?: string | null
          fecha?: string
          id?: number
          obra_id?: number
          observaciones?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partes_diarios_obra_capataz_id_fkey"
            columns: ["capataz_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partes_diarios_obra_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
      proveedores: {
        Row: {
          cbu_alias: string | null
          condicion_iva: string | null
          contacto_nombre: string | null
          cuit: string
          email: string | null
          id: number
          razon_social: string
          telefono: string | null
        }
        Insert: {
          cbu_alias?: string | null
          condicion_iva?: string | null
          contacto_nombre?: string | null
          cuit: string
          email?: string | null
          id?: number
          razon_social: string
          telefono?: string | null
        }
        Update: {
          cbu_alias?: string | null
          condicion_iva?: string | null
          contacto_nombre?: string | null
          cuit?: string
          email?: string | null
          id?: number
          razon_social?: string
          telefono?: string | null
        }
        Relationships: []
      }
      stock_por_deposito: {
        Row: {
          articulo_id: number
          cantidad_actual: number
          deposito_id: number
          id: number
        }
        Insert: {
          articulo_id: number
          cantidad_actual?: number
          deposito_id: number
          id?: number
        }
        Update: {
          articulo_id?: number
          cantidad_actual?: number
          deposito_id?: number
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_por_deposito_articulo_id_fkey"
            columns: ["articulo_id"]
            isOneToOne: false
            referencedRelation: "articulos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_por_deposito_deposito_id_fkey"
            columns: ["deposito_id"]
            isOneToOne: false
            referencedRelation: "depositos"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          activo: boolean | null
          created_at: string | null
          email: string
          id: number
          nombre: string
          password_hash: string
          rol: string
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          email: string
          id?: number
          nombre: string
          password_hash: string
          rol: string
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          email?: string
          id?: number
          nombre?: string
          password_hash?: string
          rol?: string
        }
        Relationships: []
      }
      vehiculos: {
        Row: {
          activo: boolean | null
          id: number
          km_actual: number | null
          marca_modelo: string
          obra_actual_id: number | null
          observaciones: string | null
          patente: string
          tipo: string
          vencimiento_seguro: string | null
          vencimiento_vtv: string | null
        }
        Insert: {
          activo?: boolean | null
          id?: number
          km_actual?: number | null
          marca_modelo: string
          obra_actual_id?: number | null
          observaciones?: string | null
          patente: string
          tipo: string
          vencimiento_seguro?: string | null
          vencimiento_vtv?: string | null
        }
        Update: {
          activo?: boolean | null
          id?: number
          km_actual?: number | null
          marca_modelo?: string
          obra_actual_id?: number | null
          observaciones?: string | null
          patente?: string
          tipo?: string
          vencimiento_seguro?: string | null
          vencimiento_vtv?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehiculos_obra_actual_id_fkey"
            columns: ["obra_actual_id"]
            isOneToOne: false
            referencedRelation: "obras"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
