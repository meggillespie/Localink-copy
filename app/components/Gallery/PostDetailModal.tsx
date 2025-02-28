// components/Gallery/PostDetailModal.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    Image,
    Modal,
    FlatList,
    TextInput,
    TouchableOpacity,
    Button,
    StyleSheet,
    Dimensions,
} from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebaseConfig';

import { Post, Comment, Reply } from '@/types'; // Relative path

interface PostDetailModalProps {
    visible: boolean;
    post: Post;
    isOwnProfile: boolean;
    currentUserId: string;
    onClose: () => void;
    onUpdate: (updatedPost: Post) => void;
}

const PostDetailModal: React.FC<PostDetailModalProps> = ({
                                                             visible,
                                                             post,
                                                             isOwnProfile,
                                                             currentUserId,
                                                             onClose,
                                                             onUpdate,
                                                         }) => {
    const [newComment, setNewComment] = useState('');
    const [replyText, setReplyText] = useState<{ [commentId: string]: string }>({});
    const [editingComment, setEditingComment] = useState<Comment | null>(null);
    const [editCommentText, setEditCommentText] = useState('');
    const [editingReply, setEditingReply] = useState<{ commentId: string; reply: Reply } | null>(null);
    const [editReplyText, setEditReplyText] = useState('');

    const handleLikePost = async () => {
        const updatedLikes = post.likes.includes(currentUserId)
            ? post.likes.filter((id) => id !== currentUserId)
            : [...post.likes, currentUserId];
        const updatedPost = { ...post, likes: updatedLikes };
        await updateDoc(doc(db, 'posts', post.id), { likes: updatedLikes });
        onUpdate(updatedPost);
    };

    const handleAddComment = async () => {
        if (!newComment.trim()) return;
        const comment: Comment = {
            id: Date.now().toString(),
            userId: currentUserId,
            text: newComment,
            likes: [],
            replies: [],
            createdAt: new Date(),
        };
        const updatedComments = [...post.comments, comment];
        const updatedPost = { ...post, comments: updatedComments };
        await updateDoc(doc(db, 'posts', post.id), { comments: updatedComments });
        onUpdate(updatedPost);
        setNewComment('');
    };

    const handleLikeComment = async (comment: Comment) => {
        const updatedComments = post.comments.map((c) =>
            c.id === comment.id
                ? {
                    ...c,
                    likes: c.likes.includes(currentUserId)
                        ? c.likes.filter((id) => id !== currentUserId)
                        : [...c.likes, currentUserId],
                }
                : c
        );
        await updateDoc(doc(db, 'posts', post.id), { comments: updatedComments });
        onUpdate({ ...post, comments: updatedComments });
    };

    const handleAddReply = async (commentId: string) => {
        if (!replyText[commentId]?.trim()) return;
        const reply: Reply = {
            id: Date.now().toString(),
            userId: currentUserId,
            text: replyText[commentId],
            likes: [],
            createdAt: new Date(),
        };
        const updatedComments = post.comments.map((c) =>
            c.id === commentId ? { ...c, replies: [...c.replies, reply] } : c
        );
        await updateDoc(doc(db, 'posts', post.id), { comments: updatedComments });
        onUpdate({ ...post, comments: updatedComments });
        setReplyText((prev) => ({ ...prev, [commentId]: '' }));
    };

    const handleEditComment = (comment: Comment) => {
        if (comment.userId !== currentUserId) return;
        setEditingComment(comment);
        setEditCommentText(comment.text);
    };

    const handleSaveEditComment = async () => {
        if (!editingComment || !editCommentText.trim()) return;
        const updatedComments = post.comments.map((c) =>
            c.id === editingComment.id ? { ...c, text: editCommentText } : c
        );
        await updateDoc(doc(db, 'posts', post.id), { comments: updatedComments });
        onUpdate({ ...post, comments: updatedComments });
        setEditingComment(null);
        setEditCommentText('');
    };

    const handleDeleteComment = async (commentId: string) => {
        const comment = post.comments.find((c) => c.id === commentId);
        if (!comment || (comment.userId !== currentUserId && !isOwnProfile)) return;
        const updatedComments = post.comments.filter((c) => c.id !== commentId);
        await updateDoc(doc(db, 'posts', post.id), { comments: updatedComments });
        onUpdate({ ...post, comments: updatedComments });
    };

    const handleEditReply = (commentId: string, reply: Reply) => {
        if (reply.userId !== currentUserId) return;
        setEditingReply({ commentId, reply });
        setEditReplyText(reply.text);
    };

    const handleSaveEditReply = async () => {
        if (!editingReply || !editReplyText.trim()) return;
        const updatedComments = post.comments.map((c) =>
            c.id === editingReply.commentId
                ? {
                    ...c,
                    replies: c.replies.map((r) =>
                        r.id === editingReply.reply.id ? { ...r, text: editReplyText } : r
                    ),
                }
                : c
        );
        await updateDoc(doc(db, 'posts', post.id), { comments: updatedComments });
        onUpdate({ ...post, comments: updatedComments });
        setEditingReply(null);
        setEditReplyText('');
    };

    const handleDeleteReply = async (commentId: string, replyId: string) => {
        const comment = post.comments.find((c) => c.id === commentId);
        if (!comment || comment.replies.find((r) => r.id === replyId)?.userId !== currentUserId) return;
        const updatedComments = post.comments.map((c) =>
            c.id === commentId ? { ...c, replies: c.replies.filter((r) => r.id !== replyId) } : c
        );
        await updateDoc(doc(db, 'posts', post.id), { comments: updatedComments });
        onUpdate({ ...post, comments: updatedComments });
    };

    const renderComment = ({ item }: { item: Comment }) => (
        <View style={styles.commentContainer}>
            <Text style={styles.commentText}>
                <Text style={{ fontWeight: 'bold' }}>{item.userId}</Text>: {item.text}
            </Text>
            <View style={styles.commentActions}>
                <TouchableOpacity onPress={() => handleLikeComment(item)}>
                    <Text style={styles.actionText}>♥ {item.likes.length}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() =>
                        setReplyText((prev) => ({
                            ...prev,
                            [item.id]: prev[item.id] || '',
                        }))
                    }
                >
                    <Text style={styles.actionText}>Reply</Text>
                </TouchableOpacity>
                {(item.userId === currentUserId || isOwnProfile) && (
                    <>
                        {item.userId === currentUserId && (
                            <TouchableOpacity onPress={() => handleEditComment(item)}>
                                <Text style={styles.actionText}>✏️</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity onPress={() => handleDeleteComment(item.id)}>
                            <Text style={styles.actionText}>🗑️</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>
            {replyText[item.id] !== undefined && (
                <View style={styles.replyInputContainer}>
                    <TextInput
                        style={styles.replyInput}
                        placeholder="Reply..."
                        value={replyText[item.id]}
                        onChangeText={(text) => setReplyText((prev) => ({ ...prev, [item.id]: text }))}
                    />
                    <Button title="Send" onPress={() => handleAddReply(item.id)} />
                </View>
            )}
            {item.replies.map((reply) => (
                <View key={reply.id} style={styles.replyContainer}>
                    <Text style={styles.replyText}>
                        <Text style={{ fontWeight: 'bold' }}>{reply.userId}</Text>: {reply.text}
                    </Text>
                    <View style={styles.commentActions}>
                        <TouchableOpacity onPress={() => {/* Handle reply like if needed */}}>
                            <Text style={styles.actionText}>♥ {reply.likes.length}</Text>
                        </TouchableOpacity>
                        {reply.userId === currentUserId && (
                            <>
                                <TouchableOpacity onPress={() => handleEditReply(item.id, reply)}>
                                    <Text style={styles.actionText}>✏️</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => handleDeleteReply(item.id, reply.id)}>
                                    <Text style={styles.actionText}>🗑️</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            ))}
        </View>
    );

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    {post.mediaType === 'image' ? (
                        <Image source={{ uri: post.mediaUri }} style={styles.media} />
                    ) : (
                        <View style={styles.media}>
                            <Text style={styles.videoPlaceholder}>Video Placeholder</Text>
                        </View>
                    )}
                    <View style={styles.postInfo}>
                        <Text style={styles.description}>{post.description}</Text>
                        <Text style={styles.tags}>{post.tags.join(', ')}</Text>
                        <TouchableOpacity onPress={handleLikePost}>
                            <Text style={styles.likes}>♥ {post.likes.length}</Text>
                        </TouchableOpacity>
                    </View>
                    <FlatList
                        data={post.comments}
                        renderItem={renderComment}
                        keyExtractor={(item) => item.id}
                        style={styles.commentsList}
                    />
                    <View style={styles.commentInputContainer}>
                        <TextInput
                            style={styles.commentInput}
                            placeholder="Add a comment..."
                            value={newComment}
                            onChangeText={setNewComment}
                        />
                        <Button title="Post" onPress={handleAddComment} />
                    </View>
                    <Button title="Close" onPress={onClose} />
                    {editingComment && (
                        <View style={styles.editModal}>
                            <TextInput
                                style={styles.editInput}
                                value={editCommentText}
                                onChangeText={setEditCommentText}
                                multiline
                            />
                            <Button title="Save" onPress={handleSaveEditComment} />
                            <Button title="Cancel" onPress={() => setEditingComment(null)} />
                        </View>
                    )}
                    {editingReply && (
                        <View style={styles.editModal}>
                            <TextInput
                                style={styles.editInput}
                                value={editReplyText}
                                onChangeText={setEditReplyText}
                                multiline
                            />
                            <Button title="Save" onPress={handleSaveEditReply} />
                            <Button title="Cancel" onPress={() => setEditingReply(null)} />
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: { flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', padding: 20 },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 15,
        maxHeight: Dimensions.get('window').height * 0.8,
    },
    media: { width: '100%', height: 250, borderRadius: 8, backgroundColor: '#000' },
    videoPlaceholder: { color: '#fff', textAlign: 'center', lineHeight: 250 },
    postInfo: { padding: 10 },
    description: { fontSize: 14, color: '#333' },
    tags: { fontSize: 12, color: '#777', marginVertical: 5 },
    likes: { fontSize: 14, color: '#e74c3c' },
    commentsList: { maxHeight: 200, marginVertical: 10 },
    commentContainer: { paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#eee' },
    commentText: { fontSize: 14, color: '#333' },
    commentActions: { flexDirection: 'row', marginTop: 5 },
    actionText: { marginHorizontal: 5, fontSize: 12 },
    replyContainer: { marginLeft: 20, paddingVertical: 5 },
    replyText: { fontSize: 12, color: '#555' },
    replyInputContainer: { flexDirection: 'row', marginTop: 5 },
    replyInput: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 5 },
    commentInputContainer: { flexDirection: 'row', marginTop: 10 },
    commentInput: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10 },
    editModal: { marginTop: 10 },
    editInput: { borderWidth: 1, borderColor: '#ccc', borderRadius: 5, padding: 10, marginBottom: 10 },
});

export default PostDetailModal;