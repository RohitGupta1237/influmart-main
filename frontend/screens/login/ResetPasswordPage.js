import React, { useState } from "react";
import {
  View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { resetPasswordControl } from "../../controller/PasswordController";
import { loginStyle } from "./LoginStyle";
import { Image } from "expo-image";
import { Color } from "../../GlobalStyles";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Loader from "../../shared/Loader";

const ResetPasswordPage = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { email, type } = route.params || {};

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordC, setShowPasswordC] = useState(false);
  const [loading, setLoading] = useState(false);

  const showAlert = (title, message) => Alert.alert(title, message);

  const handlePasswordReset = async () => {
    if (!otp.trim()) {
      showAlert("Error", "Please enter the OTP sent to your email.");
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert("Error", "Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      showAlert("Error", "Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    await resetPasswordControl(email, otp.trim(), newPassword, type, showAlert, navigation);
    setLoading(false);
  };

  return (
    <ScrollView
      style={{ width: "100%", height: "100%", backgroundColor: Color.colorWhitesmoke_100 }}
    >
      {loading && <Loader loading={loading} />}
      <TouchableOpacity onPress={() => navigation.navigate("BrandorInfluencer")}>
        <View style={styles.depth1Frame0}>
          <View style={[styles.depth2Frame0, styles.frameFlexBox]}>
            <View style={[styles.depth3Frame0, styles.frameLayout1]}>
              <Image
                style={styles.depth4Frame0}
                contentFit="cover"
                source={require("../../assets/depth-4-frame-07.png")}
              />
            </View>
            <View style={styles.depth1Frame1}>
              <View style={styles.depth2Frame01}>
                <Text style={styles.welcomeBack}>Reset Password</Text>
              </View>
            </View>
            <View style={[styles.depth3Frame1, styles.frameFlexBox]}>
              <View style={[styles.depth4Frame01, styles.frameLayout1]}>
                <View style={[styles.depth5Frame0, styles.frameLayout1]} />
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      <View style={{ margin: 15 }}>
        <View style={styles.depth2Frame01}>
          <Text style={styles.getReadyTo}>
            Enter the 6-digit OTP sent to {email} and your new password.
          </Text>
        </View>
      </View>

      {/* OTP input */}
      <View style={{ margin: 15 }}>
        <View style={styles.depth5Frame01}>
          <View style={styles.depth6Frame0}>
            <View style={styles.depth2Frame01}>
              <TextInput
                placeholder="Enter OTP"
                keyboardType="number-pad"
                maxLength={6}
                style={[styles.email, styles.emailClr]}
                value={otp}
                onChangeText={setOtp}
              />
            </View>
          </View>
        </View>
      </View>

      {/* New Password */}
      <View style={{ margin: 15 }}>
        <View style={styles.depth5Frame01}>
          <View style={styles.depth6Frame0}>
            <View style={styles.depth2Frame01}>
              <View style={styles.passwordContainer}>
                <TextInput
                  placeholder="New Password"
                  secureTextEntry={!showPassword}
                  textContentType="password"
                  style={[styles.email, styles.emailClr, { flex: 1 }]}
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Icon name={showPassword ? "eye-off" : "eye"} size={20} color="gray" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Confirm Password */}
      <View style={{ margin: 15 }}>
        <View style={styles.depth5Frame01}>
          <View style={styles.depth6Frame0}>
            <View style={styles.depth2Frame01}>
              <View style={styles.passwordContainer}>
                <TextInput
                  placeholder="Confirm Password"
                  secureTextEntry={!showPasswordC}
                  textContentType="password"
                  style={[styles.email, styles.emailClr, { flex: 1 }]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowPasswordC(!showPasswordC)}>
                  <Icon name={showPasswordC ? "eye-off" : "eye"} size={20} color="gray" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={{ margin: 15 }}>
        <View style={styles.depth2Frame06}>
          <TouchableOpacity style={{ width: "100%" }} onPress={handlePasswordReset}>
            <View style={[styles.depth4Frame04, styles.depth4FrameLayout]}>
              <View style={[styles.depth5Frame03, styles.frameBg1]}>
                <View style={styles.depth2Frame01}>
                  <Text style={[styles.logIn, styles.logInTypo]}>Reset Password</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create(loginStyle);

export default ResetPasswordPage;
