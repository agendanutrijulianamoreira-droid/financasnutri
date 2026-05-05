import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionApi } from '../api/transactionApi';
import { toast } from '../store/useToastStore';
import type { CreateTransactionInput } from '../lib/validations';
import type { PersonType } from '../types';
import { TransactionType } from '../types';

interface TransactionFilters {
  person_type?: PersonType;
  month?: number;
  year?: number;
  account_id?: string;
}

export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: () => transactionApi.list(filters),
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTransactionInput) => transactionApi.create(data),
    onSuccess: (tx) => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['financial-stats'] });

      const isIncome = tx.type === TransactionType.INCOME;
      toast.success(
        isIncome ? 'Receita registrada' : 'Despesa registrada',
        tx.description,
      );
    },
    onError: (err) => {
      toast.error('Erro ao salvar', err instanceof Error ? err.message : 'Tente novamente.');
    },
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => transactionApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['financial-stats'] });
      toast.info('Lançamento excluído');
    },
    onError: (err) => {
      toast.error('Erro ao excluir', err instanceof Error ? err.message : 'Tente novamente.');
    },
  });
}
