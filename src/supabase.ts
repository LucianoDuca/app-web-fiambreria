import { createClient } from "@supabase/supabase-js";

// La clave "publishable" de Supabase está pensada para usarse en el navegador
// (es pública). Se puede sobrescribir con variables de entorno en Vercel, pero
// por defecto la app ya funciona sin configurar nada.
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || "https://qllpsujnqivbcrlcmkhi.supabase.co";

const supabaseKey =
  import.meta.env.VITE_SUPABASE_KEY ||
  "sb_publishable_9LLb5tEcak2pNWwcZkMfLA_Ki3xuy9j";

export const supabase = createClient(supabaseUrl, supabaseKey);
