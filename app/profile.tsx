// app/profile.tsx
import React, { useEffect, useState } from 'react';
import { ScrollView, Platform, StyleSheet, Dimensions } from 'react-native';
import {
    VStack,
    HStack,
    Text,
    Image,
    Button,
    Input,
    FormControl,
    Box,
    Select,
    CheckIcon,
    Checkbox,
    Wrap,
    useToast,
    Pressable,
    VStack as NBVStack,
} from 'native-base';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { auth, db, storage } from '@/firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { signOut } from 'firebase/auth';

interface ProfileData {
    profileType: 'personal' | 'business';
    fullName?: string;
    username?: string;
    businessName?: string;
    // For business accounts, add the following:
    businessPhone?: string;
    businessEmail?: string;
    // For business accounts, servicesOffered is now an array (collapsible selection)
    servicesOffered?: string[];
    age?: string;
    gender?: string;
    profilePicture?: string;
    city: string;
    state: string;
    zipCode: string;
    interests?: string[];
    // NEW: Short description field for both account types
    shortDescription?: string;
}

// Group all interests (and services offered options) into categories
const CATEGORIZED_INTERESTS: { [category: string]: string[] } = {
    "Sports & Fitness": [
        "Local Sports", "Endurance sports", "Running", "Trail running", "Marathon", "Ultramarathon",
        "Adventure racing", "Jogging", "Walking", "Cycling", "Swimming", "Health", "Fitness", "Yoga",
        "Pilates", "Aerobics", "Kickboxing"
    ],
    "Martial Arts": [
        "Martial arts", "Karate", "Tae kwon do", "Brazilian jiu-jitsu", "MMA", "Boxing"
    ],
    "Outdoor Activities": [
        "Hiking", "Inline skating", "Rollerblading", "Rock climbing", "Kayaking",
        "Canoeing", "Paddleboarding", "Orienteering", "Mountain biking", "Horseback riding",
        "Soccer", "Basketball", "Volleyball", "Football", "Flag football", "Baseball", "Softball",
        "Tennis", "Badminton", "Table tennis", "Cricket", "Rugby", "Ultimate frisbee"
    ],
    "Arts & Crafts": [
        "Drawing", "Painting", "Sketching", "Calligraphy", "Digital art", "Photography", "Crafting",
        "DIY", "Scrapbooking", "Knitting", "Crocheting", "Sewing", "Quilting", "Embroidery",
        "Jewelry making", "Woodworking", "Paper crafts", "Origami", "Pottery", "Clay Sculpting",
        "Candle Making", "DIY projects", "Collage", "Mixed media art", "Recycling projects",
        "Model building", "Floral arranging"
    ],
    "Music & Performing Arts": [
        "Music", "Performing Arts", "Piano", "Guitar", "Drums", "Violin", "Flute", "Ukulele", "Saxophone",
        "Keyboard", "Harmonica", "Choir singing", "Solo singing", "Karaoke", "Vocal training", "Theater",
        "Ballet", "Jazz", "Hip hop", "Contemporary", "Tap dance", "Ballroom dance", "Folk dance",
        "Line dancing", "Community theater", "Improv", "Acting", "Puppetry", "Stage performance",
        "Storytelling", "Musical theater", "Magic", "Mime", "Juggling", "Stand-up comedy"
    ],
    "Reading & Writing": [
        "Reading: Fiction", "Reading: Non-fiction", "Comics", "Graphic novels", "Poetry",
        "Writing", "Creative writing", "Journaling", "Fan fiction"
    ],
    "Games & Puzzles": [
        "Book clubs", "Board Games", "Card Games", "Chess", "Poker", "Puzzles", "Logic puzzles",
        "Brain games", "Escape rooms", "Video Games", "Computer Games", "Puzzle games", "Adventure games",
        "VR games"
    ],
    "Nature & Outdoors": [
        "Camping", "Picnicking", "Birdwatching", "Stargazing", "Nature walks", "Botanical garden visits",
        "Wildlife spotting", "Geocaching", "Fishing", "Gardening", "National parks visits", "Outdoor photography",
        "Cycling tours", "Barbecuing", "Outdoor sports", "National Parks"
    ],
    "Cooking & Home": [
        "Cooking", "Baking", "Home Improvement", "Decorating"
    ],
    "Media & Mindfulness": [
        "Movies", "Music", "Podcasts", "Meditation", "Mindfulness"
    ],
    "Technology & Learning": [
        "Indoor gardening", "Language Learners", "Coding", "Robotics", "Science experiments",
        "Astronomy", "Digital photography", "Videography", "Animation", "Graphic design",
        "Music production", "DIY electronics", "App development", "Game development", "Virtual reality"
    ],
    "Food & Drink": [
        "Grilling", "Vegan", "Vegetarian", "Meal prep", "Healthy cooking", "Baking bread",
        "Wine making", "Beer Brewing"
    ],
    "Community & Misc": [
        "Volunteering", "Community service", "Community gardening", "Local sports", "Travel",
        "Local Exploration", "Historical sites", "Music festivals", "Theme parks", "Road trips",
        "Adventure travel", "Weight training", "Stamp collecting", "Coin collecting", "Trading cards",
        "Antiques", "Genealogy", "Pet care/training"
    ]
};

