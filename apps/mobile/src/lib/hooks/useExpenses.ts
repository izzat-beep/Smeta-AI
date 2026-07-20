import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { expensesApi, type AddExpenseInput } from '@/lib/api/endpoints';
import { qk } from '@/lib/hooks/useProjects';

export const expenseKeys = {
  list: (projectId?: string) => ['expenses', 'list', projectId ?? 'all'] as const,
};

export function useExpenses(projectId?: string) {
  return useQuery({
    queryKey: expenseKeys.list(projectId),
    queryFn: () => expensesApi.list(projectId ? { projectId } : undefined),
  });
}

function invalidate(client: ReturnType<typeof useQueryClient>, projectId?: string | null) {
  void client.invalidateQueries({ queryKey: ['expenses'] });
  void client.invalidateQueries({ queryKey: qk.dashboard });
  void client.invalidateQueries({ queryKey: ['projects'] });
  if (projectId) void client.invalidateQueries({ queryKey: qk.project(projectId) });
}

export function useAddExpense() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: AddExpenseInput) => expensesApi.add(input),
    onSuccess: (row) => invalidate(client, row.projectId),
  });
}

export function useDeleteExpense() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: number; projectId?: string | null }) => expensesApi.remove(id),
    onSuccess: (_res, vars) => invalidate(client, vars.projectId),
  });
}
