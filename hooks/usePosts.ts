// hooks/usePosts.ts
import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { Post, Comment } from '@/types'; // Relative path

// Rest of the hook remains the same

const usePosts = (profileUserId: string) => {
    const [posts, setPosts] = useState<Post[]>([]);

    useEffect(() => {
        if (!profileUserId) return;

        const q = query(
            collection(db, 'posts'),
            where('ownerId', '==', profileUserId),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const postsData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
                comments: (doc.data().comments || []).map((comment: Comment) => ({
                    ...comment,
                    replies: comment.replies || [],
                })),
            })) as Post[];
            setPosts(postsData);
        });

        return () => unsubscribe();
    }, [profileUserId]);

    return { posts, setPosts };
};

export default usePosts;