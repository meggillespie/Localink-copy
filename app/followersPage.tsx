// app/followersPage.tsx
import React, { useState, useMemo } from 'react';
import { FlatList, StyleSheet, Image as RNImage } from 'react-native';
import {
    Box,
    CheckIcon,
    HStack,
    Pressable,
    Select,
    Text,
    VStack,
    Wrap,
    useToast,
    Input,
} from 'native-base';
import { useRouter } from 'expo-router';

// Dummy data for followers and following (replace with real data)
const dummyFollowers = [
    { id: '1', name: 'Alice Johnson', username: 'alicej', city: 'New York', state: 'NY', profileType: 'personal', gender: 'female', interests: ['Yoga', 'Photography'], avatar: 'https://via.placeholder.com/100/FF0000/FFFFFF?text=A' },
    { id: '2', name: 'Bob Smith', username: 'bobsmith', city: 'Los Angeles', state: 'CA', profileType: 'business', gender: 'male', interests: ['Coding', 'Hiking'], avatar: 'https://via.placeholder.com/100/00FF00/FFFFFF?text=B' },
    { id: '3', name: 'Charlie Davis', username: 'charlied', city: 'Chicago', state: 'IL', profileType: 'personal', gender: 'male', interests: ['Martial arts', 'Travel'], avatar: 'https://via.placeholder.com/100/0000FF/FFFFFF?text=C' },
];

const dummyFollowing = [
    { id: '4', name: 'Diana Prince', username: 'dianap', city: 'San Francisco', state: 'CA', profileType: 'personal', gender: 'female', interests: ['Yoga', 'Travel'], avatar: 'https://via.placeholder.com/100/FFC0CB/FFFFFF?text=D' },
    { id: '5', name: 'Ethan Hunt', username: 'ethanh', city: 'Boston', state: 'MA', profileType: 'business', gender: 'male', interests: ['Running', 'Martial arts'], avatar: 'https://via.placeholder.com/100/FFFF00/000000?text=E' },
];

// List of all interests available for filtering.
const ALL_INTERESTS = [
    "Local Sports", "Endurance sports", "Running", "Trail running", "Marathon", "Ultramarathon",
    "Adventure racing", "Jogging", "Walking", "Cycling", "Swimming", "Health", "Fitness", "Yoga",
    "Pilates", "Aerobics", "Kickboxing", "Martial arts", "Karate", "Tae kwon do", "Brazilian jiu-jitsu",
    "MMA", "Boxing", "Hiking", "Inline skating", "Rollerblading", "Rock climbing", "Kayaking",
    "Canoeing", "Paddleboarding", "Orienteering", "Mountain biking", "Horseback riding",
    "Soccer", "Basketball", "Volleyball", "Football", "Flag football", "Baseball", "Softball",
    "Tennis", "Badminton", "Table tennis", "Cricket", "Rugby", "Ultimate frisbee", "Drawing", "Painting", "Sketching",
    "Calligraphy", "Digital art", "Photography", "Crafting", "DIY", "Scrapbooking", "Knitting", "Crocheting",
    "Sewing", "Quilting", "Embroidery", "Jewelry making", "Woodworking", "Paper crafts", "Origami",
    "Pottery", "Clay Sculpting", "Candle Making", "DIY projects", "Collage", "Mixed media art",
    "Recycling projects", "Model building", "Floral arranging", "Music", "Performing Arts", "Piano", "Guitar",
    "Drums", "Violin", "Flute", "Ukulele", "Saxophone", "Keyboard", "Harmonica", "Choir singing", "Solo singing",
    "Karaoke", "Vocal training", "Theater", "Ballet", "Jazz", "Hip hop", "Contemporary", "Tap dance",
    "Ballroom dance", "Folk dance", "Line dancing", "Community theater", "Improv", "Acting", "Puppetry",
    "Stage performance", "Storytelling", "Musical theater", "Magic", "Mime", "Juggling", "Stand-up comedy",
    "Reading: Fiction", "Reading: Non-fiction", "Comics", "Graphic novels", "Poetry",
    "Writing", "Creative writing", "Journaling", "Fan fiction",
];

