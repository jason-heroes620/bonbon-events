<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('event_layout_images', function (Blueprint $table) {
            $table->uuid('event_layout_image_id')->primary();
            $table->uuid('event_id');
            $table->text('image_path');
            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('event_id')
                ->references('event_id')
                ->on('events')
                ->cascadeOnDelete();

            $table->index(['event_id', 'sort_order']);
        });

        $now = now();

        $events = DB::table('events')
            ->whereNotNull('event_booth_layout')
            ->where('event_booth_layout', '!=', '')
            ->select(['event_id', 'event_booth_layout', 'created_at', 'updated_at'])
            ->get();

        if ($events->isEmpty()) {
            return;
        }

        $rows = $events->map(function ($event) use ($now) {
            return [
                'event_layout_image_id' => (string) Str::uuid(),
                'event_id' => $event->event_id,
                'image_path' => $event->event_booth_layout,
                'sort_order' => 0,
                'is_active' => true,
                'created_at' => $event->created_at ?? $now,
                'updated_at' => $event->updated_at ?? $now,
            ];
        })->all();

        DB::table('event_layout_images')->insert($rows);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('event_layout_images');
    }
};
