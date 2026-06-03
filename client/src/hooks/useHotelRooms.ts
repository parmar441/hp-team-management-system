import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../api/client";

export function useHotelRoomsWithStatus(hotelId: string | undefined) {
  return useQuery({
    queryKey: ["hotel-rooms", hotelId, "status"],
    queryFn: () => api.get(`/hotel-rooms/${hotelId}/with-status`).then((r) => r.data),
    enabled: !!hotelId,
  });
}

export function useAvailableRooms(hotelId: string | undefined) {
  return useQuery({
    queryKey: ["hotel-rooms", hotelId, "available"],
    queryFn: () => api.get(`/hotel-rooms/${hotelId}/available`).then((r) => r.data),
    enabled: !!hotelId,
  });
}

export function useAddHotelRooms() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ hotelId, roomNumbers }: { hotelId: string; roomNumbers: string }) =>
      api.post(`/hotel-rooms/${hotelId}`, { roomNumbers }).then((r) => r.data),
    onSuccess: (_, { hotelId }) => {
      queryClient.invalidateQueries({ queryKey: ["hotel-rooms", hotelId] });
    },
  });
}

export function useDeleteHotelRoom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (roomId: string) => api.delete(`/hotel-rooms/${roomId}`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotel-rooms"] });
    },
  });
}

export function useDeleteAllHotelRooms() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (hotelId: string) => api.delete(`/hotel-rooms/${hotelId}/all`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotel-rooms"] });
    },
  });
}

export function useImportHotelRooms() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ hotelId, file }: { hotelId: string; file: File }) => {
      const formData = new FormData();
      formData.append("file", file);
      return api.post(`/hotel-rooms/${hotelId}/import`, formData).then((r) => r.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hotel-rooms"] });
    },
  });
}
