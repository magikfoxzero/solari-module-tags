import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { DynamicIcon, getAvailableIcons } from '@/components/common/DynamicIcon';
import { createTag, updateTag } from '../api';
import { addItemToFolder } from '@/modules/folders/api';
import { useFolderFilterStore } from '@/store/folderFilterStore';
import type { Tag, TagCreateInput } from '@/types/models';
import { toast } from '@/store/toastStore';

interface TagFormModalProps {
  tag: Tag | null;
  onClose: () => void;
  onSave: (tag: TagCreateInput, createdTag?: Tag) => Promise<void>;
  sourcePlugin?: string; // Set when creating from a meta-app (e.g., 'investigations-meta-app')
  sourceRecordId?: string; // The source container record ID for cascade delete
}

interface FormErrors {
  name?: string;
  color?: string;
}

const PRESET_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#6b7280', // gray
  '#9C27B0', // purple (default)
];

const CATEGORY_OPTIONS = [
  'Priority',
  'Status',
  'Type',
  'Department',
  'Project',
  'Location',
  'Custom',
];

export function TagFormModal({ tag, onClose, onSave, sourcePlugin, sourceRecordId }: TagFormModalProps) {
  const { selectedFolderId } = useFolderFilterStore();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#9C27B0',
    icon: '',
    category: '',
    is_public: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tag) {
      setFormData({
        name: tag.name || '',
        description: tag.description || '',
        color: tag.color || '#9C27B0',
        icon: tag.icon || '',
        category: tag.category || '',
        is_public: tag.is_public || false,
      });
    }
  }, [tag]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Tag name is required';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Tag name must be 100 characters or less';
    }

    if (formData.color && !/^#([0-9A-F]{3}){1,2}$/i.test(formData.color)) {
      newErrors.color = 'Invalid color format (use hex like #ff5733)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const tagData: TagCreateInput = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        color: formData.color || undefined,
        icon: formData.icon.trim() || undefined,
        category: formData.category || undefined,
        is_public: formData.is_public,
        ...(sourcePlugin && { source_plugin: sourcePlugin }),
        ...(sourceRecordId && { source_record_id: sourceRecordId }),
      };

      let createdTagResult: Tag | undefined;

      if (tag) {
        await updateTag(tag.record_id, tagData);
      } else {
        createdTagResult = await createTag(tagData);

        // If a folder filter is active, automatically add the new tag to that folder
        if (selectedFolderId && createdTagResult?.record_id) {
          try {
            await addItemToFolder(selectedFolderId, {
              target_id: createdTagResult.record_id,
              target_type: 'tag',
              relationship_type: 'contains',
            });
          } catch (folderError) {
            console.warn('Failed to add tag to folder:', folderError);
            toast.warning('Tag Created', 'Tag was created but could not be added to the folder');
          }
        }
      }

      await onSave(tagData, createdTagResult);
    } catch (err: unknown) {
      console.error('Failed to save tag:', err);
      // Extract error message from API response if available
      let errorMessage = 'Failed to save tag. Please try again.';
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { result?: string; message?: string } } };
        if (axiosError.response?.data?.result) {
          errorMessage = axiosError.response.data.result;
        } else if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      }
      toast.error('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="glass-card p-6 max-w-lg w-full my-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            {tag ? 'Edit Tag' : 'Create New Tag'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-space-700 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tag Name */}
          <div>
            <label className="block text-space-300 text-sm mb-2">
              Tag Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className={`input-space ${errors.name ? 'border-red-500' : ''}`}
              placeholder="e.g., Important, Urgent, Review"
              maxLength={100}
            />
            {errors.name && (
              <p className="text-red-400 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-space-300 text-sm mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="input-space min-h-[80px] resize-y"
              placeholder="Brief description of what this tag represents..."
              maxLength={500}
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-space-300 text-sm mb-2">Color</label>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-8 h-8 rounded-full transition-all ${
                      formData.color === color
                        ? 'ring-2 ring-white ring-offset-2 ring-offset-space-800 scale-110'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={formData.color}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
                className={`input-space flex-1 ${errors.color ? 'border-red-500' : ''}`}
                placeholder="#9C27B0"
              />
              <div
                className="w-10 h-10 rounded-lg border border-space-600"
                style={{ backgroundColor: formData.color }}
              />
            </div>
            {errors.color && (
              <p className="text-red-400 text-sm mt-1">{errors.color}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-space-300 text-sm mb-2">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="select-space"
            >
              <option value="">Select a category...</option>
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Icon */}
          <div>
            <label className="block text-space-300 text-sm mb-2">
              Icon (optional)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={formData.icon}
                onChange={(e) =>
                  setFormData({ ...formData, icon: e.target.value })
                }
                className="input-space flex-1"
                placeholder="e.g., star, flag, bookmark"
                maxLength={50}
                list="icon-suggestions"
              />
              <datalist id="icon-suggestions">
                {getAvailableIcons().slice(0, 50).map((iconName) => (
                  <option key={iconName} value={iconName} />
                ))}
              </datalist>
              {formData.icon && (
                <div className="w-10 h-10 rounded-lg bg-space-700 flex items-center justify-center">
                  <DynamicIcon name={formData.icon} size={20} />
                </div>
              )}
            </div>
            <p className="text-space-500 text-xs mt-1">
              Examples: star, flag, bookmark, heart, check, clock, target, bell, calendar
            </p>
          </div>

          {/* Public Toggle */}
          <div className="flex items-center gap-3">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_public}
                onChange={(e) =>
                  setFormData({ ...formData, is_public: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-space-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
            <span className="text-space-200">Make this tag public</span>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-space-300 text-sm mb-2">Preview</label>
            <div className="p-4 bg-space-800 rounded-lg">
              <span
                className="px-3 py-1 rounded-full text-sm font-medium inline-flex items-center gap-1.5"
                style={{
                  backgroundColor: formData.color || '#9C27B0',
                  color: isLightColor(formData.color || '#9C27B0')
                    ? '#1a1a2e'
                    : '#ffffff',
                }}
              >
                {formData.icon && (
                  <DynamicIcon name={formData.icon} size={14} />
                )}
                {formData.name || 'Tag Name'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t border-space-700">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-6 py-2 bg-space-700 hover:bg-space-600 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-gradient px-6 py-2 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <span className="animate-spin">...</span>
                  Saving...
                </>
              ) : (
                <>{tag ? 'Update Tag' : 'Create Tag'}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function isLightColor(color: string): boolean {
  const hex = color.replace('#', '');
  if (hex.length !== 6) return false;
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128;
}
