import apiClient, { unwrapResponse } from '@/api/client';
import type { ApiResponse, ListParams } from '@/types/api.types';
import type {
  Tag,
  TagCreateInput,
  TagUpdateInput,
  Statistics,
  SearchParams,
} from '@/types/models';

// List tags with pagination
export const listTags = async (params?: ListParams): Promise<{
  tags: Tag[];
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
}> => {
  const response = await apiClient.get<ApiResponse<{
    tags: Tag[];
    pagination: {
      total: number;
      per_page: number;
      current_page: number;
      last_page: number;
      from: number;
      to: number;
    };
  }>>('/tags', { params });
  return unwrapResponse(response);
};

// Create a new tag
export const createTag = async (data: TagCreateInput): Promise<Tag> => {
  const response = await apiClient.post<ApiResponse<{ tag: Tag; message: string }>>('/tags', data);
  const result = unwrapResponse(response);
  return result.tag;
};

// Get a single tag by ID
export const getTag = async (id: string): Promise<Tag> => {
  const response = await apiClient.get<ApiResponse<{ tag: Tag }>>(`/tags/${id}`);
  const result = unwrapResponse(response);
  return result.tag;
};

// Update a tag
export const updateTag = async (id: string, data: TagUpdateInput): Promise<Tag> => {
  const response = await apiClient.put<ApiResponse<{ tag: Tag; message: string }>>(`/tags/${id}`, data);
  const result = unwrapResponse(response);
  return result.tag;
};

// Delete a tag
export const deleteTag = async (id: string): Promise<void> => {
  const response = await apiClient.delete<ApiResponse<null>>(`/tags/${id}`);
  unwrapResponse(response);
};

// Search tags
export const searchTags = async (params: SearchParams): Promise<{
  tags: Tag[];
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
}> => {
  const response = await apiClient.get<ApiResponse<{
    results: Tag[];
    pagination: {
      total: number;
      per_page: number;
      current_page: number;
      last_page: number;
    };
  }>>('/tags/search', { params });
  const result = unwrapResponse(response);
  // Normalize response to match listTags structure
  return {
    tags: result.results,
    pagination: {
      ...result.pagination,
      from: (result.pagination.current_page - 1) * result.pagination.per_page + 1,
      to: Math.min(result.pagination.current_page * result.pagination.per_page, result.pagination.total),
    },
  };
};

// Export tags
export const exportTags = async (format: 'csv' | 'json' = 'csv'): Promise<Blob> => {
  const response = await apiClient.get<ApiResponse<{
    export: {
      format: string;
      data: string | object[];
    };
    message: string;
  }>>('/tags/export', { params: { format } });

  const result = unwrapResponse(response);
  const exportData = result.export;

  // Convert the data to appropriate format for download
  let content: string;
  let mimeType: string;

  if (exportData.format === 'csv') {
    content = exportData.data as string;
    mimeType = 'text/csv';
  } else {
    content = JSON.stringify(exportData.data, null, 2);
    mimeType = 'application/json';
  }

  return new Blob([content], { type: mimeType });
};

// Get tags statistics
export const getTagsStats = async (): Promise<Statistics> => {
  const response = await apiClient.get<ApiResponse<Statistics>>('/tags/stats');
  return unwrapResponse(response);
};
