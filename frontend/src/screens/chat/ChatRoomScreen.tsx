import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useRoute, RouteProp } from '@react-navigation/native';
import { AppStackParamList } from '../../navigation/AppNavigator';
import { messageApi } from '../../api/messageApi';
import { Message } from '../../types/message.types';
import MessageBubble from '../../components/MessageBubble';
import InputBox from '../../components/InputBox';
import Loader from '../../components/Loader';
import socketService from '../../services/socket';

export default function ChatRoomScreen() {
  const { user } = useAuth();
  const route = useRoute<RouteProp<AppStackParamList, 'ChatRoom'>>();
  const { userId: receiverId, username: chatTitle } = route.params;

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<Record<number, string>>({});
  const flatListRef = useRef<FlatList>(null);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const res = await messageApi.getMessages(receiverId);
      if (res.success && res.data) {
        setMessages(res.data);
      }
    } catch (err) {
      console.error('Failed to load chat room messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();

    // Listen to real-time events from Socket.io
    const unsubscribeMessage = socketService.onReceiveMessage((newMessage) => {
      // Append only if the message belongs to this conversation
      const isGeneralChat = !receiverId && !newMessage.receiverId;
      const isDirectChat = receiverId && newMessage.receiverId && (
        (newMessage.senderId === user?.id && newMessage.receiverId === receiverId) ||
        (newMessage.senderId === receiverId && newMessage.receiverId === user?.id)
      );

      if (isGeneralChat || isDirectChat) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMessage.id)) return prev;
          return [...prev, newMessage];
        });
      }
    });

    const unsubscribeTyping = socketService.onTyping((data) => {
      // Show typing indicator only if it's the partner (in DM) or someone else (in General)
      const isRelevant = receiverId 
        ? data.userId === receiverId 
        : data.userId !== user?.id; // In general chat, show if anyone else is typing

      if (isRelevant) {
        setTypingUsers((prev) => ({
          ...prev,
          [data.userId]: data.username
        }));
      }
    });

    const unsubscribeStopTyping = socketService.onStopTyping((data) => {
      setTypingUsers((prev) => {
        const updated = { ...prev };
        delete updated[data.userId];
        return updated;
      });
    });

    return () => {
      unsubscribeMessage();
      unsubscribeTyping();
      unsubscribeStopTyping();
    };
  }, [receiverId, user]);

  const scrollToBottom = () => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  };

  const handleSend = async (content: string) => {
    if (!user) return;
    
    // Optimistic UI update
    const tempId = Date.now();
    const optimisticMessage: Message = {
      id: tempId,
      senderId: user.id,
      receiverId: receiverId,
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sender: user
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    scrollToBottom();

    try {
      const res = await messageApi.sendMessage(user.id, content, receiverId);
      if (res.success && res.data) {
        // Replace the optimistic message with the database record
        setMessages((prev) => 
          prev.map((msg) => msg.id === tempId ? res.data : msg)
        );
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
    }
  };

  const handleTyping = () => {
    if (!user) return;
    socketService.emitTyping(user.id, user.username, receiverId);
  };

  const handleStopTyping = () => {
    if (!user) return;
    socketService.emitStopTyping(user.id, receiverId);
  };

  if (loading) {
    return <Loader message="Loading messages..." />;
  }

  const typingList = Object.values(typingUsers);

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.select({ ios: 90, android: 80 })}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <MessageBubble 
              message={item} 
              isCurrentUser={item.senderId === user?.id} 
            />
          )}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={scrollToBottom}
          onLayout={scrollToBottom}
        />

        {/* Typing indicator bar */}
        {typingList.length > 0 && (
          <View style={styles.typingIndicatorContainer}>
            <Text style={styles.typingText}>
              {typingList.join(', ')} {typingList.length === 1 ? 'is' : 'are'} typing...
            </Text>
          </View>
        )}

        <InputBox
          onSend={handleSend}
          onTyping={handleTyping}
          onStopTyping={handleStopTyping}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E5DDD5', // WhatsApp background gray-brown
  },
  keyboardContainer: {
    flex: 1,
  },
  messageList: {
    paddingVertical: 12,
  },
  typingIndicatorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  typingText: {
    fontSize: 12,
    color: '#075E54',
    fontStyle: 'italic',
    fontWeight: '500',
  },
});
