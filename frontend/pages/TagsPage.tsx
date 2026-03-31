import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { LoadingRocket } from '@/components/common/LoadingRocket';
import { DynamicIcon } from '@/components/common/DynamicIcon';
import { TagFormModal } from './TagFormModal';
import { listTags, searchTags, exportTags } from '../api';
import type { Tag } from '@/types/models';
import type { PaginationMeta } from '@/types/api.types';
import { useDebounce, useExport } from '@/hooks';
import { useFolderFilterStore } from '@/store/folderFilterStore';
import {
  Tag as TagIcon,
  Search,
  Plus,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
  Folder,
} from 'lucide-react';
import { DEBOUNCE, PAGINATION } from '@/constants/ui';

export function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(PAGINATION.DEFAULT_PAGE_SIZE);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    per_page: PAGINATION.DEFAULT_PAGE_SIZE,
    current_page: 1,
    last_page: 0,
    from: 0,
    to: 0,
  });
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const { selectedFolderId, selectedFolder } = useFolderFilterStore();

  // Use debounce hook for search
  const debouncedSearch = useDebounce(searchTerm, DEBOUNCE.FORM_INPUT);
  const prevDebouncedSearch = useRef(debouncedSearch);

  // Reset page when search changes
  useEffect(() => {
    if (prevDebouncedSearch.current !== debouncedSearch) {
      setCurrentPage(1);
      prevDebouncedSearch.current = debouncedSearch;
    }
  }, [debouncedSearch]);

  // Reset page when folder filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFolderId]);

  // Use export hook
  const { exporting, handleExport } = useExport(
    () => exportTags('csv'),
    { resourceName: 'tags' }
  );

  // Fetch tags
  const loadTags = useCallback(async () => {
    setLoading(true);
    try {
      let result;
      if (debouncedSearch) {
        result = await searchTags({
          q: debouncedSearch,
          page: currentPage,
          per_page: pageSize,
          ...(selectedFolderId && { folder_id: selectedFolderId }),
        });
      } else {
        result = await listTags({
          page: currentPage,
          per_page: pageSize,
          ...(selectedFolderId && { folder_id: selectedFolderId }),
        });
      }
      setTags(result.tags || []);
      if (result.pagination) {
        setPagination({
          ...result.pagination,
          from: result.pagination.from || ((result.pagination.current_page - 1) * result.pagination.per_page + 1),
          to: result.pagination.to || Math.min(result.pagination.current_page * result.pagination.per_page, result.pagination.total),
        });
      }
    } catch (error) {
      console.error('Failed to load tags:', error);
      setTags([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearch, selectedFolderId]);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  const handleAddTag = () => {
    setEditingTag(null);
    setShowFormModal(true);
  };

  const handleCloseModal = () => {
    setShowFormModal(false);
    setEditingTag(null);
  };

  const handleSaveTag = async () => {
    handleCloseModal();
    await loadTags();
  };

  const getColorStyle = (color: string | null) => {
    if (!color) return {};
    return {
      backgroundColor: color,
      color: isLightColor(color) ? '#1a1a2e' : '#ffffff',
    };
  };

  const isLightColor = (color: string): boolean => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
              <TagIcon size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Tags</h1>
              <p className="text-space-300 text-sm">
                Organize and categorize your content
              </p>
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-space-700 hover:bg-space-600 rounded-lg transition-colors disabled:opacity-50"
            >
              <Download size={18} />
              <span className="hidden sm:inline">{exporting ? 'Exporting...' : 'Export'}</span>
            </button>
            <button onClick={handleAddTag} className="btn-gradient flex items-center gap-2 px-3 sm:px-4">
              <Plus size={18} />
              <span className="hidden sm:inline">Add Tag</span>
            </button>
          </div>
        </div>
      </div>

      {/* Folder Filter Indicator */}
      {selectedFolder && (
        <div className="glass-card p-4 bg-accent/10 border-accent/30">
          <div className="flex items-center gap-2 text-accent">
            <Folder size={18} />
            <span className="text-sm">
              Filtering by folder: <strong>{selectedFolder.name}</strong>
            </span>
          </div>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4">
          <div className="text-space-400 text-sm mb-1">Total Tags</div>
          <div className="text-2xl font-bold">{pagination.total}</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-space-400 text-sm mb-1">This Page</div>
          <div className="text-2xl font-bold">{tags.length}</div>
        </div>
        <div className="glass-card p-4">
          <div className="text-space-400 text-sm mb-1">Current Page</div>
          <div className="text-2xl font-bold">
            {currentPage} / {pagination.last_page || 1}
          </div>
        </div>
        <div className="glass-card p-4">
          <div className="text-space-400 text-sm mb-1">Per Page</div>
          <div className="text-2xl font-bold">{pageSize}</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="glass-card p-4">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-space-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search by name, description, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-space pl-12"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-12">
            <LoadingRocket text="Loading tags..." />
          </div>
        ) : tags.length === 0 ? (
          <div className="text-center py-12 text-space-400">
            <TagIcon size={48} className="mx-auto mb-3 opacity-50" />
            <p className="text-lg mb-2">No tags found</p>
            {debouncedSearch ? (
              <p className="text-sm">
                Try adjusting your search criteria
              </p>
            ) : (
              <p className="text-sm">
                Click "Add Tag" to create your first tag
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-space-800 border-b border-space-600">
                <tr>
                  <th className="text-left p-3 md:p-4 text-space-200 font-semibold">
                    Tag
                  </th>
                  <th className="text-left p-3 md:p-4 text-space-200 font-semibold hidden sm:table-cell">
                    Category
                  </th>
                  <th className="text-left p-3 md:p-4 text-space-200 font-semibold hidden lg:table-cell">
                    Description
                  </th>
                  <th className="text-center p-3 md:p-4 text-space-200 font-semibold hidden md:table-cell">
                    Usage
                  </th>
                  <th className="text-center p-3 md:p-4 text-space-200 font-semibold hidden md:table-cell">
                    Visibility
                  </th>
                  <th className="text-center p-3 md:p-4 text-space-200 font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {tags.map((tag, index) => (
                  <tr
                    key={tag.record_id}
                    className={`border-b border-space-700 hover:bg-space-800/50 transition-colors ${
                      index % 2 === 0 ? 'bg-space-900/20' : ''
                    }`}
                  >
                    <td className="p-3 md:p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="px-2 sm:px-3 py-1 rounded-full text-sm font-medium inline-flex items-center gap-1.5"
                          style={getColorStyle(tag.color)}
                        >
                          {tag.icon && (
                            <DynamicIcon name={tag.icon} size={14} />
                          )}
                          {tag.name}
                        </span>
                        {tag.is_system && (
                          <span className="px-2 py-0.5 bg-blue-900/50 text-blue-300 rounded text-xs">
                            System
                          </span>
                        )}
                        {/* Show category on mobile */}
                        <span className="sm:hidden text-xs text-space-400">
                          {tag.category || 'Uncategorized'}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 md:p-4 text-space-300 hidden sm:table-cell">
                      {tag.category || 'Uncategorized'}
                    </td>
                    <td className="p-3 md:p-4 text-space-300 max-w-xs truncate hidden lg:table-cell">
                      {tag.description || '-'}
                    </td>
                    <td className="p-3 md:p-4 text-center hidden md:table-cell">
                      <span className="px-2 py-1 bg-space-700 rounded text-sm">
                        {tag.usage_count}
                      </span>
                    </td>
                    <td className="p-3 md:p-4 text-center hidden md:table-cell">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          tag.is_public
                            ? 'bg-green-900/50 text-green-300'
                            : 'bg-space-700 text-space-300'
                        }`}
                      >
                        {tag.is_public ? 'Public' : 'Private'}
                      </span>
                    </td>
                    <td className="p-3 md:p-4">
                      <div className="flex items-center justify-center gap-1 sm:gap-2">
                        <Link
                          to={`/apps/tags/${tag.record_id}`}
                          className="p-2 hover:bg-space-600 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye size={18} className="text-space-300" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {!loading && tags.length > 0 && (
        <div className="glass-card p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="text-space-300 text-sm">
              <span className="hidden sm:inline">Showing {pagination.from || 1} to {pagination.to || tags.length} of </span>
              <span className="sm:hidden">{pagination.from || 1}-{pagination.to || tags.length} / </span>
              {pagination.total} <span className="hidden sm:inline">results</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 sm:px-4 py-2 bg-space-700 hover:bg-space-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-1 sm:gap-2"
              >
                <ChevronLeft size={18} />
                <span className="hidden sm:inline">Previous</span>
              </button>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(pagination.last_page, p + 1))
                }
                disabled={currentPage === pagination.last_page}
                className="px-3 sm:px-4 py-2 bg-space-700 hover:bg-space-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-1 sm:gap-2"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showFormModal && (
        <TagFormModal
          tag={editingTag}
          onClose={handleCloseModal}
          onSave={handleSaveTag}
        />
      )}
    </div>
  );
}
