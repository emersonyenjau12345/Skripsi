import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { auth, realtimeDb } from "../firebaseConfig";
import { ref, onValue, push, update } from "firebase/database";

const chatPath = "chats";

// Fungsi menandai pesan sebagai 'Dibaca'
const markMessagesAsRead = async (senderEmail, userEmail) => {
    const messagesRef = ref(realtimeDb, chatPath);
    onValue(messagesRef, (snapshot) => {
        if (snapshot.exists()) {
            const updates = {};
            snapshot.forEach((child) => {
                const message = child.val();
                if (message.sender === senderEmail && message.receiver === userEmail && message.status !== "Dibaca") {
                    updates[`${chatPath}/${child.key}/status`] = "Dibaca";
                }
            });
            if (Object.keys(updates).length > 0) {
                update(ref(realtimeDb), updates);
            }
        }
    }, { onlyOnce: true });
};


const VillageChating = ({ navigation }) => {
    const [inputText, setInputText] = useState("");
    const [userEmail, setUserEmail] = useState("");
    const [chatMessages, setChatMessages] = useState([]);
    const [unreadCounts, setUnreadCounts] = useState({});
    const [chatSenders, setChatSenders] = useState([]); // Menyimpan history email masuk
    const [selectedSender, setSelectedSender] = useState(null);
    const [showNotifications, setShowNotifications] = useState(false);
    const [totalUnread, setTotalUnread] = useState(0);
    const flatListRef = useRef(null);

    useEffect(() => {
        const user = auth.currentUser;
        if (user) setUserEmail(user.email);
    }, []);

    useEffect(() => {
        if (!userEmail) return;

        const messagesRef = ref(realtimeDb, chatPath);
        const unsubscribe = onValue(messagesRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const sortedMessages = Object.keys(data)
                    .map((key) => ({ id: key, ...data[key] }))
                    .filter(msg => msg.sender === userEmail || msg.receiver === userEmail)
                    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

                const unreadMessages = {};
                let totalUnreadCount = 0;
                const senders = new Set();

                sortedMessages.forEach(msg => {
                    if (msg.receiver === userEmail) {
                        senders.add(msg.sender);
                        if (msg.sender !== userEmail && msg.status !== "Dibaca") {
                            if (!unreadMessages[msg.sender]) unreadMessages[msg.sender] = 0;
                            unreadMessages[msg.sender]++;
                            totalUnreadCount++;
                        }
                    }
                });

                setUnreadCounts(unreadMessages);
                setChatSenders(Array.from(senders)); // Simpan history email masuk
                setTotalUnread(totalUnreadCount);

                // Chat tidak langsung muncul, hanya ditampilkan saat dipilih dari notifikasi
                if (selectedSender) {
                    setChatMessages(sortedMessages.filter(msg =>
                        (msg.sender === selectedSender && msg.receiver === userEmail) ||
                        (msg.sender === userEmail && msg.receiver === selectedSender)
                    ));
                    markMessagesAsRead(selectedSender, userEmail);
                } else {
                    setChatMessages([]); // Reset messages if no sender is selected
                }
            } else {
                setUnreadCounts({});
                setTotalUnread(0);
                setChatMessages([]);
                setChatSenders([]); // Reset daftar pengirim jika tidak ada pesan
            }
        });

        return () => unsubscribe();
    }, [userEmail, selectedSender]);

    const handleSelectSender = (sender) => {
        setSelectedSender(sender);
        setShowNotifications(false);
        markMessagesAsRead(sender, userEmail);
    };

    const handleSendMessage = () => {
        if (inputText.trim() && userEmail && selectedSender) {
            const chatRef = ref(realtimeDb, chatPath);
            const newMessage = {
                sender: userEmail,
                receiver: selectedSender,
                text: inputText,
                timestamp: new Date().toISOString(),
                status: "Terkirim",
            };

            push(chatRef, newMessage);
            setInputText(""); // Reset inputText setelah kirim pesan
        }
    };

    const isImageUrl = (url) => {
        return url.match(/(https?:\/\/.*\.(?:png|jpg|jpeg))/i);
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => {
                    if (selectedSender) {
                        setSelectedSender(null);
                    } else {
                        navigation.goBack();
                    }
                }}>
                    <Ionicons name="arrow-back" size={30} color="#7D2675" />
                </TouchableOpacity>
                <Text style={styles.username}>Chat Admin</Text>
                <TouchableOpacity onPress={() => setShowNotifications(!showNotifications)} style={styles.notificationIcon}>
                    <Ionicons name="notifications" size={30} color={totalUnread > 0 ? "red" : "#7D2675"} />
                    {totalUnread > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{totalUnread}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {showNotifications && (
                <View style={styles.notificationContainer}>
                    <Text style={styles.notificationTitle}>Pesan Masuk</Text>
                    {chatSenders.map((sender, index) => (
                        <TouchableOpacity key={index} onPress={() => handleSelectSender(sender)} style={styles.notificationItem}>
                            <Text style={styles.notificationText}>
                                {sender} {unreadCounts[sender] ? `(${unreadCounts[sender]} pesan baru)` : ""}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {selectedSender && (
                <FlatList
                    ref={flatListRef}
                    data={chatMessages}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View style={[
                            styles.messageContainer, 
                            item.sender === userEmail ? styles.userMessage : styles.adminMessage,
                            { justifyContent: item.sender === userEmail ? "flex-end" : "flex-start" } // Mengubah posisi pesan
                        ]}>
                            <View style={[styles.messageBubble, item.sender === userEmail ? styles.userBubble : styles.adminBubble]}>
                                {isImageUrl(item.text) ? (
                                    <Image source={{ uri: item.text }} style={styles.imageMessage} />
                                ) : (
                                    <Text style={styles.messageText}>{item.text}</Text>
                                )}
                            </View>
                        </View>
                    )}
                />
            )}

            {selectedSender && (
                <View style={styles.inputBar}>
                    <TextInput
                        style={styles.input}
                        placeholder="Ketik pesan..."
                        value={inputText}
                        onChangeText={setInputText}
                        multiline={false} // Set multiline to false for single line input
                    />
                    <TouchableOpacity onPress={handleSendMessage}>
                        <Ionicons name="send" size={24} color="#7D2675" />
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    // Bubble chat untuk user (siswa)
    userBubble: { 
        backgroundColor: "#D1C4E9", // Warna untuk siswa (contoh ungu muda)
        alignSelf: "flex-start", // Pesan admin di kiri
    },

    // Bubble chat untuk admin
    adminBubble: { 
        backgroundColor: "#BBDEFB", // Warna untuk admin (contoh biru muda)
        alignSelf: "flex-end", // Pesan siswa di kanan
    },

    container: { flex: 1, backgroundColor: "#F2F2F2", paddingHorizontal: 10, paddingBottom: 10 },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderColor: "#DDD",
        backgroundColor: "#E3E3E3",
        paddingHorizontal: 10,
    },
    username: { fontSize: 18, fontWeight: "bold", color: "#333", marginLeft: 10 },
    notificationContainer: { 
        padding: 10, 
        backgroundColor: "#FFF", 
        borderRadius: 10, 
        marginVertical: 10, 
        width: 250, // Atur lebar yang lebih kecil
        alignSelf: "flex-start", // Tetap di kiri
        paddingHorizontal: 15,
    },
    
    notificationTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 5 },
    notificationItem: { padding: 10, backgroundColor: "#E3E3E3", marginVertical: 5, borderRadius: 5 },
    notificationText: { fontSize: 14, color: "#333" },
    messageContainer: { flexDirection: "row", alignItems: "center", marginVertical: 5 },
    messageBubble: { padding: 10, borderRadius: 15, backgroundColor: "#FFF", elevation: 2, maxWidth: "75%" },
    messageText: { fontSize: 16, color: "#333" },
    inputBar: { flexDirection: "row", alignItems: "center", padding: 10, backgroundColor: "#FFF", borderRadius: 30, elevation: 2 },
    input: { flex: 1, padding: 10, borderRadius: 20, fontSize: 16 },
    imageMessage: {
        width: 200,
        height: 200,
        borderRadius: 10,
        resizeMode: "cover",
    },
    imageBubble: {
        padding: 10,
        borderRadius: 15,
        backgroundColor: "#FFF",
        elevation: 2,
        maxWidth: "70%",
        alignItems: "center"
    }
});

export default VillageChating;
