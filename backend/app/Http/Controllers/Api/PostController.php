<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class PostController extends Controller
{
    public function index(Request $request)
    {
        $query = Post::with('category')->latest();

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }
        
        if ($request->has('search')) {
             $search = $request->search;
             $query->where('title', 'like', "%{$search}%");
        }

        return response()->json($query->paginate(10));
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'category_id' => 'nullable|exists:categories,id',
            'thumbnail' => 'nullable|image|max:2048',
            'status' => 'in:draft,published',
            'summary' => 'nullable|string',
        ]);

        $slug = Str::slug($request->title);
        $count = Post::where('slug', $slug)->count();
        if ($count > 0) {
            $slug .= '-' . ($count + 1);
        }

        $thumbnailPath = null;
        if ($request->hasFile('thumbnail')) {
            $thumbnailPath = $request->file('thumbnail')->store('posts', 'public');
        }

        $post = Post::create([
            'title' => $request->title,
            'slug' => $slug,
            'content' => $request->content,
            'summary' => $request->summary,
            'category_id' => $request->category_id,
            'thumbnail' => $thumbnailPath,
            'status' => $request->status ?? 'draft',
            'published_at' => $request->status === 'published' ? now() : null,
        ]);

        return response()->json($post, 201);
    }

    public function show($id)
    {
        return response()->json(Post::with('category')->findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $post = Post::findOrFail($id);

        $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'category_id' => 'nullable|exists:categories,id',
            'thumbnail' => 'nullable|image|max:2048',
            'status' => 'in:draft,published',
            'summary' => 'nullable|string',
        ]);

        $slug = Str::slug($request->title);
        if ($slug !== $post->slug) {
             $count = Post::where('slug', $slug)->where('id', '!=', $id)->count();
             if ($count > 0) {
                 $slug .= '-' . ($count + 1);
             }
             $post->slug = $slug;
        }

        if ($request->hasFile('thumbnail')) {
            if ($post->thumbnail) {
                Storage::disk('public')->delete($post->thumbnail);
            }
            $post->thumbnail = $request->file('thumbnail')->store('posts', 'public');
        }

        $post->title = $request->title;
        $post->content = $request->content;
        $post->summary = $request->summary;
        $post->category_id = $request->category_id;
        $post->status = $request->status;
        
        if ($post->status === 'published' && !$post->published_at) {
            $post->published_at = now();
        }

        $post->save();

        return response()->json($post);
    }

    public function destroy($id)
    {
        $post = Post::findOrFail($id);
        if ($post->thumbnail) {
            Storage::disk('public')->delete($post->thumbnail);
        }
        $post->delete();

        return response()->json(['message' => 'Post deleted']);
    }

    public function uploadImage(Request $request)
    {
        $request->validate([
            'image' => 'required|image|max:2048',
        ]);

        $path = $request->file('image')->store('posts/content', 'public');

        return response()->json(['url' => Storage::url($path)]);
    }
}
