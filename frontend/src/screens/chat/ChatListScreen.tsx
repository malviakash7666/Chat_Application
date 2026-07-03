import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../../navigation/AppNavigator';
import socketService from '../../services/socket';
import { messageApi, Conversation } from '../../api/messageApi';
import { authApi } from '../../api/authApi';
import { User } from '../../types/auth.types';
import { formatTime } from '../../utils/helpers';

interface ChatListScreenProps {
  navigation: NativeStackNavigationProp<AppStackParamList, 'ChatList'>;
}

interface OnlineUser {
  userId: number;
  username: string;
}

export default function ChatListScreen({ navigation }: ChatListScreenProps) {
  const { logout, user } = useAuth();
  
  // State variables
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generalLastMsg, setGeneralLastMsg] = useState<{ content: string; createdAt: string; senderName: string } | null>(null);

  // Set header options
  useEffect(() => {
    navigation.setOptions({
      headerTitle: 'Chats',
      headerRight: () => (
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      )
    });
  }, [navigation, logout]);

  // Load chat list data
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch all registered users
      const usersRes = await authApi.getUsers();
      if (usersRes.success) {
        setAllUsers(usersRes.data);
      }

      // Fetch active conversations
      const convsRes = await messageApi.getConversations();
      if (convsRes.success) {
        setConversations(convsRes.data);
      }

      // Fetch general group chat last message
      const generalMsgs = await messageApi.getMessages();
      if (generalMsgs.success && generalMsgs.data.length > 0) {
        const last = generalMsgs.data[generalMsgs.data.length - 1];
        setGeneralLastMsg({
          content: last.content,
          createdAt: last.createdAt,
          senderName: last.sender?.username || 'User'
        });
      }
    } catch (error) {
      console.error('Failed to load chat list data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribeFocus = navigation.addListener('focus', loadData);

    // Socket.io active users synchronization
    const unsubscribeActiveUsers = socketService.onActiveUsers((users) => {
      const filtered = users.filter((u) => u.userId !== user?.id);
      setOnlineUsers(filtered);
    });

    // Real-time socket message delivery updating chat list previews
    const unsubscribeMessage = socketService.onReceiveMessage((msg) => {
      // Reload conversations list on new message
      loadData();
    });

    return () => {
      unsubscribeFocus();
      unsubscribeActiveUsers();
      unsubscribeMessage();
    };
  }, [navigation, user]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getAvatarColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = ['#075E54', '#128C7E', '#25D366', '#34B7F1', '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3'];
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  // Determine if a specific user is currently online
  const isUserOnline = (userId: number) => {
    return onlineUsers.some((u) => u.userId === userId);
  };

  // Filtered lists based on search
  const filteredUsers = allUsers.filter((u) => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderOnlineUser = ({ item }: { item: OnlineUser }) => (
    <TouchableOpacity 
      style={styles.onlineAvatarContainer}
      onPress={() => navigation.navigate('ChatRoom', { userId: item.userId, username: item.username })}
    >
      <View style={[styles.onlineAvatar, { backgroundColor: getAvatarColor(item.username) }]}>
        <Text style={styles.onlineAvatarText}>{item.username[0].toUpperCase()}</Text>
        <View style={styles.onlineBadge} />
      </View>
      <Text style={styles.onlineAvatarName} numberOfLines={1}>{item.username}</Text>
    </TouchableOpacity>
  );

  // Render direct chat conversation card
  const renderConversationItem = ({ item }: { item: Conversation }) => {
    const isOnline = isUserOnline(item.user.id);
    const partnerName = item.user.username;
    
    return (
      <TouchableOpacity
        style={styles.chatCard}
        onPress={() => navigation.navigate('ChatRoom', { userId: item.user.id, username: partnerName })}
      >
        <View style={[styles.avatar, { backgroundColor: getAvatarColor(partnerName) }]}>
          <Text style={styles.avatarText}>{partnerName[0].toUpperCase()}</Text>
          {isOnline && <View style={styles.onlineBadge} />}
        </View>
        <View style={styles.chatDetails}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName}>{partnerName}</Text>
            <Text style={styles.chatTime}>{formatTime(item.lastMessage.createdAt)}</Text>
          </View>
          <Text style={styles.chatLastMessage} numberOfLines={1}>
            {item.lastMessage.senderId === user?.id ? 'You: ' : ''}{item.lastMessage.content}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Render user row from search results
  const renderUserItem = ({ item }: { item: User }) => {
    const isOnline = isUserOnline(item.id);
    return (
      <TouchableOpacity
        style={styles.chatCard}
        onPress={() => navigation.navigate('ChatRoom', { userId: item.id, username: item.username })}
      >
        <View style={[styles.avatar, { backgroundColor: getAvatarColor(item.username) }]}>
          <Text style={styles.avatarText}>{item.username[0].toUpperCase()}</Text>
          {isOnline && <View style={styles.onlineBadge} />}
        </View>
        <View style={styles.chatDetails}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName}>{item.username}</Text>
            {isOnline && <Text style={styles.onlineStatusText}>Online</Text>}
          </View>
          <Text style={styles.chatEmailText}>{item.email || 'No email provided'}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#075E54" />
        <Text style={styles.loadingText}>Loading chats...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search Input Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search registered members..."
          placeholderTextColor="#999999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
      </View>

      {searchQuery.trim().length === 0 ? (
        // Standard View: Online members + Recent Chats + General Group Chat
        <>
          {/* Online Users List */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Online Now ({onlineUsers.length})</Text>
          </View>
          {onlineUsers.length > 0 ? (
            <FlatList
              data={onlineUsers}
              keyExtractor={(item) => `online-${item.userId}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={renderOnlineUser}
              contentContainerStyle={styles.onlineList}
            />
          ) : (
            <View style={styles.noOnlineContainer}>
              <Text style={styles.noOnlineText}>No other members are online</Text>
            </View>
          )}

          {/* Conversations Section */}
          <View style={styles.conversationsHeader}>
            <Text style={styles.sectionTitle}>Conversations</Text>
          </View>

          <FlatList
            data={conversations}
            keyExtractor={(item) => `conv-${item.user.id}`}
            renderItem={renderConversationItem}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            ListHeaderComponent={
              /* Pinned General Group Chat Card */
              <TouchableOpacity
                style={styles.chatCard}
                onPress={() => navigation.navigate('ChatRoom', { username: 'General Group Chat' })}
              >
                <View style={styles.groupAvatar}>
                  <Text style={styles.groupAvatarText}>👥</Text>
                </View>
                <View style={styles.chatDetails}>
                  <View style={styles.chatHeader}>
                    <Text style={styles.chatName}>General Group Chat</Text>
                    {generalLastMsg && (
                      <Text style={styles.chatTime}>{formatTime(generalLastMsg.createdAt)}</Text>
                    )}
                  </View>
                  <Text style={styles.chatLastMessage} numberOfLines={1}>
                    {generalLastMsg 
                      ? `${generalLastMsg.senderName}: ${generalLastMsg.content}` 
                      : 'No messages yet. Start chatting!'}
                  </Text>
                </View>
              </TouchableOpacity>
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No private conversations yet.</Text>
                <Text style={styles.emptySubtext}>Use the search bar above to find members and start chatting!</Text>
              </View>
            }
          />
        </>
      ) : (
        // Search Results View: Filtered Registered Members
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => `search-user-${item.id}`}
          renderItem={renderUserItem}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No members match "{searchQuery}"</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666666',
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    backgroundColor: '#054C43',
  },
  logoutText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F5F5F7',
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
  },
  searchInput: {
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#075E54',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  onlineList: {
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  onlineAvatarContainer: {
    alignItems: 'center',
    width: 70,
    marginHorizontal: 4,
  },
  onlineAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  onlineAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#25D366',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  onlineAvatarName: {
    fontSize: 11,
    color: '#333333',
    marginTop: 4,
    textAlign: 'center',
    width: '100%',
  },
  noOnlineContainer: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 8,
  },
  noOnlineText: {
    color: '#999999',
    fontSize: 13,
  },
  conversationsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  chatCard: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    alignItems: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  groupAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E7F2F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupAvatarText: {
    fontSize: 22,
  },
  chatDetails: {
    flex: 1,
    marginLeft: 12,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111111',
  },
  chatTime: {
    fontSize: 12,
    color: '#8C8C8C',
  },
  chatLastMessage: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  chatEmailText: {
    fontSize: 13,
    color: '#8C8C8C',
    marginTop: 4,
  },
  onlineStatusText: {
    fontSize: 12,
    color: '#25D366',
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666666',
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 20,
  },
});
