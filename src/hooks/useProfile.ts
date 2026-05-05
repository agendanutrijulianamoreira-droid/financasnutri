import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '../api/profileApi';

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => profileApi.get(),
    staleTime: 1000 * 60 * 10,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: profileApi.updateProfile,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });
}

export function useUpsertPF() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: profileApi.upsertPF,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });
}

export function useUpsertPJ() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: profileApi.upsertPJ,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });
}
