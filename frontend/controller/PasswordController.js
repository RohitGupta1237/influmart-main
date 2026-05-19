import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import API_ENDPOINT from "../config";

// Forgot Password — sends OTP to email, then navigates to reset screen
const forgotPasswordControl = async (email, type, showAlert, navigation) => {
  try {
    const response = await axios.post(`${API_ENDPOINT}/api/password/forgot-password`, {
      email,
      type,
    });
    if (response.status === 200) {
      showAlert("OTP Sent", "A 6-digit OTP has been sent to your email address.");
      navigation.navigate("ResetPassword", { email, type });
    } else {
      showAlert("Error", response.data.message);
    }
  } catch (error) {
    const message = error.response?.data?.message || "Something went wrong. Please try again.";
    showAlert("Error", message);
  }
};

// Reset Password — sends email + OTP + new password
const resetPasswordControl = async (email, otp, newPassword, type, showAlert, navigation) => {
  try {
    const response = await axios.post(`${API_ENDPOINT}/api/password/reset-password`, {
      email,
      otp,
      newPassword,
      type,
    });
    if (response.status === 200) {
      showAlert("Password Reset", "Your password has been reset successfully.");
      navigation.navigate("BrandorInfluencer");
    } else {
      showAlert("Error", response.data.message);
    }
  } catch (error) {
    const message = error.response?.data?.message || "Something went wrong. Please try again.";
    showAlert("Error", message);
  }
};

export { forgotPasswordControl, resetPasswordControl };