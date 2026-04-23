import React, { useState } from "react";
import { Image } from "expo-image";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAlert } from "../../../util/AlertContext";
import Loader from "../../../shared/Loader";
import axios from "axios";
import { Color, Padding, FontSize, FontFamily, Border } from "../../../GlobalStyles";

const API_ENDPOINT = "http://localhost:3000";

const InfluencerChangePassword = ({ navigation }) => {
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showAlert("Error", "Please fill all fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert("Error", "New passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      showAlert("Error", "Password must be at least 6 characters");
      return;
    }
    const influencerId = await AsyncStorage.getItem("influencerId");
    const token = await AsyncStorage.getItem("token");
    setLoading(true);
    try {
      const response = await axios.post(
        `${API_ENDPOINT}/influencers/change-password`,
        { influencerId, currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.status === 200) {
        showAlert("Success", "Password changed successfully");
        navigation.goBack();
      }
    } catch (error) {
      showAlert("Error", error?.response?.data?.message || "Something went wrong");
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.scrollView}>
      {loading && <Loader loading={loading} />}
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <View style={styles.headerContainer}>
          <View style={styles.headerContent}>
            <Image
              style={styles.headerImage}
              contentFit="cover"
              source={require("../../../assets/depth-4-frame-07.png")}
            />
            <Text style={styles.headerText}>Change Password</Text>
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.formContainer}>
        <Text style={styles.label}>Current Password</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry={!showCurrent}
            placeholder="Enter current password"
            placeholderTextColor="#aaa"
          />
          <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)}>
            <Text style={styles.toggle}>{showCurrent ? "Hide" : "Show"}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>New Password</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showNew}
            placeholder="Enter new password"
            placeholderTextColor="#aaa"
          />
          <TouchableOpacity onPress={() => setShowNew(!showNew)}>
            <Text style={styles.toggle}>{showNew ? "Hide" : "Show"}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Confirm New Password</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirm}
            placeholder="Confirm new password"
            placeholderTextColor="#aaa"
          />
          <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
            <Text style={styles.toggle}>{showConfirm ? "Hide" : "Show"}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.submitButton} onPress={handleChangePassword}>
            <Text style={styles.submitButtonText}>Change Password</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.cancelButtonContainer}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    width: "100%",
    height: "100%",
    backgroundColor: Color.colorWhitesmoke_100,
  },
  headerContainer: {
    height: 72,
    marginTop: Padding.p_base,
    padding: Padding.p_base,
    backgroundColor: Color.colorWhitesmoke_100,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerImage: {
    width: 24,
    height: 24,
  },
  headerText: {
    fontSize: 22,
    width: "90%",
    textAlign: "center",
    color: Color.colorGray_400,
    fontFamily: FontFamily.beVietnamProBold,
  },
  formContainer: {
    margin: 16,
  },
  label: {
    fontSize: FontSize.size_base,
    fontFamily: FontFamily.interBold,
    color: Color.colorGray_400,
    marginTop: 16,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: Border.br_xs,
    borderWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 12,
  },
  textInput: {
    flex: 1,
    height: 44,
    fontSize: FontSize.size_base,
    color: Color.colorGray_400,
  },
  toggle: {
    color: Color.colorDodgerblue,
    fontSize: FontSize.size_sm,
    fontFamily: FontFamily.interMedium,
    paddingHorizontal: 4,
  },
  buttonContainer: {
    marginTop: 32,
    width: "100%",
  },
  submitButton: {
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Color.colorDodgerblue,
    borderRadius: Border.br_xs,
  },
  submitButtonText: {
    color: "#fff",
    fontFamily: FontFamily.interBold,
    fontSize: FontSize.size_sm,
    fontWeight: "700",
  },
  cancelButtonContainer: {
    marginTop: 12,
    width: "100%",
  },
  cancelButton: {
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E8EDF2",
    borderRadius: Border.br_xs,
  },
  cancelButtonText: {
    fontFamily: FontFamily.interBold,
    fontSize: FontSize.size_sm,
    fontWeight: "700",
  },
});

export default InfluencerChangePassword;
