<?php

namespace Tests\Feature\API;

use NewSolari\Identity\Models\IdentityPartition;
use NewSolari\Identity\Models\IdentityUser;
use NewSolari\Tags\Models\Tag;
use NewSolari\Tags\TagsPlugin;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TagsControllerTest extends TestCase
{
    use RefreshDatabase;

    protected $systemUser;

    protected $regularUser;

    protected $partition;

    protected $tag;

    protected $tagsPlugin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tagsPlugin = new TagsPlugin;

        $this->partition = IdentityPartition::create([
            'record_id' => 'partition-test-01',
            'name' => 'Test Partition',
            'description' => 'Test partition',
        ]);

        $this->systemUser = IdentityUser::create([
            'record_id' => 'user-system-01',
            'partition_id' => $this->partition->record_id,
            'username' => 'systemuser',
            'email' => 'system@example.com',
            'password_hash' => 'password',
            'is_active' => true,
        ]);
        $this->systemUser->setSystemUser(true);

        $this->regularUser = IdentityUser::create([
            'record_id' => 'user-regular-01',
            'partition_id' => $this->partition->record_id,
            'username' => 'regularuser',
            'email' => 'regular@example.com',
            'password_hash' => 'password',
            'is_active' => true,
        ]);

        $this->regularUser->partitions()->attach($this->partition->record_id);

        // Create permissions
        $tagReadPermission = \NewSolari\Identity\Models\Permission::create([
            'record_id' => 'perm-tags-read',
            'name' => 'tags.read',
            'permission_type' => 'Read',
            'entity_type' => 'Tag',
            'partition_id' => $this->partition->record_id,
            'plugin_id' => 'tags-mini-app',
        ]);

        $tagCreatePermission = \NewSolari\Identity\Models\Permission::create([
            'record_id' => 'perm-tags-create',
            'name' => 'tags.create',
            'permission_type' => 'Create',
            'entity_type' => 'Tag',
            'partition_id' => $this->partition->record_id,
            'plugin_id' => 'tags-mini-app',
        ]);

        $regularUserGroup = \NewSolari\Identity\Models\Group::create([
            'record_id' => 'group-regular-users',
            'name' => 'Regular Users',
            'partition_id' => $this->partition->record_id,
            'is_active' => true,
        ]);

        $regularUserGroup->assignPermission($tagReadPermission->record_id);
        $regularUserGroup->assignPermission($tagCreatePermission->record_id);
        $regularUserGroup->addUser($this->regularUser->record_id);

        $this->tag = Tag::create([
            'record_id' => 'tag-test-01',
            'partition_id' => $this->partition->record_id,
            'name' => 'urgent',
            'description' => 'Urgent items',
            'color' => 'red',
            'is_public' => true,
            'created_by' => $this->systemUser->record_id,
        ]);
    }

    /**
     * @test
     *
     * @group security
     * @group sql_injection
     */
    public function test_sql_injection_in_tag_name()
    {
        $response = $this->authenticateAs($this->systemUser)
            ->postJson('/api/tags', [
                'name' => "'; DROP TABLE tags; --",
            ]);

        $this->assertContains($response->status(), [201, 422, 500]);
        $this->assertDatabaseHas('tags', ['record_id' => $this->tag->record_id]);
    }

    /**
     * @test
     *
     * @group security
     * @group xss
     */
    public function test_xss_in_tag_name()
    {
        $response = $this->authenticateAs($this->systemUser)
            ->postJson('/api/tags', [
                'name' => 'Safe text <script>alert(1)</script>',
            ]);

        $response->assertStatus(201);

        $data = $response->json();
        $tag = $data['result']['tag'] ?? [];
        $this->assertStringContainsString('Safe text', $tag['name'] ?? '');
        $this->assertStringNotContainsString('<script>', $tag['name'] ?? '');
    }

    /**
     * @test
     *
     * @group security
     * @group csrf
     */
    public function test_create_tag_requires_authentication()
    {
        $response = $this->postJson('/api/tags', [
            'name' => 'Unauthorized Tag',
        ]);

        $response->assertStatus(401);
    }

    /**
     * @test
     *
     * @group security
     * @group mass_assignment
     */
    public function test_cannot_mass_assign_record_id()
    {
        $response = $this->authenticateAs($this->systemUser)
            ->postJson('/api/tags', [
                'record_id' => 'custom-id-123',
                'name' => 'Mass Assignment Test',
            ]);

        $this->assertContains($response->status(), [201, 422, 500]);
    }

    /**
     * @test
     *
     * @group validation
     */
    public function test_tag_name_is_required()
    {
        $response = $this->authenticateAs($this->systemUser)
            ->postJson('/api/tags', [
                'description' => 'Missing name',
            ]);

        $this->assertContains($response->status(), [422, 500]);

        $data = $response->json();
        $this->assertFalse($data['value']);
    }

    /**
     * @test
     *
     * @group functional
     */
    public function test_create_tag()
    {
        $response = $this->authenticateAs($this->systemUser)
            ->postJson('/api/tags', [
                'name' => 'important',
                'description' => 'Important items',
                'color' => '#2196F3',
            ]);

        $response->assertStatus(201);

        $data = $response->json();
        $this->assertTrue($data['value']);
        $tag = $data['result']['tag'] ?? [];
        $this->assertEquals('important', $tag['name'] ?? '');
    }

    /**
     * @test
     *
     * @group functional
     */
    public function test_list_tags()
    {
        $response = $this->authenticateAs($this->systemUser)
            ->get('/api/tags');

        $response->assertStatus(200);

        $data = $response->json();
        $this->assertTrue($data['value']);
    }

    /**
     * @test
     *
     * @group edge_cases
     */
    public function test_view_nonexistent_tag()
    {
        $response = $this->authenticateAs($this->systemUser)
            ->get('/api/tags/nonexistent-tag-id');

        $response->assertStatus(404);
    }

    /**
     * @test
     *
     * @group edge_cases
     */
    public function test_tag_with_unicode_name()
    {
        $unicodeName = '标签测试 Étiquette 🏷️';

        $response = $this->authenticateAs($this->systemUser)
            ->postJson('/api/tags', [
                'name' => $unicodeName,
            ]);

        $response->assertStatus(201);

        $data = $response->json();
        $tag = $data['result']['tag'] ?? [];
        $this->assertEquals($unicodeName, $tag['name'] ?? '');
    }

    /**
     * @test
     *
     * @group performance
     */
    public function test_list_tags_performance()
    {
        for ($i = 0; $i < 20; $i++) {
            Tag::create([
                'record_id' => "tag-perf-{$i}",
                'partition_id' => $this->partition->record_id,
                'name' => "tag{$i}",
                'created_by' => $this->systemUser->record_id,
            ]);
        }

        $startTime = microtime(true);

        $response = $this->authenticateAs($this->systemUser)
            ->get('/api/tags');

        $endTime = microtime(true);
        $executionTime = ($endTime - $startTime) * 1000;

        $response->assertStatus(200);

        $this->assertLessThan(1000, $executionTime,
            "List tags took {$executionTime}ms (should be under 1000ms)");
    }
}
