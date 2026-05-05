import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { accountApi } from '../api/accountApi';
import type { CreateAccountInput } from '../lib/validations';
import type { PersonType } from '../types';

export function useAccounts(person_type?: PersonType) {
  return useQuery({
    queryKey: ['accounts', person_type],
    queryFn: () => accountApi.list(person_type),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAccountInput) => accountApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
  });
}

export function useDeactivateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => accountApi.deactivate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