interface Follower {
    id: string;
    name: string;
    username: string;
    city: string;
    state: string;
    profileType: 'personal' | 'business';
    gender: string;
    interests: string[];
    avatar: string;
}

// TypeaheadMultiSelect Component
const TypeaheadMultiSelect: React.FC<{
    availableOptions: string[];
    selectedOptions: string[];
    onChange: (selected: string[]) => void;
}> = ({ availableOptions, selectedOptions, onChange }) => {
    const [inputValue, setInputValue] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    const filteredOptions = availableOptions.filter(option =>
        option.toLowerCase().includes(inputValue.toLowerCase()) &&
        !selectedOptions.includes(option)
    );

    const addOption = (option: string) => {
        onChange([...selectedOptions, option]);
        setInputValue('');
        setShowSuggestions(false);
    };

    const removeOption = (option: string) => {
        onChange(selectedOptions.filter(item => item !== option));
    };

    return (
        <Box>
            <Input
                placeholder="Type to search interests..."
                value={inputValue}
                onChangeText={(text) => {
                    setInputValue(text);
                    setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />
            {showSuggestions && inputValue.length > 0 && (
                <Box style={typeaheadStyles.suggestionBox}>
                    {filteredOptions.length === 0 ? (
                        <Text style={typeaheadStyles.noSuggestions}>No suggestions</Text>
                    ) : (
                        filteredOptions.map(option => (
                            <Pressable key={option} onPress={() => addOption(option)} style={typeaheadStyles.suggestionItem}>
                                <Text>{option}</Text>
                            </Pressable>
                        ))
                    )}
                </Box>
            )}
            <Wrap space={2} mt={2}>
                {selectedOptions.map(option => (
                    <Box key={option} style={typeaheadStyles.selectedChip}>
                        <Text style={typeaheadStyles.chipText}>{option}</Text>
                        <Pressable onPress={() => removeOption(option)}>
                            <Text style={typeaheadStyles.removeText}>×</Text>
                        </Pressable>
                    </Box>
                ))}
            </Wrap>
        </Box>
    );
};

const typeaheadStyles = StyleSheet.create({
    suggestionBox: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        maxHeight: 150,
        marginTop: 4,
    },
    suggestionItem: {
        padding: 8,
    },
    noSuggestions: {
        padding: 8,
        color: '#777',
    },
    selectedChip: {
        flexDirection: 'row',
        backgroundColor: '#3498db',
        borderRadius: 20,
        paddingVertical: 4,
        paddingHorizontal: 8,
        alignItems: 'center',
    },
    chipText: {
        color: '#fff',
        marginRight: 4,
    },
    removeText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

const FollowersPage: React.FC = () => {
    const router = useRouter();
    const toast = useToast();

    // Tab state: 'followers' or 'following'
    const [activeTab, setActiveTab] = useState<'followers' | 'following'>('followers');

    // Filter states
    const [accountTypeFilter, setAccountTypeFilter] = useState<'all' | 'personal' | 'business'>('all');
    const [genderFilter, setGenderFilter] = useState<string>('all');
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

    // Determine which dummy list to use based on activeTab
    const data: Follower[] = activeTab === 'followers' ? dummyFollowers : dummyFollowing;

    // Apply filters to data
    const filteredData = useMemo(() => {
        return data.filter(item => {
            if (accountTypeFilter !== 'all' && item.profileType !== accountTypeFilter) return false;
            if (genderFilter !== 'all' && item.gender !== genderFilter) return false;
            if (selectedInterests.length > 0 && !item.interests.some(interest => selectedInterests.includes(interest))) return false;
            return true;
        });
    }, [data, accountTypeFilter, genderFilter, selectedInterests]);

    // Render each profile card
    const renderItem = ({ item }: { item: Follower }) => (
        <Pressable
            style={styles.profileCard}
            onPress={() => router.push(`/gallery/${item.id}`)}
        >
            <RNImage
                source={{ uri: item.avatar }}
                style={styles.avatar}
            />
            <VStack ml={3}>
                <Text style={styles.profileName}>{item.name}</Text>
                <Text style={styles.username}>{item.username}</Text>
                <Text style={styles.location}>{item.city}, {item.state}</Text>
            </VStack>
        </Pressable>
    );

    return (
        <VStack flex={1} bg="#f2f2f2">
            {/* Tabs */}
            <HStack style={styles.tabContainer}>
                <Pressable
                    style={[
                        styles.tabButton,
                        activeTab === 'followers' && styles.activeTab,
                    ]}
                    onPress={() => setActiveTab('followers')}
                >
                    <Text style={activeTab === 'followers' ? styles.activeTabText : styles.tabText}>Followers</Text>
                </Pressable>
                <Pressable
                    style={[
                        styles.tabButton,
                        activeTab === 'following' && styles.activeTab,
                    ]}
                    onPress={() => setActiveTab('following')}
                >
                    <Text style={activeTab === 'following' ? styles.activeTabText : styles.tabText}>Following</Text>
                </Pressable>
            </HStack>

            {/* Filter Controls */}
            <VStack space={3} p={3} bg="#fff" borderBottomWidth={1} borderColor="#e0e0e0">
                <HStack space={2} alignItems="center">
                    <Text style={styles.filterLabel}>Account Type:</Text>
                    <Select
                        selectedValue={accountTypeFilter}
                        minWidth="120"
                        accessibilityLabel="Filter by Account Type"
                        placeholder="Account Type"
                        _selectedItem={{
                            bg: "primary.500",
                            endIcon: <CheckIcon size="5" />,
                        }}
                        onValueChange={value => setAccountTypeFilter(value)}
                    >
                        <Select.Item label="All" value="all" />
                        <Select.Item label="Personal" value="personal" />
                        <Select.Item label="Business" value="business" />
                    </Select>
                </HStack>
                <HStack space={2} alignItems="center">
                    <Text style={styles.filterLabel}>Gender:</Text>
                    <Select
                        selectedValue={genderFilter}
                        minWidth="120"
                        accessibilityLabel="Filter by Gender"
                        placeholder="Gender"
                        _selectedItem={{
                            bg: "primary.500",
                            endIcon: <CheckIcon size="5" />,
                        }}
                        onValueChange={value => setGenderFilter(value)}
                    >
                        <Select.Item label="All" value="all" />
                        <Select.Item label="Male" value="male" />
                        <Select.Item label="Female" value="female" />
                    </Select>
                </HStack>
                <HStack space={2} alignItems="center">
                    <Text style={styles.filterLabel}>Interests:</Text>
                    <TypeaheadMultiSelect
                        availableOptions={ALL_INTERESTS}
                        selectedOptions={selectedInterests}
                        onChange={setSelectedInterests}
                    />
                </HStack>
            </VStack>

            {/* List of Profiles */}
            <FlatList
                data={filteredData}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
            />
        </VStack>
    );
};

export default FollowersPage;

const styles = StyleSheet.create({
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        marginHorizontal: 10,
        borderRadius: 8,
        overflow: 'hidden',
        marginTop: 10,
        marginBottom: 5,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
    },
    activeTab: {
        backgroundColor: '#3498db',
    },
    tabText: {
        fontSize: 16,
        color: '#3498db',
    },
    activeTabText: {
        fontSize: 16,
        color: '#fff',
        fontWeight: 'bold',
    },
    filterLabel: {
        fontSize: 14,
        color: '#333',
    },
    listContainer: {
        padding: 10,
    },
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    profileName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    username: {
        fontSize: 12,
        color: '#777',
    },
    location: {
        fontSize: 14,
        color: '#555',
    },
});
