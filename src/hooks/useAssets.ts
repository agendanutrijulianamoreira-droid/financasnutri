import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assetApi } from '../api/assetApi';
import type { CreateAssetInput } from '../lib/validations';

export function useAssets() {
  return useQuery({
    queryKey: ['assets'],
    queryFn: () => assetApi.list(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAssetInput) => assetApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assets'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateAssetValue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, value }: { id: string; value: number }) => assetApi.updateValue(id, value),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assets'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => assetApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assets'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
