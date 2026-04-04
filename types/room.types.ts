export interface Room {
  id: string;
  name: string;
  description?: string;
  capacity?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoomRequest {
  tenantId: string;
  name: string;
  description?: string;
  capacity?: number;
}

export interface UpdateRoomRequest {
  name?: string;
  description?: string;
  capacity?: number;
  isActive?: boolean;
}
