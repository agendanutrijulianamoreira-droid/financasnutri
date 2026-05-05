import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportApi } from '../api/reportApi';

export function useReports() {
  return useQuery({
    queryKey: ['reports'],
    queryFn: () => reportApi.list(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useMonthlyReport(month: number, year: number) {
  return useQuery({
    queryKey: ['reports', month, year],
    queryFn: () => reportApi.get(month, year),
    staleTime: 1000 * 60 * 5,
  });
}

export function useTriggerMonthlyClose() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ month, year }: { month: number; year: number }) => reportApi.triggerClose(month, year),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports'] }),
  });
}
