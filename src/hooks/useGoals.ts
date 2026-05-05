import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goalApi } from '../api/goalApi';
import type { CreateGoalInput } from '../lib/validations';
import type { GoalStatus } from '../types';

export function useGoals() {
  return useQuery({
    queryKey: ['goals'],
    queryFn: () => goalApi.list(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateGoalInput) => goalApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });
}

export function useAddGoalContribution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) => goalApi.addContribution(id, amount),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });
}

export function useUpdateGoalStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: GoalStatus }) => goalApi.updateStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => goalApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['goals'] }),
  });
}
