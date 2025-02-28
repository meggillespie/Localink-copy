// hooks/useProfile.ts
import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/firebaseConfig';
import { ProfileData } from '@/types'; // Relative path

const useProfile = (profileUserId: string, currentUserId: string, isOwnProfile: boolean) => {
    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [isFollowing, setIsFollowing] = useState(false);

    useEffect(() => {
        const profileRef = doc(db, 'users', profileUserId);
        const unsubscribe = onSnapshot(profileRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data() as ProfileData;
                setProfileData({
                    uid: docSnap.id,
                    profileType: data.profileType || 'personal',
                    fullName: data.fullName || 'User Name',
                    username: data.username || 'username',
                    profilePicture: data.profilePicture || 'https://via.placeholder.com/150',
                    city: data.city || 'City',
                    state: data.state || 'State',
                    shortDescription: data.shortDescription || 'This is a short description.',
                    followers: data.followers || [],
                    following: data.following || [],
                });
                if (!isOwnProfile) {
                    setIsFollowing(data.followers?.includes(currentUserId) || false);
                }
            }
        });

        return () => unsubscribe();
    }, [profileUserId, currentUserId, isOwnProfile]);

    const toggleFollow = async () => {
        if (!currentUserId || isOwnProfile) return;
        const currentUserRef = doc(db, 'users', currentUserId);
        const profileUserRef = doc(db, 'users', profileUserId);

        try {
            if (isFollowing) {
                await Promise.all([
                    updateDoc(currentUserRef, { following: arrayRemove(profileUserId) }),
                    updateDoc(profileUserRef, { followers: arrayRemove(currentUserId) }),
                ]);
                setIsFollowing(false);
            } else {
                await Promise.all([
                    updateDoc(currentUserRef, { following: arrayUnion(profileUserId) }),
                    updateDoc(profileUserRef, { followers: arrayUnion(currentUserId) }),
                ]);
                setIsFollowing(true);
            }
        } catch (error) {
            console.error('Error toggling follow:', error);
        }
    };

    return { profileData, isFollowing, toggleFollow };
};

export default useProfile;