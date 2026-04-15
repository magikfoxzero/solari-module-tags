<?php

namespace NewSolari\Tags;

use NewSolari\Core\Contracts\IdentityUserContract;
use NewSolari\Core\Plugin\MiniAppBase;
use Illuminate\Support\Facades\Log;

class TagsPlugin extends MiniAppBase
{
    /**
     * TagsPlugin constructor
     */
    public function __construct()
    {
        parent::__construct();

        $this->pluginId = 'tags-mini-app';
        $this->pluginName = 'Tags';
        $this->description = 'Manages tags for categorization and organization';
        $this->version = '1.0.0';

        $this->permissions = [
            'tags.create',
            'tags.read',
            'tags.update',
            'tags.delete',
            'tags.manage',
            'tags.export',
        ];

        $this->routes = [
            '/api/tags',
            '/api/tags/{id}',
            '/api/tags/search',
            '/api/tags/export',
        ];

        $this->database = [
            'migrations' => [
                'create_tags_table',
            ],
            'models' => [
                'Tag',
            ],
        ];
    }

    /**
     * Get the data model class
     */
    public function getDataModel(): string
    {
        return \NewSolari\Tags\Models\Tag::class;
    }

    /**
     * Get data validation rules
     */
    public function getValidationRules(): array
    {
        return [
            'record_id' => 'sometimes|string|max:36',
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:255',
            'color' => 'nullable|string|max:20',
            'icon' => 'nullable|string|max:50',
            'category' => 'nullable|string|max:100',
            'is_public' => 'boolean',
            'is_system' => 'boolean',
            'usage_count' => 'nullable|integer|min:0',
            'partition_id' => 'sometimes|string|max:36|exists:identity_partitions,record_id',
            'created_by' => 'sometimes|string|max:36|exists:identity_users,record_id',
            'updated_by' => 'nullable|string|max:36|exists:identity_users,record_id',
            'source_plugin' => 'nullable|string|max:100',
            'source_record_id' => 'nullable|string|max:36',
        ];
    }

    /**
     * Apply search filter to query
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     */
    public function applySearchFilter($query, string $searchTerm): void
    {
        $escaped = $this->escapeLikePattern($searchTerm);
        $query->where(function ($q) use ($escaped) {
            $q->where('name', 'LIKE', '%'.$escaped.'%')
                ->orWhere('description', 'LIKE', '%'.$escaped.'%')
                ->orWhere('category', 'LIKE', '%'.$escaped.'%')
                ->orWhere('color', 'LIKE', '%'.$escaped.'%')
                ->orWhere('icon', 'LIKE', '%'.$escaped.'%');
        });
    }

    /**
     * Get tags with additional related data
     *
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function getTagsQuery(IdentityUserContract $user, array $filters = [], bool $withRelations = false)
    {
        $query = $this->getDataQuery($user, $filters);

        // Default sorting
        $query->orderBy('name');

        return $query;
    }

    /**
     * Create a tag
     *
     * @return \NewSolari\Tags\Models\Tag
     *
     * @throws \Exception
     */
    public function createTagWithRelations(array $data, IdentityUserContract $user): \NewSolari\Tags\Models\Tag
    {
        try {
            // Create the tag
            $tagData = [
                'record_id' => (string) \Illuminate\Support\Str::uuid(),
                'name' => $data['name'],
                'description' => $data['description'] ?? null,
                'color' => $data['color'] ?? null,
                'icon' => $data['icon'] ?? null,
                'category' => $data['category'] ?? null,
                'is_public' => $data['is_public'] ?? false,
                'is_system' => $data['is_system'] ?? false,
                'usage_count' => $data['usage_count'] ?? 0,
                'partition_id' => $user->partition_id,
                'created_by' => $user->record_id,
                'source_plugin' => $data['source_plugin'] ?? null,
                'source_record_id' => $data['source_record_id'] ?? null,
            ];

            $tag = $this->createDataItem($tagData, $user);

            return $tag;

        } catch (\Exception $e) {
            Log::error('Failed to create tag', [
                'error' => $e->getMessage(),
                'user_id' => $user->record_id,
            ]);
            throw $e;
        }
    }

    /**
     * Export tags data
     */
    public function exportTags(IdentityUserContract $user, array $filters = [], string $format = 'json'): array
    {
        // Check export permission
        if (! $this->checkUserPermission($user, 'tags.export')) {
            throw new \Exception('Permission denied: cannot export tags data');
        }

        $query = $this->getTagsQuery($user, $filters);
        $tags = $query->get();

        switch ($format) {
            case 'json':
                return [
                    'format' => 'json',
                    'data' => $tags->toArray(),
                ];

            case 'csv':
                $csvData = $this->convertToCsv($tags);

                return [
                    'format' => 'csv',
                    'data' => $csvData,
                ];

            default:
                throw new \Exception('Unsupported export format: '.$format);
        }
    }

    /**
     * Convert tags data to CSV format
     *
     * @param  \Illuminate\Support\Collection  $tags
     */
    protected function convertToCsv($tags): string
    {
        // Use PHP's built-in CSV generation
        $output = fopen('php://temp', 'r+');
        fputcsv($output, [
            'ID', 'Name', 'Description', 'Color', 'Icon', 'Category',
            'Is Public', 'Is System', 'Usage Count', 'Created At', 'Updated At',
        ]);

        foreach ($tags as $tag) {
            fputcsv($output, [
                $tag->record_id ?? '',
                $tag->name ?? '',
                $tag->description ?? '',
                $tag->color ?? '',
                $tag->icon ?? '',
                $tag->category ?? '',
                ($tag->is_public ?? false) ? 'Yes' : 'No',
                ($tag->is_system ?? false) ? 'Yes' : 'No',
                $tag->usage_count ?? 0,
                $tag->created_at ?? '',
                $tag->updated_at ?? '',
            ]);
        }

        rewind($output);
        $csvContent = stream_get_contents($output);
        fclose($output);

        return $csvContent;
    }

    /**
     * Get tags statistics
     */
    public function getStatistics(IdentityUserContract $user): array
    {
        $query = $this->getDataQuery($user);
        $tags = $query->get();

        return [
            'total_tags' => $tags->count(),
            'public_tags' => $tags->where('is_public', true)->count(),
            'private_tags' => $tags->where('is_public', false)->count(),
            'system_tags' => $tags->where('is_system', true)->count(),
            'user_tags' => $tags->where('is_system', false)->count(),
            'by_category' => $tags->groupBy('category')->map->count()->toArray(),
            'total_usage' => $tags->sum('usage_count'),
            'most_used_tags' => $tags->sortByDesc('usage_count')->take(10)->values()->toArray(),
        ];
    }

    /**
     * Increment tag usage count
     *
     * @param  \NewSolari\Tags\Models\Tag  $tag
     */
    public function incrementUsageCount($tag, int $incrementBy = 1): bool
    {
        try {
            $tag->usage_count += $incrementBy;

            return $tag->save();
        } catch (\Exception $e) {
            Log::error('Failed to increment tag usage count', [
                'tag_id' => $tag->record_id,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Decrement tag usage count
     *
     * @param  \NewSolari\Tags\Models\Tag  $tag
     */
    public function decrementUsageCount($tag, int $decrementBy = 1): bool
    {
        try {
            $tag->usage_count = max(0, $tag->usage_count - $decrementBy);

            return $tag->save();
        } catch (\Exception $e) {
            Log::error('Failed to decrement tag usage count', [
                'tag_id' => $tag->record_id,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }
}
