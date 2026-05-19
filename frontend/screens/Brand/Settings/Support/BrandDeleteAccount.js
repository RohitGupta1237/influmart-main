import React, { useState } from "react";
import { Image } from "expo-image";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView
} from "react-native";
import { BrandDeleteAccountStyles } from "./BrandDeleteAccount.scss";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useAlert } from "../../../../util/AlertContext";
import Loader from "../../../../shared/Loader";
const API_ENDPOINT = "http://localhost:3000";

const BrandDeleteAccountPage = ({ navigation }) => {
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(false);

  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      const brandId = await AsyncStorage.getItem("brandId");
      const token = await AsyncStorage.getItem("token");
      const response = await axios.delete(`${API_ENDPOINT}/brands/profile/${brandId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 200) {
        await AsyncStorage.removeItem("token");
        await AsyncStorage.removeItem("brandId");
        navigation.reset({ index: 0, routes: [{ name: "Homepage" }] });
      } else {
        showAlert("Error", response.data?.message || "Failed to delete account.");
      }
    } catch (error) {
      showAlert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.scrollView}>
      {loading && <Loader loading={loading} />}
      <TouchableOpacity onPress={() => navigation.navigate("BrandAdminPanel")}>
        <View style={styles.headerContainer}>
          <View style={styles.headerContent}>
            <Image
              style={styles.headerImage}
              contentFit="cover"
              source={require("../../../../assets/cross_symbol.png")}
            />
            <Text style={styles.DeleteText}>Delete Account</Text>
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.messageContainer}>
        <Text style={styles.messageText}>
        Once you delete your account, there is no going back. Please be certain.
        </Text>
      </View>
      <View style={styles.loginButtonContainer}>
        <TouchableOpacity style={styles.loginButton} onPress={handleDeleteAccount}>
          <Text style={styles.loginButtonText}>I'm sure, delete my account</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.CancelButtonContainer}>
        <TouchableOpacity style={styles.CancelButton} onPress={() => navigation.navigate("BrandAdminPanel")}>
          <Text style={styles.CancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
      
    </ScrollView>
  );
};

const styles = StyleSheet.create(BrandDeleteAccountStyles);

export default BrandDeleteAccountPage;