import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Message } from '../types/message.types';
import { formatTime } from '../utils/helpers';

interface MessageBubbleProps {
  message: Message;
  isCurrentUser: boolean;
}

export default function MessageBubble({ message, isCurrentUser }: MessageBubbleProps) {
  const timeStr = formatTime(message.createdAt);
  const senderName = message.sender?.username || 'User';

  return (
    <View style={[
      styles.container,
      isCurrentUser ? styles.currentUserContainer : styles.otherUserContainer
    ]}>
      <View style={[
        styles.bubble,
        isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble
      ]}>
        {!isCurrentUser && (
          <Text style={styles.senderText}>{senderName}</Text>
        )}
        <Text style={styles.messageText}>{message.content}</Text>
        <Text style={styles.timeText}>{timeStr}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    width: '100%',
    flexDirection: 'row',
  },
  currentUserContainer: {
    justifyContent: 'flex-end',
  },
  otherUserContainer: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  currentUserBubble: {
    backgroundColor: '#E7FFDB',
    borderTopRightRadius: 2,
    marginRight: 12,
  },
  otherUserBubble: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 2,
    marginLeft: 12,
  },
  senderText: {
    fontSize: 12,
    color: '#075E54',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    color: '#111111',
    lineHeight: 20,
    marginBottom: 2,
  },
  timeText: {
    fontSize: 10,
    color: '#8c8c8c',
    alignSelf: 'flex-end',
  },
});
