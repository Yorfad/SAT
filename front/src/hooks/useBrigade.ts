import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../lib/api";
import type { BrigadeRow } from "../types";

export function useBrigade(params?: { year?: number; month?: number }) {
  const y = params?.year;
  const m = params?.month;
  return useQuery({
    queryKey: ["brigade", y, m],
    queryFn: async () => (await api.get<{year:number; month:number; rows:BrigadeRow[]}>(
      "/board",
      { params: { year: y, month: m } }
    )).data,
  });
}

export function useUpdateObservations(){
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ invoiceId, observations }: {invoiceId:number; observations:string}) =>
      (await api.patch(`/board/invoice/${invoiceId}/observations`, { observations })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brigade"] })
  });
}

export function useToggleChecklist(){
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: {id:number; status:'done'|'todo'}) =>
      (await api.patch(`/board/checklist/${id}`, { status })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["brigade"] })
  });
}
