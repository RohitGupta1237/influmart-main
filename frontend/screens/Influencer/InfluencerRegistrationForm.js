import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Pressable,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import * as Location from "expo-location";
import InfluPrice from "../signup/components/InfluPrice";
import HeadingDescToggle from "../signup/components/HeadingDescToggle";
import { InfluencerVerify } from "../../controller/signupController";
import { InfluencerRegistrationFormStyles } from "./InfluencerRegstrationForm.scss";
import { useAlert } from "../../util/AlertContext";
import { Color, FontSize } from "../../GlobalStyles";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import MultipleSelectList from "../../shared/MultiSelect";
import { CountryPicker } from "react-native-country-codes-picker";
import DropDown from "../../shared/DropDown";
import Loader from "../../shared/Loader";
import PlaceSearchBar from "../../shared/PlaceSearchBar";
import MultiDropDown from "../../shared/MultiDropDown";

const API_ENDPOINT = "http://localhost:3000";

const FormField = ({
  label,
  value,
  setValue,
  secureTextEntry = false,
  showPassword,
  setShowPassword,
  style,
  setInfluTypeDropdown,
  setGenderDropdown
}) => (
  <View style={[styles.fieldContainer, style]}>
    <View style={{ display: "flex", flexDirection: "row", gap: 8 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.madantoryText}>*</Text>
    </View>
    <View style={secureTextEntry}>
      <TextInput
        style={styles.textInput}
        value={value}
        onChangeText={setValue}
        placeholder={label}
        secureTextEntry={secureTextEntry && !showPassword}
        onFocus={() => {
          setInfluTypeDropdown(false)
          setGenderDropdown(false)
        }}
      />
      {secureTextEntry && (
        <TouchableOpacity
          style={styles.password}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Icon
            name={showPassword ? "eye-off" : "eye"}
            size={20}
            color="gray"
          />
        </TouchableOpacity>
      )}
    </View>
  </View>
);

const InfluencerRegistrationForm = ({ route, navigation }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [gender, setGender] = useState("Male");
  const [mobileNumber, setMobileNumber] = useState("");
  const [selected, setSelected] = useState([]);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [location, setLocation] = useState("");
  const social = route.params?.social;
  const follower = route.params?.follower;
  const price = route.params?.price;
  const { showAlert } = useAlert();
  const photo = route.params?.photo;
  const isCompleted = route.params?.isCompleted || {
    addSocialProfile: false,
    addProfilePhoto: false,
    addSocialFollowers: false,
    pricePerPost: false,
  };
  const [isFormValid, setIsFormValid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [openCountryCode, setOpenCountryCode] = useState(false);
  const [countryCode, setCountryCode] = useState("+91");
  const [mobileNoVerified, setMobileNoVerified] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [showEmailOtp, setShowEmailOtp] = useState(false);
  const [emailOtpValue, setEmailOtpValue] = useState("");
  const [emailOtpLoading, setEmailOtpLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [influTypeDropdown, setInfluTypeDropdown] = useState(false)
  const [genderDropdown, setGenderDropdown] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const data = [
    { key: "grocery", value: "Grocery" },
    { key: "electronics", value: "Electronics" },
    { key: "fashion", value: "Fashion" },
    { key: "toys", value: "Toys" },
    { key: "beauty", value: "Beauty" },
    { key: "home-decoration", value: "Home Decoration" },
    { key: "fitness", value: "Fitness" },
    { key: "education", value: "Education" },
    { key: "others", value: "Others" },
  ];

  const genderData = [
    {
      key: "male",
      value: "Male",
    },
    {
      key: "female",
      value: "Female",
    },
    {
      key: "other",
      value: "Other",
    },
    {
      key: "not prefer to say",
      value: "Not prefer to say",
    },
  ];
  const handlePlaceSelected = (details) => {
    setLocation(details);
  };

  const detectLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showAlert("Permission Denied", "Allow location access so we can auto-fill your location.");
        return;
      }
      const coords = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = coords.coords;

      // Use Google Geocoding API — works on web, iOS and Android
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=AIzaSyB1VXXbx0lvqZYImnPGhGz3BtjSF1oyFsM`
      );
      const data = await response.json();

      if (data.status === "OK" && data.results.length > 0) {
        // Extract city, state, country from address components
        const components = data.results[0].address_components;
        const get = (type) =>
          components.find((c) => c.types.includes(type))?.long_name;

        const city = get("locality") || get("administrative_area_level_2");
        const state = get("administrative_area_level_1");
        const country = get("country");

        const parts = [city, state, country].filter(Boolean);
        setLocation(parts.join(", "));
      } else {
        showAlert("Error", "Could not determine location. Please search manually.");
      }
    } catch (error) {
      console.error("Location detection error:", error);
      showAlert("Error", "Failed to get location. Please search manually.");
    } finally {
      setLocationLoading(false);
    }
  };
  useEffect(() => {
    if (
      name &&
      mobileNumber &&
      email &&
      emailVerified &&
      password &&
      username &&
      //location &&  // In production, location is mandatory. But for testing, it is optional. in production, uncomment this line
      social &&
      price
    ) {
      setIsFormValid(true);
    } else {
      setIsFormValid(false);
    }
  }, [
    email,
    emailVerified,
    password,
    username,
    location,
    social,
    follower,
    price,
  ]);
  useEffect(() => {
    if (!route.params) {
      setEmail("");
      setPassword("");
      setUsername("");
      setAgreedToTerms(false);
      setLocation("");
      setName("");
      setMobileNumber("");
      setSelected([]);
    }
  }, [route.params]);
  const handleSendEmailOtp = async () => {
    if (!email) {
      showAlert("Error", "Please enter your email address first.");
      return;
    }
    setEmailOtpLoading(true);
    try {
      const response = await axios.post(`${API_ENDPOINT}/otp/sendOTP`, { email, name });
      if (response.status === 200) {
        setShowEmailOtp(true);
        showAlert("OTP Sent", "OTP has been sent to your email address.");
      }
    } catch (error) {
      const msg = error?.response?.data?.message || "Something went wrong. Please try again.";
      showAlert("OTP Error", msg);
    } finally {
      setEmailOtpLoading(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    if (!emailOtpValue) {
      showAlert("Error", "Please enter the OTP.");
      return;
    }
    setEmailOtpLoading(true);
    try {
      const response = await axios.post(`${API_ENDPOINT}/otp/verifyOTP`, { email, otp: emailOtpValue });
      if (response.status === 200) {
        setEmailVerified(true);
        setShowEmailOtp(false);
        showAlert("Verified", "Email verified successfully.");
      }
    } catch (error) {
      const msg = error?.response?.data?.message || "Invalid OTP. Please try again.";
      showAlert("OTP Error", msg);
    } finally {
      setEmailOtpLoading(false);
    }
  };

  const handleSelectPlan = async () => {
    setLoading(true);
    const payload = {
      email,
      password,
      userName: username,
      agreedToTerms,
      social,
      follower,
      price,
      location,
      profileUrl: photo,
      name,
      country: countryCode,
      number: mobileNumber,
      selected,
      gender,
    };
    await InfluencerVerify(payload, navigation, showAlert);
    setLoading(false);
  };

  return (
    <View style={{ width: "100%", height: "100%" }}>
      {loading && <Loader loading={loading} />}
      <ScrollView style={{ backgroundColor: Color.colorWhite }}>
        <View style={styles.influencerRegistrationForm}>
          <TouchableOpacity
            onPress={() => navigation.navigate("BrandorInfluencer")}
          >
            <View style={styles.header}>
              <Image
                style={styles.headerNavigation}
                resizeMode="cover"
                source={require("../../assets/depth-4-frame-Backarrow3x.png")}
              />
              <Text style={styles.headerText}>Sign up</Text>
              <View style={styles.headerNavigation} />
            </View>
          </TouchableOpacity>
          <FormField label="Name" value={name} setValue={setName} setInfluTypeDropdown={setInfluTypeDropdown} setGenderDropdown={setGenderDropdown} />

          {/* Email with OTP verification */}
          <View style={styles.fieldContainer}>
            <View style={{ display: "flex", flexDirection: "row", gap: 8 }}>
              <Text style={styles.fieldLabel}>Email</Text>
              <Text style={styles.madantoryText}>*</Text>
            </View>
            <View style={[styles.textInput, { flexDirection: "row", alignItems: "center" }]}>
              <TextInput
                style={{ flex: 1, color: "#4F7A94", fontSize: FontSize.size_base, outlineStyle: "none" }}
                value={email}
                onChangeText={(val) => { setEmail(val); setEmailVerified(false); setShowEmailOtp(false); setEmailOtpValue(""); }}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!emailVerified}
                onFocus={() => { setInfluTypeDropdown(false); setGenderDropdown(false); }}
              />
              {emailVerified ? (
                <Image style={{ width: 28, height: 28 }} source={require("../../assets/green_tick.png")} />
              ) : (
                <TouchableOpacity onPress={handleSendEmailOtp} disabled={emailOtpLoading}>
                  {emailOtpLoading ? (
                    <ActivityIndicator size="small" color="#4A90E2" />
                  ) : (
                    <Image style={{ width: 28, height: 28 }} source={require("../../assets/verify_symbol.png")} />
                  )}
                </TouchableOpacity>
              )}
            </View>
            {showEmailOtp && !emailVerified && (
              <View style={{ marginTop: 8, flexDirection: "row", alignItems: "center", gap: 8 }}>
                <TextInput
                  style={[styles.textInput, { flex: 1, color: "#4F7A94", fontSize: FontSize.size_base }]}
                  value={emailOtpValue}
                  onChangeText={setEmailOtpValue}
                  placeholder="Enter OTP"
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <TouchableOpacity
                  onPress={handleVerifyEmailOtp}
                  disabled={emailOtpLoading}
                  style={styles.otpVerifyButton}
                >
                  {emailOtpLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.otpVerifyButtonText}>Verify</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Password — only shown after email is verified */}
          {emailVerified && (
            <FormField
              label="Password"
              value={password}
              setValue={setPassword}
              secureTextEntry
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              setInfluTypeDropdown={setInfluTypeDropdown}
              setGenderDropdown={setGenderDropdown}
            />
          )}
          <FormField label="Username" value={username} setValue={setUsername} setInfluTypeDropdown={setInfluTypeDropdown} setGenderDropdown={setGenderDropdown} />
          <View style={[styles.depth1Frame2, { zIndex: 15 }]}>
            <View style={[styles.depth2Frame02, styles.frameLayout]}>
              <View style={styles.frameLayout}>
                <View style={styles.depth4Frame02}>
                  <Text style={[styles.email, styles.emailTypo]}>Gender</Text>
                  <Text style={styles.madantoryText}>*</Text>
                </View>
                <View>
                  <View>
                    <DropDown
                      name={gender}
                      items={genderData}
                      placeholder={"Gender"}
                      icon={"none"}
                      dropDownOptionStyle={{
                        width: "100%",
                        paddingVertical: 16,
                      }}
                      dropDownContainerStyle={{ width: "100%" }}
                      dropDownItemsStyle={{ width: "100%" }}
                      titleStyle={{ paddingStart: 12, color: "#4F7A94" }}
                      selectedValue={setGender}
                      showElements={genderDropdown}
                      setShowElement={setGenderDropdown}
                    />
                  </View>
                </View>
              </View>
            </View>
          </View>
          <View style={{ width: "100%", flexDirection: "column" }}>
            <View style={[styles.fieldContainer, { width: "100%" }]}>
              <View style={{ display: "flex", flexDirection: "row", gap: 8 }}>
                <Text style={styles.fieldLabel}>Mobile Number</Text>
                <Text style={styles.madantoryText}>*</Text>
              </View>
              <View style={[styles.textInput, styles.mobileNoWrap]}>
                <View
                  style={{
                    width: "85%",
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <TouchableOpacity
                    onPress={() => {
                      setOpenCountryCode(true);
                    }}
                  >
                    <Text
                      style={{
                        color: "#4F7A94",
                        fontSize: FontSize.size_base,
                        paddingEnd: 12,
                        borderRightWidth: 2,
                        borderRightColor: "#ccc",
                      }}
                    >
                      {countryCode}
                    </Text>
                  </TouchableOpacity>
                  <TextInput
                    style={{
                      color: "#4F7A94",
                      fontSize: FontSize.size_base,
                      outlineStyle: "none",
                      width: "90%",
                      height: "100%",
                      paddingStart: 8,
                    }}
                    value={mobileNumber}
                    onChangeText={setMobileNumber}
                    placeholder={"Mobile Number"}
                    keyboardType="phone-pad"
                    onFocus={() => {
                      setInfluTypeDropdown(false)
                      setGenderDropdown(false)
                    }}
                  />
                </View>
              </View>
            </View>
          </View>
          <View style={[styles.depth1Frame2, { height: "auto" }]}>
            <View style={[styles.depth2Frame02, styles.frameLayout, { height: "auto" }]}>
              <View style={[styles.frameLayout, { height: "auto" }]}>
                <View style={styles.depth4Frame02}>
                  <Text style={[styles.email, styles.emailTypo]}>
                    Influencer Type
                  </Text>
                  <Text style={styles.madantoryText}>*</Text>
                </View>
                <View>
                  <View>
                    <MultiDropDown
                      name={selected?.join(", ")}
                      items={data}
                      placeholder={"Select option"}
                      icon={"none"}
                      dropDownOptionStyle={{
                        width: "100%",
                        paddingVertical: 16,
                      }}
                      dropDownContainerStyle={{ width: "100%" }}
                      dropDownItemsStyle={{ width: "100%", top: "100%" }}
                      titleStyle={{ paddingStart: 12, color: "#4F7A94" }}
                      selectedValue={selected}
                      setSelectedValues={setSelected}
                      close={influTypeDropdown}
                      setClose={setInfluTypeDropdown}
                    />
                  </View>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.sectionHeader}>
            <View>
              <View style={styles.labelWrapper}>
                <Text style={styles.sectionHeaderText}>
                  Add social profiles
                </Text>
                <Text style={styles.madantoryText}>*</Text>
              </View>
              <Text style={styles.desc}>Atleast one field is mandatory</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setInfluTypeDropdown(false);
                setGenderDropdown(false)
                navigation.navigate("InfluencerSocialHandles", {
                  price,
                  follower,
                  photo,
                  social,
                  isCompleted,
                  email,
                  redirect: "InfluencerRegistrationForm",
                })
              }
              }
            >
              <Image
                style={styles.icon}
                contentFit="cover"
                source={
                  isCompleted?.addSocialProfile
                    ? require(`../../assets/green_tick.png`)
                    : require(`../../assets/depth-3-frame-11.png`)
                }
              />
            </TouchableOpacity>
          </View>
          <View style={styles.sectionHeader}>
            <View style={styles.labelWrapper}>
              <Text style={styles.sectionHeaderText}>Add Profile Photo</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setInfluTypeDropdown(false)
                setGenderDropdown(false)
                navigation.navigate("UserProfilePhoto", {
                  price,
                  follower,
                  social,
                  photo,
                  isCompleted,
                  redirect: "InfluencerRegistrationForm",
                })
              }
              }
            >
              <Image
                style={styles.icon}
                contentFit="cover"
                source={
                  isCompleted?.addProfilePhoto
                    ? require(`../../assets/green_tick.png`)
                    : require(`../../assets/depth-3-frame-11.png`)
                }
              />
            </TouchableOpacity>
          </View>
          <HeadingDescToggle
            heading="I agree to the terms of service"
            desc="You need to agree to the terms of service."
            toggleOn={agreedToTerms}
            setToggleOn={setAgreedToTerms}
            require={true}
          />

          <View style={styles.sectionHeader}>
            <View>
              <View style={styles.labelWrapper}>
                <Text style={styles.sectionHeaderText}>Price per post</Text>
                <Text style={styles.madantoryText}>*</Text>
              </View>
              <Text style={styles.desc}>Atleast one field is mandatory</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                setGenderDropdown(false)
                setInfluTypeDropdown(false)
                navigation.navigate("PricePerPost", {
                  social,
                  follower,
                  photo,
                  price,
                  isCompleted,
                  redirect: "InfluencerRegistrationForm",
                })
              }
              }
            >
              <Image
                style={styles.icon}
                contentFit="cover"
                source={
                  isCompleted?.pricePerPost
                    ? require(`../../assets/green_tick.png`)
                    : require(`../../assets/depth-3-frame-11.png`)
                }
              />
            </TouchableOpacity>
          </View>
          <View style={[styles.fieldContainer]}>
            <View style={{ display: "flex", flexDirection: "row", gap: 8 }}>
              <Text style={styles.fieldLabel}>Location</Text>
              <Text style={styles.madantoryText}>*</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <TouchableOpacity
                onPress={() => setModalVisible(true)}
                style={[styles.textInput, { flex: 1, justifyContent: "center" }]}
              >
                <Text style={{ color: location ? "#000" : "#aaa" }}>
                  {location || "Search for location"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={detectLocation}
                disabled={locationLoading}
                style={{
                  backgroundColor: "#4A90E2",
                  borderRadius: 10,
                  width: 44,
                  height: 44,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {locationLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Icon name="crosshairs-gps" size={22} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
          </View>
          <TouchableOpacity
            onPress={handleSelectPlan}
            disabled={!isFormValid}
            style={[
              styles.selectPlanButton,
              !isFormValid && styles.selectPlanButtonDisabled,
            ]}
          >
            <View>
              <Text
                style={[
                  styles.selectPlanButtonText,
                  !isFormValid && styles.selectPlanButtonDisabledText,
                ]}
              >
                Select Plan
              </Text>
            </View>
          </TouchableOpacity>
          <View style={styles.loginFrame}>
            <Text>Already have account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("LoginPage")}>
              <Text style={styles.loginText}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <CountryPicker
        show={openCountryCode}
        // when picker button press you will get the country object with dial code
        pickerButtonOnPress={(item) => {
          setCountryCode(item.dial_code);
          setOpenCountryCode(false);
        }}
        onBackdropPress={() => {
          setOpenCountryCode(false)
        }}
        style={{
          modal: {
            height: 300,
            width: "100%",
            maxWidth: "100%",
          },
        }}
      />
      <PlaceSearchBar
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        handlePlaceSelected={handlePlaceSelected}
      />
    </View>
  );
};

const styles = StyleSheet.create(InfluencerRegistrationFormStyles);

export default InfluencerRegistrationForm;
