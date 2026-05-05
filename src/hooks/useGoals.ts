import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goalApi } from '../api/goalApi';
import { toast } from '../store/useToastStore';
import type { CreateGoalInput } from '../lib/validations';
import type { GoalStatus, FinancialGoal } from '../types';

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
    onSuccess: (goal) => {
      qc.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Meta criada!', `"${goal.name}" foi adicionada às suas metas.`);
    },
  });
}

export function useAddGoalContribution() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, amount, goalName }: { id: string; amount: number; goalName?: string }) => {
      // Fetch current state before contributing to check if it will complete the goal
      const goals = qc.getQueryData<FinancialGoal[]>(['goals']) ?? [];
      const goal = goals.find((g) => g.id === id);
      const willComplete = goal
        ? goal.current_amount + amount >= goal.target_amount
        : false;

      await goalApi.addContribution(id, amount);
      return { willComplete, goalName: goalName ?? goal?.name ?? '' };
    },
    onSuccess: ({ willComplete, goalName }) => {
      qc.invalidateQueries({ queryKey: ['goals'] });
      qc.invalidateQueries({ queryKey: ['financial-stats'] });
      if (willComplete) {
        toast.success('Meta atingida! 🎉', `Parabéns! Você completou a meta "${goalName}".`);
      } else {
        toast.info('Aporte registrado', `Contribuição adicionada à meta "${goalName}".`);
      }
    },
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals'] });
      toast.info('Meta removida');
    },
  });
}
