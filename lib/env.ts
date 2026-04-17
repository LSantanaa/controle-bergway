function isValidHttpUrl(value: string | undefined) {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isPlaceholder(value: string | undefined) {
  if (!value) {
    return true;
  }

  return /^(seu_|sua_|sb_publishable_xxx|sb_secret_xxx)$/i.test(value);
}

function readFirstEnv(...names: string[]) {
  for (const name of names) {
    const value = process.env[name];
    if (value) {
      return value;
    }
  }

  return undefined;
}

export const supabaseUrl = readFirstEnv("NEXT_PUBLIC_SUPABASE_URL", "VITE_SUPABASE_URL");
export const supabasePublicKey = readFirstEnv(
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "VITE_SUPABASE_ANON_KEY",
);
export const supabaseSecretKey = readFirstEnv(
  "SUPABASE_SECRET_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
);

export const hasSupabasePublicEnv =
  isValidHttpUrl(supabaseUrl) && !isPlaceholder(supabasePublicKey);

export const supabaseConfigError = hasSupabasePublicEnv
  ? null
  : "Configure NEXT_PUBLIC_SUPABASE_URL e a chave publica do Supabase com valores validos.";

export const hasSupabaseAdminEnv =
  typeof supabaseSecretKey === "string" && !isPlaceholder(supabaseSecretKey);

export function getSupabasePublicEnv() {
  if (!hasSupabasePublicEnv || !supabaseUrl || !supabasePublicKey) {
    throw new Error(supabaseConfigError ?? "Configuracao publica do Supabase invalida.");
  }

  return {
    url: supabaseUrl,
    key: supabasePublicKey,
  };
}

export function getSupabaseAdminKey() {
  if (!hasSupabaseAdminEnv || !supabaseSecretKey) {
    throw new Error("Configuracao administrativa do Supabase invalida.");
  }

  return supabaseSecretKey;
}
