<?php

namespace NewSolari\Tags\Controllers;

use NewSolari\Core\Http\BaseController;
use NewSolari\Core\Http\Traits\MiniAppControllerTrait;
use NewSolari\Tags\Requests\StoreTagRequest;
use NewSolari\Tags\Requests\UpdateTagRequest;
use NewSolari\Tags\TagsPlugin;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TagsController extends BaseController
{
    use MiniAppControllerTrait;

    /**
     * The Tags plugin instance.
     *
     * @var TagsPlugin|null
     */
    protected $tagsPlugin;

    /**
     * Get the Tags plugin instance.
     */
    protected function getTagsPlugin(): TagsPlugin
    {
        if (! $this->tagsPlugin) {
            $this->tagsPlugin = new TagsPlugin;
        }

        return $this->tagsPlugin;
    }

    protected function getRelations(): array
    {
        return [];
    }

    public function index(Request $request): JsonResponse
    {
        return $this->indexWithPlugin(
            $request,
            $this->getTagsPlugin(),
            'getTagsQuery',
            'read'
        );
    }

    public function store(StoreTagRequest $request): JsonResponse
    {
        return $this->storeWithPlugin(
            $request,
            $this->getTagsPlugin(),
            'createTagWithRelations',
            'create'
        );
    }

    public function show(Request $request, string $id): JsonResponse
    {
        return $this->showWithPlugin(
            $request,
            $id,
            $this->getTagsPlugin(),
            'read'
        );
    }

    public function update(UpdateTagRequest $request, string $id): JsonResponse
    {
        return $this->updateWithPlugin(
            $request,
            $id,
            $this->getTagsPlugin(),
            'updateDataItem',
            'update'
        );
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        return $this->destroyWithPlugin(
            $request,
            $id,
            $this->getTagsPlugin(),
            'delete'
        );
    }

    public function search(Request $request): JsonResponse
    {
        return $this->searchWithPlugin(
            $request,
            $this->getTagsPlugin(),
            'getTagsQuery',
            'read'
        );
    }

    public function export(Request $request): JsonResponse
    {
        return $this->exportWithPlugin(
            $request,
            $this->getTagsPlugin(),
            'exportTags',
            'export'
        );
    }

    public function statistics(Request $request): JsonResponse
    {
        return $this->statisticsWithPlugin(
            $request,
            $this->getTagsPlugin(),
            'read'
        );
    }
}
