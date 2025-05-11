import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ImageBackground,
  StyleSheet,
  useWindowDimensions,
  Platform,
  Animated,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

const HomeScreen = () => {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const isPC = Platform.OS === "web" && width > 800;
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const [scaleValue] = useState(new Animated.Value(1));

  // Animation for button press
  const onPressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  // Footer animation
  useEffect(() => {
    const loopAnimation = () => {
      scrollAnim.setValue(-200);
      Animated.timing(scrollAnim, {
        toValue: 300,
        duration: 5000,
        useNativeDriver: true,
      }).start(() => loopAnimation());
    };

    if (isPC) loopAnimation();
  }, []);

  return isPC ? (
    <ImageBackground
      source={require("../assets/pioneer_chapel.jpg")}
      style={styles.pcBackground}
    >
      <View style={styles.pcContainer}>
        <View style={styles.contentWrapper}>
          <Image source={require("../assets/logo.png")} style={styles.pcLogo} />

          <View style={styles.titleContainer}>
            <View style={styles.line} />
            <Text style={styles.title}>REDEEM POINT</Text>
            <View style={styles.line} />
          </View>

              <Text style={styles.verse}>
                Janganlah kita menjauhkan diri dari ibadah,{"\n"} tetapi marilah kita saling
                menasihati, {"\n"}dan semakin giat melakukannya.{"\n"}Ibrani 10:25
              </Text>

          <TouchableOpacity
            style={styles.pcButton}
            onPress={() => navigation.navigate("VillageDeanLogin")}
          >
            <Text style={styles.buttonText}>Login Village Dean</Text>
          </TouchableOpacity>

          <View style={styles.footerContainer}>
            <Animated.Text
              style={[
                styles.footer,
                {
                  transform: [{ translateX: scrollAnim }],
                },
              ]}
            >
              UNIVERSITAS KLABAT
            </Animated.Text>
          </View>
        </View>
      </View>
    </ImageBackground>
  ) : (
    <View style={styles.mobileContainer}>
      <Image source={require("../assets/logo.png")} style={styles.mobileLogo} />

      <View style={styles.titleContainer}>
        <View style={styles.line} />
        <Text style={styles.title}>REDEEM POINT</Text>
        <View style={styles.line} />
      </View>

          <Text style={styles.verse}>
          Janganlah kita menjauhkan diri dari ibadah, tetapi marilah kita saling
            menasihati, dan semakin giat melakukannya.{"\n"}"Ibrani 10:25"
          </Text>

      {/* Button Login Student */}
      <TouchableOpacity
        style={styles.mobileButton}
        onPress={() => navigation.navigate("StudentLogin")}
      >
        <Text style={styles.buttonText}>Login Student</Text>
      </TouchableOpacity>

      {/* New Work Party Login Button for Mobile */}
      <TouchableOpacity
        style={styles.mobileButton}
        onPress={() => navigation.navigate("LoginKerja")}
      >
        <Text style={styles.buttonText}>Login Pihak Kerja</Text>
      </TouchableOpacity>


          <View style={styles.footerContainer}>
            <Animated.Text
              style={[
                styles.footer,
                {
                  transform: [{ translateX: scrollAnim }],
                },
              ]}
            >
              UNIVERSITAS KLABAT
            </Animated.Text>
          </View>

    </View>
  );
};

const styles = StyleSheet.create({
  mobileContainer: {
    flex: 1,
    backgroundColor: "#844E87",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  pcBackground: {
    flex: 1,
    resizeMode: "cover",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  pcContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  mobileLogo: {
    width: "70%",
    height: "20%",
    resizeMode: "contain",
    marginBottom: 15,
  },
  pcLogo: {
    width: "70%",
    height: "40%",
    resizeMode: "contain",
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: "#fff",
    marginHorizontal: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  verse: {
    textAlign: "center",
    color: "#fff",
    fontSize: 13,
    marginBottom: 2,
    paddingHorizontal: 10,
  },
  verseRef: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 10,
  },
  mobileButton: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 3,
    width: "80%",
  },
  pcButton: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginVertical: 5,
    width: 250,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#000",
  },
  contentWrapper: {
    backgroundColor: "rgba(240, 153, 228, 0.6)",
    padding: 50,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  footerContainer: {
    width: 250,
    height: 30,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 10,
  },
  footer: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    width: 500,
  },
});

export default HomeScreen;