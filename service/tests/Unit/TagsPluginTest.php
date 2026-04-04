<?php

namespace Tests\Unit\Plugins\Apps\MiniApps;

use NewSolari\Core\Identity\Models\IdentityPartition;
use NewSolari\Core\Identity\Models\IdentityUser;
use NewSolari\Tags\Models\Tag;
use NewSolari\Tags\TagsPlugin;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TagsPluginTest extends TestCase
{
    use RefreshDatabase;

    protected $plugin;

    protected $user;

    protected $partition;

    protected function setUp(): void
    {
        parent::setUp();

        $this->plugin = new TagsPlugin;

        $this->partition = IdentityPartition::create([
            'record_id' => 'tags-test-partition',
            'name' => 'Tags Test Partition',
            'description' => 'Test partition for tags plugin',
        ]);

        $this->user = IdentityUser::create([
            'record_id' => 'tags-test-user',
            'username' => 'tagstestuser',
            'email' => 'tagstest@example.com',
            'password_hash' => 'password',
            'partition_id' => $this->partition->record_id,
            'is_active' => true,
        ]);
        $this->user->setSystemUser(true);
    }

    /** @test */
    public function it_can_get_plugin_metadata()
    {
        $this->assertEquals('tags-mini-app', $this->plugin->getId());
        $this->assertEquals('Tags', $this->plugin->getName());
        $this->assertNotEmpty($this->plugin->getDescription());
    }

    /** @test */
    public function it_can_get_data_model()
    {
        $model = $this->plugin->getDataModel();
        $this->assertEquals(Tag::class, $model);
    }

    /** @test */
    public function it_can_get_validation_rules()
    {
        $rules = $this->plugin->getValidationRules();
        $this->assertIsArray($rules);
        $this->assertArrayHasKey('name', $rules);
        $this->assertArrayHasKey('is_public', $rules);
    }

    /** @test */
    public function it_can_create_a_tag_with_relations()
    {
        $tagData = [
            'name' => 'Test Tag',
            'description' => 'Test description',
            'color' => '#FF0000',
            'is_public' => false,
        ];

        $tag = $this->plugin->createTagWithRelations($tagData, $this->user);

        $this->assertInstanceOf(Tag::class, $tag);
        $this->assertEquals('Test Tag', $tag->name);
        $this->assertEquals($this->user->record_id, $tag->created_by);
    }

    /** @test */
    public function it_validates_required_fields_when_creating_tag()
    {
        $this->expectException(\Exception::class);

        $invalidData = [
            'description' => 'Missing name',
        ];

        $this->plugin->createTagWithRelations($invalidData, $this->user);
    }

    /** @test */
    public function it_can_get_tags_query()
    {
        $query = $this->plugin->getTagsQuery($this->user);
        $this->assertInstanceOf(\Illuminate\Database\Eloquent\Builder::class, $query);
    }

    /** @test */
    public function it_can_apply_search_filter()
    {
        $query = Tag::query();
        $this->plugin->applySearchFilter($query, 'test');

        $sql = $query->toSql();
        $this->assertStringContainsString('name', $sql);
        $this->assertStringContainsString('LIKE', $sql);
    }

    /** @test */
    public function it_can_export_tags_data()
    {
        Tag::create([
            'record_id' => (string) \Str::uuid(),
            'name' => 'Export Test Tag',
            'partition_id' => $this->partition->record_id,
            'created_by' => $this->user->record_id,
            'is_public' => true,
        ]);

        $exportData = $this->plugin->exportTags($this->user, [], 'json');

        $this->assertIsArray($exportData);
        $this->assertEquals('json', $exportData['format']);
        $this->assertIsArray($exportData['data']);
    }

    /** @test */
    public function it_can_get_statistics()
    {
        Tag::create([
            'record_id' => (string) \Str::uuid(),
            'name' => 'Stats Test Tag',
            'partition_id' => $this->partition->record_id,
            'created_by' => $this->user->record_id,
            'is_public' => false,
            'is_system' => false,
            'usage_count' => 5,
        ]);

        $stats = $this->plugin->getStatistics($this->user);

        $this->assertIsArray($stats);
        $this->assertArrayHasKey('total_tags', $stats);
        $this->assertArrayHasKey('public_tags', $stats);
        $this->assertArrayHasKey('system_tags', $stats);
        $this->assertArrayHasKey('total_usage', $stats);
    }

    /** @test */
    public function it_can_increment_usage_count()
    {
        $tag = Tag::create([
            'record_id' => (string) \Str::uuid(),
            'name' => 'Usage Test',
            'partition_id' => $this->partition->record_id,
            'created_by' => $this->user->record_id,
            'usage_count' => 0,
        ]);

        $result = $this->plugin->incrementUsageCount($tag);
        $this->assertTrue($result);

        $tag->refresh();
        $this->assertEquals(1, $tag->usage_count);
    }

    /** @test */
    public function it_can_decrement_usage_count()
    {
        $tag = Tag::create([
            'record_id' => (string) \Str::uuid(),
            'name' => 'Usage Test',
            'partition_id' => $this->partition->record_id,
            'created_by' => $this->user->record_id,
            'usage_count' => 5,
        ]);

        $result = $this->plugin->decrementUsageCount($tag);
        $this->assertTrue($result);

        $tag->refresh();
        $this->assertEquals(4, $tag->usage_count);
    }
}
