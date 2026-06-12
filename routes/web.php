<?php

use App\Http\Controllers\CategoriesController;
use App\Http\Controllers\LocationsController;
use App\Http\Controllers\BoothTypesController;
use App\Http\Controllers\BoothsController;
use App\Http\Controllers\EventsController;
use App\Http\Controllers\ApplicationsController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DepositController;
use App\Http\Controllers\DepositRefundController;
use App\Http\Controllers\InvoiceNoController;
use App\Http\Controllers\InvoicesController;
use App\Http\Controllers\OrdersController;
use App\Http\Controllers\PaymentsController;
use App\Http\Controllers\VendorsController;
use App\Http\Controllers\UsersController;
use App\Http\Controllers\ProfileController;
use App\Http\Middleware\RejectVendorAccess;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Home', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
})->name('home');

Route::get('/payments/{applicationCode}', [PaymentsController::class, 'show'])->name('payments.show');
Route::post('/payments/{applicationCode}/prepare', [PaymentsController::class, 'prepare'])
    ->middleware('throttle:6,1')
    ->name('payments.prepare');
Route::post('/payments/{applicationCode}/request-invoice', [PaymentsController::class, 'requestInvoice'])
    ->middleware('throttle:6,1')
    ->name('payments.request-invoice');
Route::get('/payments/{applicationCode}/ipay88', [PaymentsController::class, 'redirectToIpay88'])->name('payments.ipay88');
Route::match(['GET', 'POST'], '/ipay88/response', [PaymentsController::class, 'response'])->name('ipay88.response');
// Route::post('/ipay88/backend', [PaymentsController::class, 'backend'])->name('ipay88.backend');
Route::get('/events/{event}/layout-overview', [EventsController::class, 'layoutOverview'])
    ->whereUuid('event')
    ->name('events.layout-overview');
Route::get('/events/{event}/detail', [EventsController::class, 'publicDetail'])
    ->whereUuid('event')
    ->name('events.detail');


