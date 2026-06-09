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
      adiciones_estructuradas: {
        Row: {
          created_at: string
          id: string
          nombre: string
          precio_adicional: number
          producto_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nombre: string
          precio_adicional: number
          producto_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nombre?: string
          precio_adicional?: number
          producto_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "adiciones_estructuradas_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      comercios: {
        Row: {
          activo: boolean
          cerrado_temporalmente: boolean
          created_at: string
          direccion: string
          estado_suscripcion: Database["public"]["Enums"]["estado_suscripcion"]
          fecha_fin_gratis: string
          fecha_inicio_gratis: string
          formas_pago: Json
          foto_principal_url: string | null
          horario: Json
          id: string
          nombre: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          cerrado_temporalmente?: boolean
          created_at?: string
          direccion: string
          estado_suscripcion?: Database["public"]["Enums"]["estado_suscripcion"]
          fecha_fin_gratis?: string
          fecha_inicio_gratis?: string
          formas_pago?: Json
          foto_principal_url?: string | null
          horario?: Json
          id?: string
          nombre: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          cerrado_temporalmente?: boolean
          created_at?: string
          direccion?: string
          estado_suscripcion?: Database["public"]["Enums"]["estado_suscripcion"]
          fecha_fin_gratis?: string
          fecha_inicio_gratis?: string
          formas_pago?: Json
          foto_principal_url?: string | null
          horario?: Json
          id?: string
          nombre?: string
          updated_at?: string
        }
        Relationships: []
      }
      comprobantes_pago: {
        Row: {
          created_at: string
          id: string
          pedido_id: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          id?: string
          pedido_id: string
          storage_path: string
        }
        Update: {
          created_at?: string
          id?: string
          pedido_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "comprobantes_pago_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: true
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      direcciones_guardadas: {
        Row: {
          alias: string | null
          created_at: string
          direccion: string
          es_default: boolean
          id: string
          lat: number | null
          lng: number | null
          user_id: string
        }
        Insert: {
          alias?: string | null
          created_at?: string
          direccion: string
          es_default?: boolean
          id?: string
          lat?: number | null
          lng?: number | null
          user_id: string
        }
        Update: {
          alias?: string | null
          created_at?: string
          direccion?: string
          es_default?: boolean
          id?: string
          lat?: number | null
          lng?: number | null
          user_id?: string
        }
        Relationships: []
      }
      domiciliarios: {
        Row: {
          activo: boolean
          celular: string
          comercio_id: string
          created_at: string
          email: string | null
          id: string
          nombre: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activo?: boolean
          celular: string
          comercio_id: string
          created_at?: string
          email?: string | null
          id?: string
          nombre: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activo?: boolean
          celular?: string
          comercio_id?: string
          created_at?: string
          email?: string | null
          id?: string
          nombre?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "domiciliarios_comercio_id_fkey"
            columns: ["comercio_id"]
            isOneToOne: false
            referencedRelation: "comercios"
            referencedColumns: ["id"]
          },
        ]
      }
      historial_estado_pedido: {
        Row: {
          actor_user_id: string | null
          created_at: string
          estado_anterior: Database["public"]["Enums"]["estado_pedido"] | null
          estado_nuevo: Database["public"]["Enums"]["estado_pedido"]
          id: string
          motivo: string | null
          pedido_id: string
        }
        Insert: {
          actor_user_id?: string | null
          created_at?: string
          estado_anterior?: Database["public"]["Enums"]["estado_pedido"] | null
          estado_nuevo: Database["public"]["Enums"]["estado_pedido"]
          id?: string
          motivo?: string | null
          pedido_id: string
        }
        Update: {
          actor_user_id?: string | null
          created_at?: string
          estado_anterior?: Database["public"]["Enums"]["estado_pedido"] | null
          estado_nuevo?: Database["public"]["Enums"]["estado_pedido"]
          id?: string
          motivo?: string | null
          pedido_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "historial_estado_pedido_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      items_pedido: {
        Row: {
          adiciones_seleccionadas: Json
          cantidad: number
          created_at: string
          id: string
          nombre_snapshot: string
          pedido_id: string
          precio_unitario_cop: number
          producto_id: string
          subtotal_cop: number
        }
        Insert: {
          adiciones_seleccionadas?: Json
          cantidad: number
          created_at?: string
          id?: string
          nombre_snapshot: string
          pedido_id: string
          precio_unitario_cop: number
          producto_id: string
          subtotal_cop: number
        }
        Update: {
          adiciones_seleccionadas?: Json
          cantidad?: number
          created_at?: string
          id?: string
          nombre_snapshot?: string
          pedido_id?: string
          precio_unitario_cop?: number
          producto_id?: string
          subtotal_cop?: number
        }
        Relationships: [
          {
            foreignKeyName: "items_pedido_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_pedido_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_audit: {
        Row: {
          accion: string
          comprobante_sha256: string | null
          comprobante_storage_path: string | null
          created_at: string
          id: string
          motivo: string | null
          pedido_id: string
          validador_user_id: string
        }
        Insert: {
          accion: string
          comprobante_sha256?: string | null
          comprobante_storage_path?: string | null
          created_at?: string
          id?: string
          motivo?: string | null
          pedido_id: string
          validador_user_id: string
        }
        Update: {
          accion?: string
          comprobante_sha256?: string | null
          comprobante_storage_path?: string | null
          created_at?: string
          id?: string
          motivo?: string | null
          pedido_id?: string
          validador_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_audit_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          adicion_libre: string | null
          cliente_id: string
          comercio_id: string
          created_at: string
          direccion_entrega: Json | null
          domiciliario_id: string | null
          estado: Database["public"]["Enums"]["estado_pedido"]
          forma_pago: Database["public"]["Enums"]["forma_pago"]
          id: string
          modalidad: Database["public"]["Enums"]["modalidad_entrega"]
          motivo_cancelacion: string | null
          sequence_number: number
          total_cop: number
          tracking_lat: number | null
          tracking_lng: number | null
          tracking_updated_at: string | null
          updated_at: string
        }
        Insert: {
          adicion_libre?: string | null
          cliente_id: string
          comercio_id: string
          created_at?: string
          direccion_entrega?: Json | null
          domiciliario_id?: string | null
          estado?: Database["public"]["Enums"]["estado_pedido"]
          forma_pago: Database["public"]["Enums"]["forma_pago"]
          id?: string
          modalidad: Database["public"]["Enums"]["modalidad_entrega"]
          motivo_cancelacion?: string | null
          sequence_number?: number
          total_cop: number
          tracking_lat?: number | null
          tracking_lng?: number | null
          tracking_updated_at?: string | null
          updated_at?: string
        }
        Update: {
          adicion_libre?: string | null
          cliente_id?: string
          comercio_id?: string
          created_at?: string
          direccion_entrega?: Json | null
          domiciliario_id?: string | null
          estado?: Database["public"]["Enums"]["estado_pedido"]
          forma_pago?: Database["public"]["Enums"]["forma_pago"]
          id?: string
          modalidad?: Database["public"]["Enums"]["modalidad_entrega"]
          motivo_cancelacion?: string | null
          sequence_number?: number
          total_cop?: number
          tracking_lat?: number | null
          tracking_lng?: number | null
          tracking_updated_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_comercio_id_fkey"
            columns: ["comercio_id"]
            isOneToOne: false
            referencedRelation: "comercios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_domiciliario_id_fkey"
            columns: ["domiciliario_id"]
            isOneToOne: false
            referencedRelation: "domiciliarios"
            referencedColumns: ["id"]
          },
        ]
      }
      perfiles_cliente: {
        Row: {
          celular: string | null
          created_at: string
          nombre: string
          updated_at: string
          user_id: string
        }
        Insert: {
          celular?: string | null
          created_at?: string
          nombre: string
          updated_at?: string
          user_id: string
        }
        Update: {
          celular?: string | null
          created_at?: string
          nombre?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_admins: {
        Row: {
          created_at: string
          nombre: string
          user_id: string
        }
        Insert: {
          created_at?: string
          nombre: string
          user_id: string
        }
        Update: {
          created_at?: string
          nombre?: string
          user_id?: string
        }
        Relationships: []
      }
      productos: {
        Row: {
          comercio_id: string
          created_at: string
          descripcion: string | null
          disponible: boolean
          foto_url: string | null
          id: string
          nombre: string
          precio_cop: number
          updated_at: string
        }
        Insert: {
          comercio_id: string
          created_at?: string
          descripcion?: string | null
          disponible?: boolean
          foto_url?: string | null
          id?: string
          nombre: string
          precio_cop: number
          updated_at?: string
        }
        Update: {
          comercio_id?: string
          created_at?: string
          descripcion?: string | null
          disponible?: boolean
          foto_url?: string | null
          id?: string
          nombre?: string
          precio_cop?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "productos_comercio_id_fkey"
            columns: ["comercio_id"]
            isOneToOne: false
            referencedRelation: "comercios"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          last_used_at: string | null
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          last_used_at?: string | null
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          last_used_at?: string | null
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      usuarios_comercio: {
        Row: {
          activo: boolean
          comercio_id: string
          created_at: string
          id: string
          nombre: string
          rol: Database["public"]["Enums"]["rol_usuario"]
          updated_at: string
          user_id: string
        }
        Insert: {
          activo?: boolean
          comercio_id: string
          created_at?: string
          id?: string
          nombre: string
          rol: Database["public"]["Enums"]["rol_usuario"]
          updated_at?: string
          user_id: string
        }
        Update: {
          activo?: boolean
          comercio_id?: string
          created_at?: string
          id?: string
          nombre?: string
          rol?: Database["public"]["Enums"]["rol_usuario"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_comercio_comercio_id_fkey"
            columns: ["comercio_id"]
            isOneToOne: false
            referencedRelation: "comercios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      is_platform_admin: { Args: never; Returns: boolean }
      tenant_id: { Args: never; Returns: string }
    }
    Enums: {
      estado_pedido:
        | "pendiente_pago"
        | "validando_pago"
        | "en_cocina"
        | "listo"
        | "en_domicilio"
        | "entregado"
        | "cancelado"
      estado_suscripcion: "periodo_gratis" | "al_dia" | "pendiente" | "atrasado"
      forma_pago: "transferencia" | "efectivo_recibir" | "efectivo_local"
      modalidad_entrega: "domicilio" | "recoger_en_local"
      rol_usuario: "mostrador" | "cocina" | "domiciliario"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      estado_pedido: [
        "pendiente_pago",
        "validando_pago",
        "en_cocina",
        "listo",
        "en_domicilio",
        "entregado",
        "cancelado",
      ],
      estado_suscripcion: ["periodo_gratis", "al_dia", "pendiente", "atrasado"],
      forma_pago: ["transferencia", "efectivo_recibir", "efectivo_local"],
      modalidad_entrega: ["domicilio", "recoger_en_local"],
      rol_usuario: ["mostrador", "cocina", "domiciliario"],
    },
  },
} as const
