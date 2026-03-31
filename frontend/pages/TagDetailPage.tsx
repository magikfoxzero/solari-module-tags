import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { LoadingRocket } from '@/components/common/LoadingRocket';
import { DynamicIcon } from '@/components/common/DynamicIcon';
import { TagFormModal } from './TagFormModal';
import { getTag, deleteTag } from '../api';
import type { Tag } from '@/types/models';
import { toast } from '@/store/toastStore';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Tag as TagIcon,
  Folder,
  Eye,
  EyeOff,
  BarChart3,
  Calendar,
  Shield,
} from 'lucide-react';
import { ShareButton } from '@/components/common';

export function TagDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tag, setTag] = useState<Tag | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const loadTag = async () => {
      if (!id) return;

      setLoading(true);
      setError(null);
      try {
        const data = await getTag(id);
        setTag(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tag');
      } finally {
        setLoading(false);
      }
    };

    loadTag();
  }, [id]);

  const handleEdit = () => {
    setShowFormModal(true);
  };

  const handleSaveTag = async () => {
    setShowFormModal(false);
    if (id) {
      const data = await getTag(id);
      setTag(data);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    setDeleting(true);
    try {
      await deleteTag(id);
      navigate('/apps/tags');
    } catch {
      toast.error('Error', 'Failed to delete tag');
      setDeleting(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
    if (hex.length !== 6) return false;
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128;
  };

  const getPopularityLevel = (usageCount: number): { label: string; color: string } => {
    if (usageCount >= 100) return { label: 'Very Popular', color: 'text-green-400' };
    if (usageCount >= 50) return { label: 'Popular', color: 'text-blue-400' };
    if (usageCount >= 10) return { label: 'Moderate', color: 'text-yellow-400' };
    if (usageCount > 0) return { label: 'Used', color: 'text-space-300' };
    return { label: 'New', color: 'text-space-500' };
  };

  if (loading) {
    return (
      <div className="glass-card p-12">
        <LoadingRocket text="Loading tag details..." />
      </div>
    );
  }

  if (error || !tag) {
    return (
      <div className="glass-card p-8 text-center">
        <TagIcon size={48} className="mx-auto mb-3 opacity-50" />
        <h2 className="text-xl font-bold mb-2">Error</h2>
        <p className="text-space-300 mb-6">{error || 'Tag not found'}</p>
        <Link to="/apps/tags" className="btn-gradient inline-flex items-center gap-2">
          <ArrowLeft size={18} />
          Back to Tags
        </Link>
      </div>
    );
  }

  const popularity = getPopularityLevel(tag.usage_count);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Link
              to="/apps/tags"
              className="p-2 hover:bg-space-700 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} />
            </Link>
            <div className="flex items-center gap-3">
              <span
                className="px-4 py-2 rounded-full text-lg font-medium inline-flex items-center gap-2"
                style={getColorStyle(tag.color)}
              >
                {tag.icon && (
                  <DynamicIcon name={tag.icon} size={18} />
                )}
                {tag.name}
              </span>
              {tag.is_system && (
                <span className="px-2 py-1 bg-blue-900/50 text-blue-300 rounded text-xs flex items-center gap-1">
                  <Shield size={12} />
                  System
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <ShareButton entityType="tag" entityId={tag.record_id} entityName={tag.name} />
            {!tag.is_system && (
              <>
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-2 px-4 py-2 bg-space-700 hover:bg-space-600 rounded-lg transition-colors"
                >
                  <Edit size={18} />
                  Edit
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-900/50 hover:bg-red-800/50 text-red-200 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tag Information */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TagIcon size={20} />
              Tag Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-space-400 text-sm block mb-1">
                  Name
                </label>
                <p className="text-space-100">{tag.name}</p>
              </div>
              <div>
                <label className="text-space-400 text-sm block mb-1 flex items-center gap-1">
                  <Folder size={14} />
                  Category
                </label>
                <p className="text-space-100">{tag.category || 'Uncategorized'}</p>
              </div>
              <div>
                <label className="text-space-400 text-sm block mb-1">
                  Color
                </label>
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-full border border-space-600"
                    style={{ backgroundColor: tag.color || '#9C27B0' }}
                  />
                  <span className="text-space-100 font-mono text-sm">
                    {tag.color || '#9C27B0'}
                  </span>
                </div>
              </div>
              {tag.icon && (
                <div>
                  <label className="text-space-400 text-sm block mb-1">
                    Icon
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-space-700 rounded-lg flex items-center justify-center">
                      <DynamicIcon name={tag.icon} size={18} />
                    </div>
                    <span className="text-space-100">{tag.icon}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {tag.description && (
            <div className="glass-card p-6">
              <h2 className="text-lg font-semibold mb-4">Description</h2>
              <p className="text-space-200 whitespace-pre-wrap">{tag.description}</p>
            </div>
          )}

          {/* Usage Statistics */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 size={20} />
              Usage Statistics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-space-800 rounded-lg">
                <div className="text-space-400 text-sm mb-1">Total Usage</div>
                <div className="text-3xl font-bold">{tag.usage_count}</div>
              </div>
              <div className="p-4 bg-space-800 rounded-lg">
                <div className="text-space-400 text-sm mb-1">Popularity</div>
                <div className={`text-xl font-bold ${popularity.color}`}>
                  {popularity.label}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Metadata */}
        <div className="space-y-6">
          {/* Visibility */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4">Visibility</h2>
            <div className="flex items-center gap-2">
              {tag.is_public ? (
                <>
                  <Eye size={20} className="text-green-400" />
                  <span className="text-green-400">Public</span>
                </>
              ) : (
                <>
                  <EyeOff size={20} className="text-space-400" />
                  <span className="text-space-300">Private</span>
                </>
              )}
            </div>
            <p className="text-space-500 text-sm mt-2">
              {tag.is_public
                ? 'This tag is visible to all users in the partition.'
                : 'This tag is only visible to you.'}
            </p>
          </div>

          {/* Metadata */}
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar size={20} />
              Metadata
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-space-400 text-sm block mb-1">
                  Tag ID
                </label>
                <p className="text-space-100 font-mono text-sm break-all">
                  {tag.record_id}
                </p>
              </div>
              <div>
                <label className="text-space-400 text-sm block mb-1">
                  Created At
                </label>
                <p className="text-space-100 text-sm">
                  {formatDateTime(tag.created_at)}
                </p>
              </div>
              <div>
                <label className="text-space-400 text-sm block mb-1">
                  Last Updated
                </label>
                <p className="text-space-100 text-sm">
                  {formatDateTime(tag.updated_at)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Confirm Deletion</h3>
            <p className="text-space-300 mb-6">
              Are you sure you want to delete the tag "{tag.name}"? This action
              cannot be undone and may affect items using this tag.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-4 py-2 bg-space-700 hover:bg-space-600 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-900/50 hover:bg-red-800/50 text-red-200 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <span className="animate-spin">...</span>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={18} />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showFormModal && (
        <TagFormModal
          tag={tag}
          onClose={() => setShowFormModal(false)}
          onSave={handleSaveTag}
        />
      )}
    </div>
  );
}
