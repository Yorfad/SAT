import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";
import type { Settings } from '../types';

export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data } = await api.get<Settings>("/public/settings");
      // Aplicar tema dinámico:
      const color = data?.theme_json?.primary;
      if (color) document.documentElement.style.setProperty("--color-brand", color);
      document.title = data?.display_name || "SAT";
      return data;
    }
  });
}
