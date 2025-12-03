<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Comment;
use App\Models\Post;
use Illuminate\Support\Facades\Auth;

class CommentController extends Controller
{
    public function index($postId)
    {
        $comments = Comment::where('post_id', $postId)
            ->with('user:id,name') // Only fetch necessary user fields
            ->latest()
            ->get();

        return response()->json($comments);
    }

    public function store(Request $request, $postId)
    {
        $request->validate([
            'content' => 'required|string|max:1000',
        ]);

        $user = Auth::user();

        if ($user->is_temporary) {
            return response()->json(['message' => 'Temporary users cannot comment.'], 403);
        }

        $post = Post::findOrFail($postId);

        $comment = $post->comments()->create([
            'user_id' => $user->id,
            'content' => $request->content,
        ]);

        return response()->json($comment->load('user:id,name'), 201);
    }
}
