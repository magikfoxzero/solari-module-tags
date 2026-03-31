<?php

namespace NewSolari\Tags\Models;

use NewSolari\Core\Entity\BaseEntity;
use NewSolari\Core\Entity\Traits\HasUnifiedRelationships;
use NewSolari\Core\Entity\Traits\HasSourcePlugin;
use NewSolari\Core\Entity\Traits\Shareable;

class Tag extends BaseEntity
{
    use HasUnifiedRelationships;
    use HasSourcePlugin;
    use Shareable;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'tags';

    /**
     * The attributes that are mass assignable.
     *
     * @var array
     */
    protected $fillable = [
        'record_id',
        'partition_id',
        'name',
        'description',
        'color',
        'icon',
        'category',
        'is_public',
        'is_system',
        'usage_count',
        'created_by',
        'updated_by',
        'source_plugin',
        'source_record_id',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array
     */
    protected $casts = [
        'record_id' => 'string',
        'name' => 'string',
        'description' => 'string',
        'color' => 'string',
        'icon' => 'string',
        'category' => 'string',
        'is_public' => 'boolean',
        'is_system' => 'boolean',
        'usage_count' => 'integer',
        'partition_id' => 'string',
        'created_by' => 'string',
        'updated_by' => 'string',
    ];

    protected $validations = [
        'record_id' => 'nullable|string|max:36',
        'partition_id' => 'sometimes|string|max:36|exists:identity_partitions,record_id',
        'name' => 'required|string|max:100',
        'description' => 'nullable|string|max:500',
        'color' => 'nullable|string|max:20',
        'icon' => 'nullable|string|max:50',
        'category' => 'nullable|string|max:100',
        'is_public' => 'boolean',
        'is_system' => 'boolean',
        'usage_count' => 'nullable|integer|min:0',
        'created_by' => 'sometimes|string|max:36|exists:identity_users,record_id',
        'updated_by' => 'nullable|string|max:36|exists:identity_users,record_id',
        'source_plugin' => 'nullable|string|max:64',
        'source_record_id' => 'nullable|string|max:36',
    ];

    /**
     * Get the tag with styling information.
     */
    public function getStyledTagAttribute(): array
    {
        return [
            'name' => $this->name,
            'description' => $this->description,
            'color' => $this->color ?? '#6b7280',
            'icon' => $this->icon ?? 'tag',
            'category' => $this->category,
            'usage_count' => $this->usage_count,
            'style' => 'background-color: '.($this->color ?? '#6b7280').'; color: white; padding: 4px 12px; border-radius: 6px; display: inline-flex; align-items: center; gap: 6px;',
            'is_public' => $this->is_public,
            'is_system' => $this->is_system,
        ];
    }

    /**
     * Get the tag's popularity level.
     */
    public function getPopularityLevelAttribute(): string
    {
        if ($this->usage_count >= 100) {
            return 'very_popular';
        } elseif ($this->usage_count >= 50) {
            return 'popular';
        } elseif ($this->usage_count >= 10) {
            return 'moderate';
        } elseif ($this->usage_count > 0) {
            return 'used';
        } else {
            return 'new';
        }
    }

    /**
     * Get the tag's type.
     */
    public function getTagTypeAttribute(): string
    {
        if ($this->is_system) {
            return 'system';
        } elseif ($this->is_public) {
            return 'public';
        } else {
            return 'private';
        }
    }

    /**
     * Get the tag's display name with category.
     */
    public function getDisplayNameAttribute(): string
    {
        if ($this->category) {
            return $this->name.' ('.$this->category.')';
        }

        return $this->name;
    }
}
