<?php

namespace NewSolari\Tags\Requests;

use NewSolari\Core\Http\Requests\BaseApiFormRequest;

/**
 * Form Request for creating a Tag
 *
 * @bodyParam name string required The tag name. Example: Important
 * @bodyParam description string A description of the tag. Example: Items marked as high priority
 * @bodyParam color string The tag color (hex or named). Example: #ff5733
 * @bodyParam icon string An icon identifier for the tag. Example: star
 * @bodyParam category string The tag category. Example: Priority
 * @bodyParam is_public boolean Whether this tag is publicly visible. Example: true
 */
class StoreTagRequest extends BaseApiFormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:100',
            'description' => 'nullable|string|max:500',
            'color' => ['nullable', 'string', 'max:20', 'regex:/^#([0-9A-Fa-f]{3}){1,2}$|^#[0-9A-Fa-f]{8}$/'],
            'icon' => 'nullable|string|max:50',
            'category' => 'nullable|string|max:100',
            'is_public' => 'boolean',
            // Source tracking for meta-app created entities
            'source_plugin' => 'nullable|string|max:64',
            'source_record_id' => 'nullable|string|max:36',
        ];
    }
}