//
// CollapsibleCategory Component
//
interface CollapsibleCategoryProps {
    category: string;
    interests: string[];
    selectedInterests: string[];
    onToggle: (interest: string, isSelected: boolean) => void;
}

const CollapsibleCategory: React.FC<CollapsibleCategoryProps> = ({
                                                                     category,
                                                                     interests,
                                                                     selectedInterests,
                                                                     onToggle,
                                                                 }) => {
    const [expanded, setExpanded] = useState(false);
    return (
        <Box
            mb={4}
            borderWidth={1}
            borderColor="coolGray.200"
            borderRadius={8}
            p={expanded ? 3 : 1} // smaller padding when collapsed
        >
            <Pressable onPress={() => setExpanded(!expanded)}>
                <Text fontSize="lg" bold>
                    {category} {expanded ? '-' : '+'}
                </Text>
            </Pressable>
            {expanded && (
                <Wrap direction="row" space={2} mt={2}>
                    {interests.map((interest) => (
                        <Box key={interest} flexBasis="33%" mb={2}>
                            <Checkbox
                                value={interest}
                                isChecked={selectedInterests.includes(interest)}
                                onChange={(isSelected) => onToggle(interest, isSelected)}
                            >
                                {interest}
                            </Checkbox>
                        </Box>
                    ))}
                </Wrap>
            )}
        </Box>
    );
};

//
// Helper function to upload images
//
async function uploadImageAsync(uri: string): Promise<string> {
    if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            throw new Error('Permission to access media library was denied');
        }
    }
    const response = await fetch(uri);
    const blob = await response.blob();
    const storageRef = ref(storage, `profileImages/${Date.now()}`);
    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
}

