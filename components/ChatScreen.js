import React, { useState, useEffect, useRef } from "react";
import { 
    View, Text, TextInput, TouchableOpacity, FlatList, Image, Alert, 
    KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback 
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { auth, realtimeDb } from "../firebaseConfig";
import { ref, push, onValue, remove, get } from "firebase/database";

const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/ddmz8ct9u/image/upload";
const UPLOAD_PRESET = "Gambar_Saya";

const ChatScreen = ({ navigation }) => {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [userEmail, setUserEmail] = useState("");
    const [selectedImage, setSelectedImage] = useState(null);
    const flatListRef = useRef(null);

    useEffect(() => {
        const user = auth.currentUser;
        if (user) setUserEmail(user.email);
    }, []);

    useEffect(() => {
        if (!userEmail) return;

        const messagesRef = ref(realtimeDb, "chats");

        return onValue(messagesRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const chatMessages = Object.keys(data)
                    .map((key) => ({ id: key, ...data[key] }))
                    .filter((msg) =>
                        (msg.sender === userEmail && msg.receiver === "s21810030@student.unklab.ac.id") ||
                        (msg.sender === "s21810030@student.unklab.ac.id" && msg.receiver === userEmail)
                    )
                    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

                setMessages(chatMessages);
            }
        });
    }, [userEmail]);

    useEffect(() => {
        deleteOldMessages();
    }, [messages]);

    const handleSendMessage = (text) => {
        if (text.trim() && userEmail) {
            push(ref(realtimeDb, "chats"), {
                sender: userEmail,
                receiver: "s21810030@student.unklab.ac.id",
                text,
                timestamp: new Date().toISOString(),
                status: "Terkirim",
            });

            setInputText("");
        }
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 1,
        });

        if (!result.canceled) {
            setSelectedImage(result.assets[0].uri);
            uploadToCloudinary(result.assets[0].uri);
        }
    };

    const uploadToCloudinary = async (imageUri) => {
        if (!imageUri || !userEmail) {
            Alert.alert("Error", "Silakan pilih gambar terlebih dahulu!");
            return;
        }

        const formData = new FormData();
        formData.append("file", {
            uri: imageUri,
            type: "image/jpeg",
            name: "chat_image.jpg",
        });
        formData.append("upload_preset", UPLOAD_PRESET);
        formData.append("cloud_name", "ddmz8ct9u");

        try {
            let response = await fetch(CLOUDINARY_URL, {
                method: "POST",
                body: formData,
            });

            let data = await response.json();

            if (data.secure_url) {
                handleSendMessage(data.secure_url);
            } else {
                Alert.alert("Gagal Upload", "Gambar tidak bisa diunggah. Coba lagi.");
            }
        } catch (error) {
            Alert.alert("Error", "Terjadi kesalahan saat mengunggah gambar.");
            console.error("Upload gagal:", error);
        }
    };

    const handleDeleteMessage = (messageId) => {
        Alert.alert("Hapus Pesan", "Apakah Anda yakin ingin menghapus pesan ini?", [
            { text: "Batal", style: "cancel" },
            { text: "Hapus", onPress: () => remove(ref(realtimeDb, `chats/${messageId}`)) }
        ]);
    };

    const deleteOldMessages = async () => {
        try {
            const messagesRef = ref(realtimeDb, "chats");
            const snapshot = await get(messagesRef);
            if (snapshot.exists()) {
                const now = new Date();
                const data = snapshot.val();

                Object.keys(data).forEach(async (key) => {
                    const messageTimestamp = new Date(data[key].timestamp);
                    const timeDiff = (now - messageTimestamp) / (1000 * 60 * 60); // dalam jam

                    if (timeDiff >= 24) {
                        await remove(ref(realtimeDb, `chats/${key}`));
                        console.log(`Pesan ${key} dihapus karena lebih dari 24 jam`);
                    }
                });
            }
        } catch (error) {
            console.error("Gagal menghapus pesan lama:", error);
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <View style={{ flex: 1, backgroundColor: "#F5F5F5" }}>
                    <View style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: "#6200EE",
                        padding: 15,
                        elevation: 4,
                    }}>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                        </TouchableOpacity>
                        <Text style={{ color: "white", fontSize: 20, fontWeight: "bold", marginLeft: 15 }}>
                            Chat Admin
                        </Text>
                    </View>

                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity onLongPress={() => handleDeleteMessage(item.id)}>
                                <View style={{
                                    flexDirection: "row",
                                    alignItems: "flex-end",
                                    justifyContent: item.sender === userEmail ? "flex-end" : "flex-start",
                                    marginVertical: 8,
                                    paddingHorizontal: 15,
                                }}>
                                    {item.sender !== userEmail && (
                                        <MaterialIcons name="supervisor-account" size={30} color="#FF9800" style={{ marginRight: 10 }} />
                                    )}

                                    <View style={{
                                        backgroundColor: item.sender === userEmail ? "#6200EE" : "#FFFFFF",
                                        padding: 10,
                                        borderRadius: 15,
                                        maxWidth: "70%",
                                        elevation: 3,
                                    }}>
                                        {item.text.startsWith("http") ? (
                                            <Image 
                                                source={{ uri: item.text }} 
                                                style={{ 
                                                    width: "100%", 
                                                    height: undefined, 
                                                    aspectRatio: 1, 
                                                    borderRadius: 10,
                                                    resizeMode: "contain"
                                                }} 
                                            />
                                        ) : (
                                            <Text style={{ color: item.sender === userEmail ? "white" : "black", fontSize: 16 }}>
                                                {item.text}
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            </TouchableOpacity>
                        )}
                        contentContainerStyle={{ paddingBottom: 15 }}
                    />

                    <View style={{
                        flexDirection: "row",
                        alignItems: "center",
                        padding: 10,
                        backgroundColor: "white",
                        borderTopWidth: 1,
                        borderTopColor: "#DDD",
                    }}>
                        <TouchableOpacity onPress={pickImage}>
                            <Ionicons name="camera" size={28} color="#6200EE" style={{ marginRight: 10 }} />
                        </TouchableOpacity>
                        <TextInput
                            style={{
                                flex: 1,
                                backgroundColor: "#F0F0F0",
                                padding: 12,
                                borderRadius: 25,
                                borderWidth: 1,
                                borderColor: "#B0BEC5",
                                fontSize: 16,
                            }}
                            placeholder="Ketik pesan..."
                            value={inputText}
                            onChangeText={setInputText}
                        />
                        <TouchableOpacity onPress={() => handleSendMessage(inputText)}>
                            <Ionicons name="send" size={28} color="#6200EE" style={{ marginLeft: 10 }} />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
    );
};

export default ChatScreen;
