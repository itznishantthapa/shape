import { StyleSheet, Text, View, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Keyboard, Animated, StatusBar } from 'react-native'
import React, { useEffect, useState, useRef } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { getAccessToken } from '../utils/secureStorage'
import { getCache, setCache } from '../utils/cache'       
import { checkNetStatus } from '../utils/netStatus'
// Custom typing indicator component
const TypingIndicator = ({ isTyping }) => {
  // References for the three animated dots
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  // Animation sequence for the dots
  const animateDots = () => {
    const duration = 300;
    const animations = [
      Animated.sequence([
        Animated.timing(dot1, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(dot1, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(dot2, {
          toValue: 1,
          duration,
          delay: 150,
          useNativeDriver: true,
        }),
        Animated.timing(dot2, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(dot3, {
          toValue: 1,
          duration,
          delay: 300,
          useNativeDriver: true,
        }),
        Animated.timing(dot3, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        }),
      ]),
    ];

    Animated.loop(Animated.stagger(150, animations), {
      iterations: -1,
    }).start();
  };

  // Start animation when component mounts
  useEffect(() => {
    animateDots();
  }, []);

  return (
    <View style={styles.typingContainer}>
      <View style={styles.typingBubble}>
        <Animated.View
          style={[
            styles.typingDot,
            {
              transform: [
                {
                  translateY: dot1.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -5],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.typingDot,
            {
              transform: [
                {
                  translateY: dot2.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -5],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View
          style={[
            styles.typingDot,
            {
              transform: [
                {
                  translateY: dot3.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -5],
                  }),
                },
              ],
            },
          ]}
        />
      </View>
    </View>
  );
};

const Inbox = ({ route, navigation }) => {
  const { user, roomName, currentUser, privateChats } = route.params;

  
  // Sort and reverse initial messages to show newest messages at the top
  // const sortedInitialMessages = [...(initialMessages || [])]
  //   .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
  //   .reverse();
  
  const [messages, setMessages] = useState(privateChats);
  const [message, setMessage] = useState('');
  const socket = useRef(null);
  const typingTimeoutRef = useRef(null);
  const flatListRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  const keyboardHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener('keyboardWillShow', e => {
      Animated.timing(keyboardHeight, {
        toValue: e.endCoordinates.height,
        duration: e.duration,
        useNativeDriver: false,
      }).start();
    });

    const keyboardWillHide = Keyboard.addListener('keyboardWillHide', e => {
      Animated.timing(keyboardHeight, {
        toValue: 0,
        duration: e.duration,
        useNativeDriver: false,
      }).start();
    });

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  useEffect(() => {
    const connectWebSocket = async () => {
      try {
        socket.current = new WebSocket(`ws://192.168.1.72:8000/ws/chat/${roomName}/`);
        
        socket.current.onopen = () => {
          console.log("Connected to WebSocket");
        };

        socket.current.onmessage = (event) => {
          const data = JSON.parse(event.data);
          console.log("Received:", data);

          if (data?.event_type === 'message') {
            const newMessage = {
              id: data.id,
              message: data.message,
              sender: data.sender,
              timestamp: data.timestamp
            };
            addMessage(newMessage);
             appendToCache(newMessage);
          }
          else if (data?.event_type === 'typing') {
            setIsTyping(data?.is_typing);
          }
        };

        socket.current.onerror = (e) => {
          console.log('WebSocket error:', e)
        };

        socket.current.onclose = (e) => {
          console.log("WebSocket closed:", e.code);
        };

      } catch (error) {
        console.log('Error connecting to WebSocket:', error)
      }



    };



    connectWebSocket();

    return () => {
      if (socket.current) {
        socket.current.close();
      }
    };
  }, [roomName]);

  const appendToCache = async (newMessage) => {
    console.log('Appending to cache.........')
    const cachedMessages = await getCache(`private_chats_${roomName}`)
    if(cachedMessages){
      const ids = new Set(cachedMessages.map(msg => msg.id))
      const merged = ids.has(newMessage.id) ? cachedMessages : [newMessage,...cachedMessages]
      setCache(`private_chats_${roomName}`, merged)
      console.log('Appending to cache successfull')
    }}

    // const merged = ids.has(message.id) 
    // ? cachedMessages 
    // : [...cachedMessages, message]

  const addMessage = (msg) => {
    setMessages(prevMessages => [msg, ...prevMessages]);
  };

  const sendMessage = () => {
    if (!message.trim()) return;
    const messageData = {
      sender: currentUser.email,
      event_type: "message",
      message: message.trim(),
    };
    
    socket.current.send(JSON.stringify(messageData));
    setMessage('');
  };

  const onChangeText = async(text) => {
    const netStatus = await checkNetStatus()
    setMessage(text);
    if(!netStatus) return

    // Check if socket exists and is in OPEN state (readyState === 1)
    if (!socket.current || socket.current.readyState !== 1) {
      console.log('WebSocket is not connected, cannot send typing status');
      return;
    }

    try {
      socket.current.send(JSON.stringify({ event_type: "typing", is_typing: true }));
      
      // Clear any existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout using the ref
      typingTimeoutRef.current = setTimeout(() => {
        if (socket.current && socket.current.readyState === 1) {
          socket.current.send(JSON.stringify({ event_type: "typing", typing: false }));
        }
      }, 1000);
    } catch (error) {
      console.log('Error sending typing status:', error);
    }
  }

  // Clean up the timeout when component unmounts
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const renderMessage = ({ item }) => {

    const isOwnMessage = item.sender === currentUser.email;

    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        <Text style={[
          styles.messageText,
          isOwnMessage ? styles.ownMessageText : styles.otherMessageText
        ]}>
          {item.message}
        </Text>
        <View style={styles.messageFooter}>
          <Text style={[
            styles.timestamp,
            isOwnMessage ? styles.ownTimestamp : styles.otherTimestamp
          ]}>
            {item.timestamp}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle='dark-content' backgroundColor={"#643bc5"}/>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.first_name} {user?.last_name}</Text>
          <Text style={styles.statusText}>Online</Text>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Main container with absolute positioning for input */}
      <View style={styles.mainContainer}>
        {/* Messages container takes full available space */}
        <FlatList
          style={styles.flatList}
          inverted={true}
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id?.toString() || `msg_${item.timestamp}_${Math.random()}`}
          contentContainerStyle={styles.messagesContainer}
          removeClippedSubviews={false}
          showsVerticalScrollIndicator={true}
          ListHeaderComponent={isTyping ? <TypingIndicator isTyping={isTyping} /> : null}
        />

        {/* Input container fixed at the bottom */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          style={styles.keyboardAvoidingContainer}
        >
          <View style={styles.inputContainer}>
            <TouchableOpacity style={styles.attachButton}>
              <Ionicons name="add-circle" size={24} color="#9bcfab" />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              value={message}
              onChangeText={(e) => onChangeText(e)}
              placeholder="Type a message..."
              placeholderTextColor="rgba(155, 207, 171, 0.6)"
              multiline
              maxHeight={100}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                message.trim() ? styles.sendButtonActive : {}
              ]}
              onPress={sendMessage}
              disabled={!message.trim()}
            >
              <Ionicons
                name="send"
                size={20}
                color={message.trim() ? '#fff' : 'rgba(155, 207, 171, 0.6)'}
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  )
}

export default Inbox

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1835',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#643bc5',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(155, 207, 171, 0.2)',
    zIndex: 10,
  },
  backButton: {
    marginRight: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(28, 24, 53, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  statusText: {
    fontSize: 14,
    color: '#9bcfab',
  },
  moreButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(28, 24, 53, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#1c1835',
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 100,
    paddingTop: 80,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 2,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#643bc5',
    borderTopRightRadius: 4,
    marginLeft: 'auto',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(155, 207, 171, 0.15)',
    borderTopLeftRadius: 4,
    borderColor: 'rgba(155, 207, 171, 0.3)',
    borderWidth: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  ownMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#eedd70',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  timestamp: {
    fontSize: 11,
    marginLeft: 8,
  },
  ownTimestamp: {
    color: 'rgba(238, 221, 112, 0.8)',
  },
  otherTimestamp: {
    color: 'rgba(155, 207, 171, 0.8)',
  },
  keyboardAvoidingContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    backgroundColor:'#1c1835'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(28, 24, 53, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(100, 59, 197, 0.3)',
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(28, 24, 53, 0.8)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(100, 59, 197, 0.5)',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(28, 24, 53, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(100, 59, 197, 0.5)',
  },
  sendButtonActive: {
    backgroundColor: '#643bc5',
    borderColor: '#9bcfab',
  },
  flatList: {
    flex: 1,
  },
  // Typing indicator styles
  typingContainer: {
    alignSelf: 'flex-start',
    marginBottom: 16,
    marginLeft: 8,
    marginTop: 8,
  },
  typingBubble: {
    flexDirection: 'row',
    backgroundColor: 'rgba(100, 59, 197, 0.3)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(100, 59, 197, 0.5)',
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#eedd70',
    marginHorizontal: 3,
  },
})