export default function ProfilePage() {
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [localData, setLocalData] = useState<ProfileData | null>(null);
    const router = useRouter();
    const toast = useToast();
    const uid = auth.currentUser?.uid;

    useEffect(() => {
        if (uid) {
            const fetchProfile = async () => {
                const docRef = doc(db, 'users', uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data() as ProfileData;
                    if (!data.profileType) data.profileType = 'personal';
                    // Initialize shortDescription if missing
                    if (data.shortDescription === undefined) data.shortDescription = '';
                    setProfile(data);
                    setLocalData(data);
                } else {
                    const defaultProfile: ProfileData = {
                        profileType: 'personal',
                        fullName: '',
                        username: '',
                        city: '',
                        state: '',
                        zipCode: '',
                        age: '',
                        gender: '',
                        interests: [],
                        shortDescription: '', // default value
                    };
                    setProfile(defaultProfile);
                    setLocalData(defaultProfile);
                    setEditMode(true);
                }
            };
            fetchProfile();
        }
    }, [uid]);

    const handleUpdate = async () => {
        if (!localData) return;
        try {
            const docRef = doc(db, 'users', uid!);
            await updateDoc(docRef, localData as any);
            setProfile(localData);
            setEditMode(false);
            toast.show({ description: "Profile updated successfully" });
        } catch (err) {
            console.error("Error updating profile:", err);
            toast.show({ description: "Error updating profile", status: "error" });
        }
    };

    const pickImage = async () => {
        try {
            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.5,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
                const uri = result.assets[0].uri;
                const downloadURL = await uploadImageAsync(uri);
                setLocalData({ ...localData!, profilePicture: downloadURL });
            }
        } catch (error) {
            console.error("Error picking image:", error);
            toast.show({ description: "Error picking image", status: "error" });
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push('/signIn');
        } catch (error: any) {
            console.error("Error signing out:", error.message);
            toast.show({ description: "Error signing out", status: "error" });
        }
    };

    if (!profile || !localData) {
        return <Text>Loading...</Text>;
    }

    return (
        <ScrollView style={styles.scrollContainer}>
            {/* Header with Logout */}
            <HStack style={styles.header} justifyContent="space-between" alignItems="center">
                <Text style={styles.headerTitle}>Profile</Text>
                <Pressable onPress={handleLogout}>
                    <Text style={styles.logoutText}>Logout</Text>
                </Pressable>
            </HStack>
            <VStack style={styles.container} space={4} p={4}>
                <HStack space={3} alignItems="center">
                    <Pressable onPress={pickImage}>
                        <Image
                            source={{ uri: localData.profilePicture || 'https://via.placeholder.com/150' }}
                            alt="Profile Picture"
                            size="xl"
                            borderRadius={100}
                            style={styles.profileImage}
                        />
                        <Text style={styles.changePhotoText}>Change Photo</Text>
                    </Pressable>
                    <VStack>
                        {localData.profileType === 'personal' ? (
                            <>
                                <Text style={styles.nameText}>{localData.fullName || "Your Name"}</Text>
                                <Text style={styles.subText}>{localData.username || "Username"}</Text>
                            </>
                        ) : (
                            <>
                                <Text style={styles.nameText}>{localData.businessName || "Business Name"}</Text>
                                <Text style={styles.subText}>{localData.businessEmail || "Business Email"}</Text>
                            </>
                        )}
                    </VStack>
                </HStack>

                {/* Switch Profile Button */}
                {editMode && (
                    <Pressable
                        onPress={() =>
                            setLocalData({
                                ...localData,
                                profileType: localData.profileType === 'personal' ? 'business' : 'personal'
                            })
                        }
                        style={switchStyles.switchButton}
                    >
                        <Text style={switchStyles.switchButtonText}>
                            Switch to {localData.profileType === 'personal' ? 'Business Account' : 'Personal Account'}
                        </Text>
                    </Pressable>
                )}

                {/* Main Profile Content */}
                {!editMode ? (
                    <>
                        {localData.profileType === 'personal' ? (
                            <>
                                <Box style={styles.infoBox}>
                                    <Text style={styles.infoLabel}>Age:</Text>
                                    <Text style={styles.infoText}>{localData.age}</Text>
                                </Box>
                                <Box style={styles.infoBox}>
                                    <Text style={styles.infoLabel}>Gender:</Text>
                                    <Text style={styles.infoText}>{localData.gender}</Text>
                                </Box>
                                <Box style={styles.infoBox}>
                                    <Text style={styles.infoLabel}>Location:</Text>
                                    <Text style={styles.infoText}>{localData.city}, {localData.state} {localData.zipCode}</Text>
                                </Box>
                                <Box style={styles.infoBox}>
                                    <Text style={styles.infoLabel}>Short Description:</Text>
                                    <Text style={styles.infoText}>{localData.shortDescription || ''}</Text>
                                </Box>
                                <Box style={styles.infoBox}>
                                    <Text style={styles.infoLabel}>Interests:</Text>
                                    <Text style={styles.infoText}>{localData.interests ? localData.interests.join(', ') : ''}</Text>
                                </Box>
                            </>
                        ) : (
                            <>
                                <Box style={styles.infoBox}>
                                    <Text style={styles.infoLabel}>Business Name:</Text>
                                    <Text style={styles.infoText}>{localData.businessName}</Text>
                                </Box>
                                <Box style={styles.infoBox}>
                                    <Text style={styles.infoLabel}>Username:</Text>
                                    <Text style={styles.infoText}>{localData.username}</Text>
                                </Box>
                                <Box style={styles.infoBox}>
                                    <Text style={styles.infoLabel}>Business Phone:</Text>
                                    <Text style={styles.infoText}>{localData.businessPhone}</Text>
                                </Box>
                                <Box style={styles.infoBox}>
                                    <Text style={styles.infoLabel}>Business Email:</Text>
                                    <Text style={styles.infoText}>{localData.businessEmail}</Text>
                                </Box>
                                <Box style={styles.infoBox}>
                                    <Text style={styles.infoLabel}>Short Description:</Text>
                                    <Text style={styles.infoText}>{localData.shortDescription || ''}</Text>
                                </Box>
                                <Box style={styles.infoBox}>
                                    <Text style={styles.infoLabel}>Select the niche(s) you cater to:</Text>
                                    <Text style={styles.infoText}>{localData.servicesOffered ? localData.servicesOffered.join(', ') : ''}</Text>
                                </Box>
                                <Box style={styles.infoBox}>
                                    <Text style={styles.infoLabel}>Location:</Text>
                                    <Text style={styles.infoText}>{localData.city}, {localData.state} {localData.zipCode}</Text>
                                </Box>
                            </>
                        )}
                        <Pressable style={editButtonStyles.button} onPress={() => setEditMode(true)}>
                            <Text style={editButtonStyles.buttonText}>Edit Profile</Text>
                        </Pressable>
                    </>
                ) : (
                    <>
                        {localData.profileType === 'personal' ? (
                            <>
                                <FormControl isRequired>
                                    <FormControl.Label>Full Name</FormControl.Label>
                                    <Input
                                        value={localData.fullName}
                                        onChangeText={(text) => setLocalData({ ...localData, fullName: text })}
                                    />
                                </FormControl>
                                <FormControl isRequired>
                                    <FormControl.Label>Username</FormControl.Label>
                                    <Input
                                        value={localData.username}
                                        onChangeText={(text) => setLocalData({ ...localData, username: text })}
                                    />
                                </FormControl>
                                <FormControl>
                                    <FormControl.Label>Short Description</FormControl.Label>
                                    <Input
                                        value={localData.shortDescription}
                                        onChangeText={(text) => setLocalData({ ...localData, shortDescription: text })}
                                    />
                                </FormControl>
                                <FormControl isRequired>
                                    <FormControl.Label>Age</FormControl.Label>
                                    <Input
                                        keyboardType="numeric"
                                        value={localData.age?.toString()}
                                        onChangeText={(text) => setLocalData({ ...localData, age: text })}
                                    />
                                </FormControl>
                                <FormControl isRequired>
                                    <FormControl.Label>Gender</FormControl.Label>
                                    <Select
                                        selectedValue={localData.gender}
                                        minWidth="200"
                                        accessibilityLabel="Select Gender"
                                        placeholder="Select Gender"
                                        _selectedItem={{
                                            bg: "primary.500",
                                            endIcon: <CheckIcon size="5" />,
                                        }}
                                        onValueChange={(value) => setLocalData({ ...localData, gender: value })}
                                    >
                                        <Select.Item label="Male" value="male" />
                                        <Select.Item label="Female" value="female" />
                                    </Select>
                                </FormControl>
                                <FormControl isRequired>
                                    <FormControl.Label>City</FormControl.Label>
                                    <Input
                                        value={localData.city}
                                        onChangeText={(text) => setLocalData({ ...localData, city: text })}
                                    />
                                </FormControl>
                                <FormControl isRequired>
                                    <FormControl.Label>State</FormControl.Label>
                                    <Input
                                        value={localData.state}
                                        onChangeText={(text) => setLocalData({ ...localData, state: text })}
                                    />
                                </FormControl>
                                <FormControl isRequired>
                                    <FormControl.Label>ZIP Code</FormControl.Label>
                                    <Input
                                        value={localData.zipCode}
                                        onChangeText={(text) => setLocalData({ ...localData, zipCode: text })}
                                    />
                                </FormControl>
                                <FormControl isRequired>
                                    <FormControl.Label>Interests</FormControl.Label>
                                    {Object.entries(CATEGORIZED_INTERESTS).map(([category, interests]) => (
                                        <CollapsibleCategory
                                            key={category}
                                            category={category}
                                            interests={interests}
                                            selectedInterests={localData.interests || []}
                                            onToggle={(interest, isSelected) => {
                                                let newInterests = localData.interests || [];
                                                if (isSelected) {
                                                    newInterests = [...newInterests, interest];
                                                } else {
                                                    newInterests = newInterests.filter(i => i !== interest);
                                                }
                                                setLocalData({ ...localData, interests: newInterests });
                                            }}
                                        />
                                    ))}
                                </FormControl>
                                <FormControl>
                                    <FormControl.Label>Profile Picture URL</FormControl.Label>
                                    <Input
                                        value={localData.profilePicture}
                                        onChangeText={(text) => setLocalData({ ...localData, profilePicture: text })}
                                    />
                                </FormControl>
                            </>
                        ) : (
                            <>
                                <FormControl isRequired>
                                    <FormControl.Label>Business Name</FormControl.Label>
                                    <Input
                                        value={localData.businessName}
                                        onChangeText={(text) => setLocalData({ ...localData, businessName: text })}
                                    />
                                </FormControl>
                                <FormControl isRequired>
                                    <FormControl.Label>Username</FormControl.Label>
                                    <Input
                                        value={localData.username}
                                        onChangeText={(text) => setLocalData({ ...localData, username: text })}
                                    />
                                </FormControl>
                                <FormControl isRequired>
                                    <FormControl.Label>Business Phone</FormControl.Label>
                                    <Input
                                        keyboardType="phone-pad"
                                        value={localData.businessPhone}
                                        onChangeText={(text) => setLocalData({ ...localData, businessPhone: text })}
                                    />
                                </FormControl>
                                <FormControl isRequired>
                                    <FormControl.Label>Business Email</FormControl.Label>
                                    <Input
                                        keyboardType="email-address"
                                        value={localData.businessEmail}
                                        onChangeText={(text) => setLocalData({ ...localData, businessEmail: text })}
                                    />
                                </FormControl>
                                <FormControl>
                                    <FormControl.Label>Short Description</FormControl.Label>
                                    <Input
                                        value={localData.shortDescription}
                                        onChangeText={(text) => setLocalData({ ...localData, shortDescription: text })}
                                    />
                                </FormControl>
                                <FormControl isRequired>
                                    <FormControl.Label>Services Offered</FormControl.Label>
                                    {Object.entries(CATEGORIZED_INTERESTS).map(([category, interests]) => (
                                        <CollapsibleCategory
                                            key={category}
                                            category={category}
                                            interests={interests}
                                            selectedInterests={localData.servicesOffered || []}
                                            onToggle={(interest, isSelected) => {
                                                let newServices = localData.servicesOffered || [];
                                                if (isSelected) {
                                                    newServices = [...newServices, interest];
                                                } else {
                                                    newServices = newServices.filter(i => i !== interest);
                                                }
                                                setLocalData({ ...localData, servicesOffered: newServices });
                                            }}
                                        />
                                    ))}
                                </FormControl>
                                <FormControl isRequired>
                                    <FormControl.Label>City</FormControl.Label>
                                    <Input
                                        value={localData.city}
                                        onChangeText={(text) => setLocalData({ ...localData, city: text })}
                                    />
                                </FormControl>
                                <FormControl isRequired>
                                    <FormControl.Label>State</FormControl.Label>
                                    <Input
                                        value={localData.state}
                                        onChangeText={(text) => setLocalData({ ...localData, state: text })}
                                    />
                                </FormControl>
                                <FormControl isRequired>
                                    <FormControl.Label>ZIP Code</FormControl.Label>
                                    <Input
                                        value={localData.zipCode}
                                        onChangeText={(text) => setLocalData({ ...localData, zipCode: text })}
                                    />
                                </FormControl>
                                <FormControl>
                                    <FormControl.Label>Profile Picture URL</FormControl.Label>
                                    <Input
                                        value={localData.profilePicture}
                                        onChangeText={(text) => setLocalData({ ...localData, profilePicture: text })}
                                    />
                                </FormControl>
                            </>
                        )}
                        <HStack space={2} mt={4}>
                            <Button onPress={handleUpdate}>Save</Button>
                            <Button variant="outline" onPress={() => setEditMode(false)}>Cancel</Button>
                        </HStack>
                    </>
                )}
            </VStack>
        </ScrollView>
    );
}

// export default ProfilePage;

const switchStyles = StyleSheet.create({
    switchButton: {
        backgroundColor: '#3498db',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 30,
        alignSelf: 'center',
        marginVertical: 10,
    },
    switchButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

const editButtonStyles = StyleSheet.create({
    button: {
        backgroundColor: '#0088cc',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 30,
        alignSelf: 'center',
        marginTop: 20,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});

const styles = StyleSheet.create({
    scrollContainer: {
        backgroundColor: '#f2f2f2',
    },
    header: {
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
    },
    logoutText: {
        fontSize: 16,
        color: '#3498db',
    },
    profileImage: {
        borderWidth: 2,
        borderColor: '#3498db',
    },
    changePhotoText: {
        textAlign: 'center',
        color: '#3498db',
        marginTop: 5,
        fontSize: 14,
    },
    nameText: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    subText: {
        fontSize: 16,
        color: '#777',
    },
    infoBox: {
        marginVertical: 4,
    },
    infoLabel: {
        fontSize: 14,
        color: '#333',
        fontWeight: '600',
    },
    infoText: {
        fontSize: 16,
        color: '#555',
    },
});
