<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('application_events_legacy')) {
            Schema::rename('applications', 'application_events_legacy');
        }

        if (!Schema::hasTable('applications')) {
            Schema::create('applications', function (Blueprint $table) {
                $table->uuid('application_id')->primary();
                $table->uuid('user_id')->nullable();
                $table->uuid('vendor_id')->nullable();
                $table->string('application_code', 8);
                $table->enum('application_status', ['pending', 'approved', 'rejected', 'cancelled'])->default('pending');
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('application_events')) {
            Schema::create('application_events', function (Blueprint $table) {
                $table->uuid('application_event_id')->primary();
                $table->uuid('application_id');
                $table->uuid('event_id');
                $table->tinyInteger('participants')->default(1);
                $table->tinyInteger('no_of_booths')->default(1);
                $table->text('requirements')->nullable();
                $table->boolean('plug')->default(false);
                $table->enum('application_status', ['pending', 'approved', 'rejected', 'cancelled'])->default('pending');
                $table->timestamps();

                $table->index(['application_id']);
                $table->index(['event_id']);
                $table->unique(['application_id', 'event_id']);
            });
        }

        if (Schema::hasTable('application_events_legacy') && Schema::hasTable('applications')) {
            $existingApplicationIds = DB::table('applications')->pluck('application_id')->all();
            $existingApplicationIdSet = array_fill_keys($existingApplicationIds, true);

            $legacy = DB::table('application_events_legacy')->get();

            foreach ($legacy as $row) {
                $applicationId = (string) $row->application_id;
                if ($applicationId === '') {
                    continue;
                }

                if (empty($existingApplicationIdSet[$applicationId])) {
                    DB::table('applications')->insert([
                        'application_id' => $applicationId,
                        'user_id' => $row->user_id ?? null,
                        'vendor_id' => $row->vendor_id ?? null,
                        'application_code' => (string) ($row->application_code ?? Str::upper(Str::random(8))),
                        'application_status' => (string) ($row->application_status ?? 'pending'),
                        'created_at' => $row->created_at ?? now(),
                        'updated_at' => $row->updated_at ?? now(),
                    ]);
                    $existingApplicationIdSet[$applicationId] = true;
                }

                $applicationEventId = $applicationId;

                $existsEvent = DB::table('application_events')
                    ->where('application_event_id', $applicationEventId)
                    ->exists();

                if (!$existsEvent) {
                    DB::table('application_events')->insert([
                        'application_event_id' => $applicationEventId,
                        'application_id' => $applicationId,
                        'event_id' => $row->event_id,
                        'participants' => $row->participants ?? 1,
                        'no_of_booths' => $row->no_of_booths ?? 1,
                        'requirements' => $row->requirements ?? null,
                        'plug' => (bool) ($row->plug ?? false),
                        'application_status' => (string) ($row->application_status ?? 'pending'),
                        'created_at' => $row->created_at ?? now(),
                        'updated_at' => $row->updated_at ?? now(),
                    ]);
                }
            }
        }

        if (Schema::hasTable('application_booths') && !Schema::hasColumn('application_booths', 'application_event_id')) {
            Schema::table('application_booths', function (Blueprint $table) {
                $table->uuid('application_event_id')->nullable()->after('application_id');
                $table->index(['application_event_id']);
            });
        }

        if (Schema::hasTable('application_booths') && Schema::hasTable('application_events_legacy')) {
            DB::table('application_booths')
                ->whereNull('application_event_id')
                ->orderBy('created_at')
                ->chunkById(500, function ($rows) {
                    foreach ($rows as $row) {
                        DB::table('application_booths')
                            ->where('application_booth_id', $row->application_booth_id)
                            ->update([
                                'application_event_id' => $row->application_id,
                            ]);
                    }
                }, 'application_booth_id');
        }

        if (Schema::hasTable('event_booths') && !Schema::hasColumn('event_booths', 'occupied_by_application_event_id')) {
            Schema::table('event_booths', function (Blueprint $table) {
                $table->uuid('occupied_by_application_event_id')->nullable()->after('occupied');
                $table->index(['occupied_by_application_event_id']);
            });
        }

        if (
            Schema::hasTable('event_booths')
            && Schema::hasTable('application_booths')
            && Schema::hasTable('application_events')
            && Schema::hasTable('application_events_legacy')
        ) {
            DB::table('event_booths')
                ->where('occupied', true)
                ->whereNull('occupied_by_application_event_id')
                ->orderBy('created_at')
                ->chunkById(500, function ($rows) {
                    foreach ($rows as $row) {
                        $applicationId = DB::table('application_events_legacy')
                            ->join('application_booths', function ($join) use ($row) {
                                $join->on('application_events_legacy.application_id', '=', 'application_booths.application_id')
                                    ->where('application_booths.booth_id', '=', $row->booth_id);
                            })
                            ->where('application_events_legacy.event_id', $row->event_id)
                            ->value('application_events_legacy.application_id');

                        if (!$applicationId) {
                            continue;
                        }

                        DB::table('event_booths')
                            ->where('event_booth_id', $row->event_booth_id)
                            ->update([
                                'occupied_by_application_event_id' => $applicationId,
                            ]);
                    }
                }, 'event_booth_id');
        }

        if (Schema::hasTable('order_items') && !Schema::hasColumn('order_items', 'application_event_id')) {
            Schema::table('order_items', function (Blueprint $table) {
                $table->uuid('application_event_id')->nullable()->after('order_id');
                $table->uuid('event_id')->nullable()->after('application_event_id');
                $table->uuid('booth_id')->nullable()->after('event_id');
                $table->uuid('event_booth_id')->nullable()->after('booth_id');
                $table->string('item_type', 20)->nullable()->after('event_booth_id');

                $table->index(['application_event_id']);
                $table->index(['event_id']);
                $table->index(['booth_id']);
                $table->index(['event_booth_id']);
                $table->index(['item_type']);
            });
        }

        if (
            Schema::hasTable('order_items')
            && Schema::hasTable('orders')
            && Schema::hasTable('application_events_legacy')
        ) {
            DB::table('order_items')
                ->whereNull('application_event_id')
                ->orderBy('created_at')
                ->chunkById(500, function ($rows) {
                    foreach ($rows as $row) {
                        $order = DB::table('orders')
                            ->where('order_id', $row->order_id)
                            ->first(['application_id']);

                        if (!$order || !$order->application_id) {
                            continue;
                        }

                        $eventId = DB::table('application_events_legacy')
                            ->where('application_id', $order->application_id)
                            ->value('event_id');

                        DB::table('order_items')
                            ->where('order_item_id', $row->order_item_id)
                            ->update([
                                'application_event_id' => $order->application_id,
                                'event_id' => $eventId,
                                'item_type' => $row->item_description === 'Deposit' ? 'deposit' : 'booth',
                            ]);
                    }
                }, 'order_item_id');
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('applications') && !Schema::hasTable('applications_new_backup') && Schema::hasTable('application_events_legacy')) {
            Schema::rename('applications', 'applications_new_backup');
        }
    }
};
