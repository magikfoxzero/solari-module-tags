<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration for TAGS module tables.
 * Auto-generated from schema dump.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::disableForeignKeyConstraints();

        if (!Schema::hasTable('tags')) {
            Schema::create('tags', function (Blueprint $table) {
                $table->string('record_id', 36)->primary();
                $table->string('name');
                $table->string('description')->nullable();
                $table->string('color')->nullable();
                $table->string('icon')->nullable();
                $table->string('category')->nullable();
                $table->boolean('is_public')->default(false);
                $table->boolean('is_system')->default(false);
                $table->unsignedInteger('usage_count')->default(0);
                $table->string('partition_id', 36);
                $table->string('source_plugin', 64)->nullable();
                $table->string('source_record_id', 36)->nullable();
                $table->string('created_by', 36);
                $table->string('updated_by', 36)->nullable();
                $table->timestamp('deleted_at')->nullable();
                $table->string('deleted_by', 36)->nullable();
                $table->boolean('deleted')->default(false);
                $table->timestamps();
                $table->unique(['name', 'partition_id'], 'tags_name_partition_id_unique');
                $table->index('created_by', 'tags_created_by_foreign');
                $table->index(['partition_id', 'name'], 'tags_partition_id_name_index');
                $table->index(['partition_id', 'category'], 'tags_partition_id_category_index');
                $table->index(['partition_id', 'is_public'], 'tags_partition_id_is_public_index');
                $table->index(['partition_id', 'is_system'], 'tags_partition_id_is_system_index');
                $table->index(['name', 'partition_id'], 'tags_name_partition_id_index');
                $table->index('deleted_by', 'tags_deleted_by_foreign');
                $table->index('updated_by', 'tags_updated_by_foreign');
                $table->index('deleted', 'tags_deleted_index');
                $table->index('source_plugin', 'tags_source_plugin_index');
                // Cross-module FK skipped: tags_deleted_by_foreign -> identity_users.record_id
                // Cross-module FK skipped: tags_partition_id_foreign -> identity_partitions.record_id
                // Cross-module FK skipped: tags_updated_by_foreign -> identity_users.record_id
            });
        }

        // Archive table
        if (!Schema::hasTable('tags_archive')) {
            Schema::create('tags_archive', function (Blueprint $table) {
                $table->bigIncrements('archive_id');
                $table->string('original_record_id', 36);
                $table->string('name');
                $table->string('description')->nullable();
                $table->string('color')->nullable();
                $table->string('icon')->nullable();
                $table->string('category')->nullable();
                $table->boolean('is_public')->default(false);
                $table->boolean('is_system')->default(false);
                $table->unsignedInteger('usage_count')->default(0);
                $table->string('partition_id', 36);
                $table->string('source_plugin', 64)->nullable();
                $table->string('source_record_id', 36)->nullable();
                $table->string('created_by', 36);
                $table->string('updated_by', 36)->nullable();
                $table->timestamp('deleted_at')->nullable();
                $table->string('deleted_by', 36)->nullable();
                $table->boolean('deleted')->default(false);
                $table->timestamp('archived_at')->useCurrent();
                $table->string('archived_by', 64)->default('system-archive-daemon');
                $table->timestamps();
                $table->index(['partition_id', 'original_record_id'], 'idx_tags_archive_partition_record');
                $table->index('archived_at', 'idx_tags_archive_archived_at');
                $table->index('original_record_id', 'tags_archive_original_record_id_index');
            });
        }
    }

    /**
        Schema::enableForeignKeyConstraints();
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::disableForeignKeyConstraints();
        Schema::dropIfExists('tags_archive');
        Schema::dropIfExists('tags');
        Schema::enableForeignKeyConstraints();
    }
};
