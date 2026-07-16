// Hand-written to match supabase/migrations/*.sql. Once the schema is applied to the
// live project, this can be regenerated with:
//   npx supabase gen types typescript --project-id <ref> > types/database.ts
// (re-add the three RPC return types below if the generator drops them).

export type OrderStatus =
  | "nuevo"
  | "contactado"
  | "en_proceso"
  | "enviado"
  | "entregado"
  | "cancelado";

export type ProfileRole = "buyer" | "admin";

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          slug: string;
          label: string;
          title: string;
          description: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          label: string;
          title: string;
          description?: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string;
          city: string;
          address: string;
          role: ProfileRole;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          phone?: string;
          city?: string;
          address?: string;
          role?: ProfileRole;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          slug: string;
          description: string;
          color: string;
          gold_type: string;
          image_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          name: string;
          slug: string;
          description?: string;
          color?: string;
          gold_type?: string;
          image_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          label: string | null;
          price: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          label?: string | null;
          price: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_variants"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          phone: string;
          email: string;
          city: string;
          address: string;
          notes: string;
          status: OrderStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name: string;
          phone: string;
          email: string;
          city: string;
          address: string;
          notes?: string;
          status?: OrderStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          variant_id: string | null;
          product_name_snapshot: string;
          variant_label_snapshot: string | null;
          unit_price: number;
          quantity: number;
          subtotal: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          variant_id?: string | null;
          product_name_snapshot: string;
          variant_label_snapshot?: string | null;
          unit_price: number;
          quantity: number;
          subtotal: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      settings: {
        Row: { key: string; value: unknown };
        Insert: { key: string; value: unknown };
        Update: Partial<Database["public"]["Tables"]["settings"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      create_product_with_variant: {
        Args: {
          p_name: string;
          p_category_id: string;
          p_description: string;
          p_color: string;
          p_gold_type: string;
          p_image_url: string | null;
          p_is_active: boolean;
          p_price: number;
          p_slug: string;
        };
        Returns: string;
      };
      create_order: {
        Args: {
          p_full_name: string;
          p_phone: string;
          p_email: string;
          p_city: string;
          p_address: string;
          p_notes: string;
          p_items: { product_id: string; quantity: number }[];
        };
        Returns: string;
      };
      check_rate_limit: {
        Args: {
          p_key: string;
          p_max_attempts: number;
          p_window_seconds: number;
        };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