Route::middleware(['auth', 'verified', RejectVendorAccess::class])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard.index');

    Route::get('/categories', [CategoriesController::class, 'index'])->name('categories.index');
    Route::get('/categories/create', [CategoriesController::class, 'create'])->name('categories.create');
    Route::post('/categories', [CategoriesController::class, 'store'])->name('categories.store');
    Route::get('/categories/{category}', [CategoriesController::class, 'edit'])->name('categories.edit');
    Route::put('/categories/{category}', [CategoriesController::class, 'update'])->name('categories.update');
    Route::delete('/categories/{category}', [CategoriesController::class, 'destroy'])->name('categories.destroy');

    Route::get('/locations', [LocationsController::class, 'index'])->name('locations.index');
    Route::get('/locations/create', [LocationsController::class, 'create'])->name('locations.create');
    Route::post('/locations', [LocationsController::class, 'store'])->name('locations.store');
    Route::get('/locations/{location}', [LocationsController::class, 'edit'])->name('locations.edit');
    Route::put('/locations/{location}', [LocationsController::class, 'update'])->name('locations.update');
    Route::delete('/locations/{location}', [LocationsController::class, 'destroy'])->name('locations.destroy');

    Route::get('/booth-types', [BoothTypesController::class, 'index'])->name('booth-types.index');
    Route::get('/booth-types/create', [BoothTypesController::class, 'create'])->name('booth-types.create');
    Route::post('/booth-types', [BoothTypesController::class, 'store'])->name('booth-types.store');
    Route::get('/booth-types/{boothType}', [BoothTypesController::class, 'edit'])->name('booth-types.edit');
    Route::put('/booth-types/{boothType}', [BoothTypesController::class, 'update'])->name('booth-types.update');
    Route::delete('/booth-types/{boothType}', [BoothTypesController::class, 'destroy'])->name('booth-types.destroy');

    Route::get('/booths', [BoothsController::class, 'index'])->name('booths.index');
    Route::get('/booths/create', [BoothsController::class, 'create'])->name('booths.create');
    Route::post('/booths', [BoothsController::class, 'store'])->name('booths.store');
    Route::get('/booths/{booth}', [BoothsController::class, 'edit'])->name('booths.edit');
    Route::put('/booths/{booth}', [BoothsController::class, 'update'])->name('booths.update');
    Route::delete('/booths/{booth}', [BoothsController::class, 'destroy'])->name('booths.destroy');

    Route::get('/events', [EventsController::class, 'index'])->name('events.index');
    Route::get('/events/create', [EventsController::class, 'create'])->name('events.create');
    Route::post('/events', [EventsController::class, 'store'])->name('events.store');
    Route::get('/events/summary', [EventsController::class, 'summary'])->name('events.summary');
    Route::get('/events/{event}', [EventsController::class, 'edit'])
        ->whereUuid('event')
        ->name('events.edit');
    Route::post('/events/{event}', [EventsController::class, 'update'])
        ->whereUuid('event')
        ->name('events.update');
    Route::delete('/events/{event}', [EventsController::class, 'destroy'])
        ->whereUuid('event')
        ->name('events.destroy');

    Route::get('/orders', [OrdersController::class, 'index'])->name('orders.index');
    Route::get('/orders/{order}', [OrdersController::class, 'show'])->name('orders.show');

    Route::get('/invoices', [InvoicesController::class, 'index'])->name('invoices.index');
    Route::get('/invoices/{invoice}', [InvoicesController::class, 'show'])->name('invoices.show');
    Route::get('/deposit-refund', [DepositRefundController::class, 'index'])->name('deposit-refund.index');
    Route::get('/deposit-refund/export', [DepositRefundController::class, 'export'])->name('deposit-refund.export');
    Route::post('/deposit-refund', [DepositRefundController::class, 'store'])->name('deposit-refund.store');
    Route::post('/deposit-refund/request-bank-info', [DepositRefundController::class, 'requestBankInfo'])
        ->middleware('throttle:6,1')
        ->name('deposit-refund.request-bank-info');
    Route::get('/mail/preview/request-bank-info/{applicationCode}', [DepositRefundController::class, 'previewRequestBankInfo'])
        ->name('mail.preview.request-bank-info');
    Route::post('/invoices/{invoice}/update-payment', [InvoicesController::class, 'updatePayment'])
        ->name('invoices.update-payment');

    Route::get('/applications', [ApplicationsController::class, 'index'])->name('applications.index');
    Route::get('/applications/create', [ApplicationsController::class, 'create'])->name('applications.create');
    Route::post('/applications', [ApplicationsController::class, 'store'])->name('applications.store');
    Route::get('/applications/{application}', [ApplicationsController::class, 'edit'])->name('applications.edit');
    Route::post('/applications/{application}/confirm-booths', [ApplicationsController::class, 'confirmBooths'])
        ->name('applications.confirm-booths');
    Route::post('/applications/{application}/release-booths', [ApplicationsController::class, 'releaseBooths'])
        ->name('applications.release-booths');
    Route::post('/applications/{application}/events/{applicationEvent}/confirm-booths', [ApplicationsController::class, 'confirmBoothsForEvent'])
        ->name('applications.events.confirm-booths');
    Route::post('/applications/{application}/events/{applicationEvent}/release-booths', [ApplicationsController::class, 'releaseBoothsForEvent'])
        ->name('applications.events.release-booths');
    Route::post('/applications/{application}/events/{applicationEvent}/update-booth-qty', [ApplicationsController::class, 'updateBoothQtyForEvent'])
        ->name('applications.events.update-booth-qty');
    Route::post('/applications/{application}/events/{applicationEvent}/update-status', [ApplicationsController::class, 'updateEventStatus'])
        ->name('applications.events.update-status');
    Route::post('/applications/{application}/update-status', [ApplicationsController::class, 'updateStatus'])
        ->name('applications.update-status');
    Route::post('/applications/{application}/send-payment-link', [ApplicationsController::class, 'sendPaymentLink'])
        ->middleware('throttle:6,1')
        ->name('applications.send-payment-link');
    Route::post('/applications/{application}/update-discount', [ApplicationsController::class, 'updateDiscount'])
        ->name('applications.update-discount');
    Route::post('/applications/{application}/generate-invoice', [ApplicationsController::class, 'generateInvoice'])
        ->name('applications.generate-invoice');
    Route::post('/applications/{application}/send-payment-reminder', [ApplicationsController::class, 'sendPaymentReminder'])
        ->middleware('throttle:6,1')
        ->name('applications.send-payment-reminder');
    Route::put('/applications/{application}', [ApplicationsController::class, 'update'])->name('applications.update');
    Route::delete('/applications/{application}', [ApplicationsController::class, 'destroy'])->name('applications.destroy');

    Route::get('/vendors', [VendorsController::class, 'index'])->name('vendors.index');
    Route::get('/vendors/create', [VendorsController::class, 'create'])->name('vendors.create');
    Route::post('/vendors', [VendorsController::class, 'store'])->name('vendors.store');
    Route::get('/vendors/{vendor}', [VendorsController::class, 'edit'])->name('vendors.edit');
    Route::put('/vendors/{vendor}', [VendorsController::class, 'update'])->name('vendors.update');
    Route::delete('/vendors/{vendor}', [VendorsController::class, 'destroy'])->name('vendors.destroy');

    Route::get('/deposits', [DepositController::class, 'index'])->name('deposits.index');
    Route::get('/deposits/create', [DepositController::class, 'create'])->name('deposits.create');
    Route::post('/deposits', [DepositController::class, 'store'])->name('deposits.store');
    Route::get('/deposits/{deposit}', [DepositController::class, 'edit'])->name('deposits.edit');
    Route::put('/deposits/{deposit}', [DepositController::class, 'update'])->name('deposits.update');
    Route::delete('/deposits/{deposit}', [DepositController::class, 'destroy'])->name('deposits.destroy');

    Route::get('/invoice-nos', [InvoiceNoController::class, 'index'])->name('invoice-nos.index');
    Route::get('/invoice-nos/create', [InvoiceNoController::class, 'create'])->name('invoice-nos.create');
    Route::post('/invoice-nos', [InvoiceNoController::class, 'store'])->name('invoice-nos.store');
    Route::get('/invoice-nos/{invoiceNo}', [InvoiceNoController::class, 'edit'])->name('invoice-nos.edit');
    Route::put('/invoice-nos/{invoiceNo}', [InvoiceNoController::class, 'update'])->name('invoice-nos.update');
    Route::delete('/invoice-nos/{invoiceNo}', [InvoiceNoController::class, 'destroy'])->name('invoice-nos.destroy');

    Route::get('/preview/mails/application-approve', function () {
        $applicationCode = '8KFWNN99';
        return view('mails.application-approve', [
            'userName' => 'Vendor',
            'eventName' => 'Test Event',
            'applicationCode' => $applicationCode,
            'paymentUrl' => url('/payments/' . $applicationCode),
        ]);
    })->name('preview.mails.application-approve');

    Route::get('/preview/mails/application-rejected', function () {
        $applicationCode = '8KFWNN99';
        return view('mails.application-rejected', [
            'applicationCode' => $applicationCode,
            'userName' => 'Vendor',
            'eventName' => 'Test Event',
        ]);
    })->name('preview.mails.application-rejected');

    Route::get('/preview/invoices/{invoice}', [InvoicesController::class, 'previewInvoice'])->name('preview.invoices.template');

    Route::get('/users', [UsersController::class, 'index'])->name('users.index');
    Route::get('/users/create', [UsersController::class, 'create'])->name('users.create');
    Route::post('/users', [UsersController::class, 'store'])->name('users.store');
    Route::get('/users/{user}', [UsersController::class, 'edit'])->name('users.edit');
    Route::put('/users/{user}', [UsersController::class, 'update'])->name('users.update');
    Route::post('/users/{user}/send-verification-email', [UsersController::class, 'sendVerificationEmail'])
        ->middleware('throttle:6,1')
        ->name('users.send-verification-email');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

Route::post('/events/participate-multi', [ApplicationsController::class, 'participateMulti'])
    ->middleware('auth')
    ->name('events.participate-multi');

Route::post('/events/{event}/participate', [ApplicationsController::class, 'participate'])
    ->middleware('auth')
    ->whereUuid('event')
    ->name('events.participate');

Route::get('/events-list', [EventsController::class, 'eventsList'])->name('events-list.index');

require __DIR__ . '/auth.php';
