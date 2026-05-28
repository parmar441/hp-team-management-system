import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/client";

export function useAssignments() {
  return useQuery({
    queryKey: ["assignments"],
    queryFn: () => api.get("/assignments").then((r) => r.data),
  });
}

export function useUpdateAssignmentRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slotId, roomNumber }: { slotId: string; roomNumber: string }) =>
      api.patch(`/assignments/${slotId}/room`, { roomNumber }).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["assignments"] }),
  });
}
