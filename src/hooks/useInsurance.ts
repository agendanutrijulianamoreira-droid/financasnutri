import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { insuranceApi } from '../api/insuranceApi';
import type { CreateInsuranceInput } from '../lib/validations';

export function useInsurance() {
  return useQuery({
    queryKey: ['insurance'],
    queryFn: () => insuranceApi.list(),
    staleTime: 1000 * 60 * 10,
  });
}

export function useCreateInsurance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInsuranceInput) => insuranceApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['insurance'] }),
  });
}

export function useDeleteInsurance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => insuranceApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['insurance'] }),
  });
}
