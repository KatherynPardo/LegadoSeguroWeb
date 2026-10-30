-- 002_seguridad_rls.sql
-- Seguridad: activa RLS (Row Level Security) en todas las tablas del esquema public.
--
-- Con RLS activado y SIN políticas, la API pública de Supabase no puede leer ni escribir nada.
-- El backend Express se conecta como usuario "postgres" (dueño de las tablas), que sí tiene acceso.
-- Es decir: solo el backend, con credenciales privadas, toca los datos.

DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;
