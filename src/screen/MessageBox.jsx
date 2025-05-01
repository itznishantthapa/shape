import React, { useEffect, useState, useRef } from 'react';
import { View, TextInput, Button, Text, StyleSheet } from 'react-native';

export default function App() {
  const [message, setMessage] = useState('');
  const [received, setReceived] = useState([]);
  const socket = useRef(null);

  useEffect(() => {
    socket.current = new WebSocket('ws://192.168.1.72:8000/ws/chat/test1/');

    socket.current.onopen = () => {
      console.log("Connected to WebSocket");
    };

    socket.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Received:", data);
      setReceived(prev => [...prev, `${data.username}: ${data.message}`]);
    };

    socket.current.onerror = (e) => {
      console.error("WebSocket error:", e.message);
    };

    socket.current.onclose = (e) => {
      console.log("WebSocket closed:", e.code);
    };

    // Clean up on unmount
    return () => {
      socket.current.close();
    };
  }, []);

  const sendMessage = () => {
    const data = {
      username: "ReactUser",
      message: message,
    };
    socket.current.send(JSON.stringify(data));
    setMessage('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>React Native Chat</Text>
      {received.map((msg, index) => (
        <Text key={index} style={styles.message}>{msg}</Text>
      ))}
      <TextInput
        value={message}
        onChangeText={setMessage}
        placeholder="Type a message"
        style={styles.input}
      />
      <Button title="Send" onPress={sendMessage} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, marginTop: 50 },
  heading: { fontSize: 24, marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', marginBottom: 10, padding: 10 },
  message: { marginVertical: 2 }
});
