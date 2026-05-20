<?php

namespace App\Http\Controllers;

use App\Models\Categories;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CategoriesController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->string('search')->toString();

        $categories = Categories::query()
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($query) use ($search) {
                    $query->where('category_name', 'like', "%{$search}%")
                        ->orWhere('category_description', 'like', "%{$search}%");
                });
            })
            ->orderBy('category_name')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('configurations/categories/categories', [
            'categories' => $categories,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('configurations/categories/create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'category_name' => ['required', 'string', 'max:255'],
            'category_description' => ['nullable', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        Categories::create([
            'category_name' => $validated['category_name'],
            'category_description' => $validated['category_description'],
            'is_active' => (bool) ($validated['is_active'] ?? true),
        ]);

        return redirect('/categories');
    }

    public function edit(Categories $category): Response
    {
        return Inertia::render('configurations/categories/[id]', [
            'category' => $category,
        ]);
    }

    public function update(Request $request, Categories $category)
    {
        $validated = $request->validate([
            'category_name' => ['required', 'string', 'max:255'],
            'category_description' => ['nullable', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $category->update([
            'category_name' => $validated['category_name'],
            'category_description' => $validated['category_description'],
            'is_active' => (bool) ($validated['is_active'] ?? false),
        ]);

        return redirect('/categories');
    }

    public function destroy(Categories $category)
    {
        Categories::delete($category);

        return redirect('/categories');
    }
}
