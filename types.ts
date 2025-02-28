// web-app/types.ts
import { Timestamp } from 'firebase/firestore';

// Reply type for nested comments
export interface Reply {
    id: string;
    userId: string;
    text: string;
    likes: string[]; // Array of user IDs who liked the reply
    createdAt: Timestamp | Date; // Firestore Timestamp or Date object
}

// Comment type for post comments
export interface Comment {
    id: string;
    userId: string;
    text: string;
    likes: string[]; // Array of user IDs who liked the comment
    replies: Reply[]; // Nested replies
    createdAt: Timestamp | Date; // Firestore Timestamp or Date object
}

// Post type for gallery items
export interface Post {
    id: string;
    ownerId: string;
    mediaType: 'image' | 'video';
    mediaUri: string;
    tags: string[]; // Interest tags
    description: string;
    likes: string[]; // Array of user IDs who liked the post
    comments: Comment[];
    createdAt: Timestamp | Date; // Firestore Timestamp or Date object
}

// Profile data type for user information
export interface ProfileData {
    uid?: string;
    profileType: 'personal' | 'business';
    fullName?: string;
    username?: string;
    profilePicture?: string;
    city: string;
    state: string;
    shortDescription?: string;
    followers?: string[];
    following?: string[];
}