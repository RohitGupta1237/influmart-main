import React, { useCallback, useEffect, useState } from "react";
import { Image } from "expo-image";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from "react-native";
import axios from "axios";
import { Color } from "../../GlobalStyles";
import MultipleSelectList from "../../shared/MultiSelect";
import { SendOtp } from "../../controller/signupController";
import { signupStyles } from "./SignUpStyles.scss";
import { useAlert } from "../../util/AlertContext";
import Icon from "react-native-vector-icons/MaterialCommunityIcons"; // Import the icon component
import Loader from '../../shared/Loader';
import MultiDropDown from '../../shared/MultiDropDown';
import API_ENDPOINT from "../../config";

const BrandRegistrationForm = ({ route, navigation }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false)
  const [document, setDocument] = useState(null);
  const { showAlert } = useAlert();
  const payload = route.params?.payload;
  const [showPassword, setShowPassword] = useState(false); // State to manage password visibility
  const[brandTypeDropdown,setBrandTypeDropdown]=useState(false)
  const data = [
    { key: "lifestyle-personal-branding", value: "Lifestyle & Personal Branding" },
    { key: "fashion-beauty", value: "Fashion & Beauty" },
    { key: "food-cooking", value: "Food & Cooking" },
    { key: "fitness-health", value: "Fitness & Health" },
    { key: "travel-exploration", value: "Travel & Exploration" },
    { key: "tech-gaming", value: "Tech & Gaming" },
    { key: "education-knowledge", value: "Education & Knowledge" },
    { key: "entertainment-comedy", value: "Entertainment & Comedy" },
    { key: "business-entrepreneurship", value: "Business & Entrepreneurship" },
    { key: "art-creativity", value: "Art & Creativity" },
    { key: "parenting-family", value: "Parenting & Family" },
    { key: "regional-local-culture", value: "Regional/Local Culture Creators" },
    { key: "home-decor-interior", value: "Home Decor / Interior Creators" },
    { key: "others", value: "Others" },
  ];
  const clearForm = useCallback(() => {
    setEmail("");
    setPassword("");
    setUsername("");
    setSelected([]);
    setDocument(null);
  }, []);

  const handleDocumentPick = () => {
    if (Platform.OS === 'web') {
      const input = window.document.createElement('input');
      input.type = 'file';
      input.accept = '.pdf,.jpg,.jpeg,.png';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            setDocument({ dataUrl: ev.target.result, name: file.name, type: file.type });
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    }
  };


  // Listen for navigation focus to clear form data
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", clearForm);
    return unsubscribe;
  }, [navigation, clearForm]);

  const handleUsernameBlur = async () => {
    if (!username) return;
    try {
      const response = await axios.post(`${API_ENDPOINT}/influencers/verifyUser`, { userName: username });
      if (response.status === 200) {
        setUsernameError("Username is already taken");
      } else {
        setUsernameError("");
      }
    } catch {
      setUsernameError("");
    }
  };

  const handleSubmit = async () => {
    const payload = {
      email,
      password,
      category: selected,
      name: username,
      brandName: name,
      document,
    };
    if (usernameError) {
      showAlert("Brand SignUp Error", "Please choose a different username");
      return;
    }
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      showAlert("Brand SignUp Error", "Please enter a valid email address");
      return;
    }
    if (!email || !password || !selected.length || !username || !name) {
      showAlert("Brand SignUp Error", "Please fill all the fields");
      return;
    }
    if (password.length < 8) {
      showAlert(
          "Brand SignUp Error",
          "Password should be at least 8 characters long"
      );
      return;
    }
    if (!document) {
      showAlert("Brand SignUp Error", "Please upload a business verification document");
      return;
    }
    setLoading(true)
    await SendOtp(payload, navigation, showAlert);
    setLoading(false)
  };

  return (
      <ScrollView style={styles.scrollView}>
        {loading && <Loader loading={loading} />}
        <View style={styles.brandregistrationform}>
          <View style={[styles.depth0Frame0, styles.frameLayout2]}>
            <TouchableOpacity onPress={() => navigation.navigate("Homepage")}>
              <View style={[styles.depth1Frame0, styles.depth1FrameSpaceBlock]}>
                <View style={[styles.depth2Frame0, styles.frameFlexBox]}>
                  <View style={[styles.depth3Frame0, styles.frameLayout1]}>
                    <Image
                        style={styles.depth4Frame0}
                        contentFit="cover"
                        source={require("../../assets/depth-4-frame-07.png")}
                    />
                  </View>
                  <View
                      style={[styles.depth4Frame1, styles.depth1FrameSpaceBlock]}
                  >
                    <View>
                      <Text style={styles.createAnAccount}>
                        Create a Brand account
                      </Text>
                    </View>
                  </View>
                  <View style={styles.frameFlexBox}>
                    <View style={[styles.depth4Frame01, styles.frameLayout1]}>
                      <View style={[styles.depth5Frame0, styles.frameLayout1]} />
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
            <View style={[styles.depth1Frame2, { height: "auto", paddingVertical: 8 }]}>
              <View style={[styles.depth2Frame02, { width: "100%", height: "auto" }]}>
                <View style={{ width: "100%", height: "auto" }}>
                  <View style={styles.depth4Frame02}>
                    <Text style={[styles.email, styles.emailTypo]}>Name</Text>
                    <Text style={styles.mandatoryText}>*</Text>
                  </View>
                  <Text style={tooltipStyles.hintText}>Use name as registered on your GST/PAN certificate or business license.</Text>
                  <View>
                    <View style={[styles.depth5Frame01]}>
                      <TextInput
                          style={styles.textInput}
                          value={name}
                          onChangeText={setName}
                          placeholder="Brand Name"
                      />
                    </View>
                  </View>
                </View>
              </View>
            </View>
            <View style={[styles.depth1Frame2, { height: "auto", paddingVertical: 8 }]}>
              <View style={[styles.depth2Frame02, { width: "100%", height: "auto" }]}>
                <View style={{ width: "100%", height: "auto" }}>
                  <View style={styles.depth4Frame02}>
                    <Text style={[styles.email, styles.emailTypo]}>Email</Text>
                    <Text style={styles.mandatoryText}>*</Text>
                  </View>
                  <Text style={tooltipStyles.hintText}>Prefer using your company domain email (e.g. you@yourcompany.com).</Text>
                  <View>
                    <View style={[styles.depth5Frame01]}>
                      <TextInput
                          style={styles.textInput}
                          value={email}
                          onChangeText={setEmail}
                          placeholder="Email"
                          autoCapitalize="none"
                      />
                    </View>
                  </View>
                </View>
              </View>
            </View>
            <View style={styles.depth1Frame2}>
              <View style={[styles.depth2Frame02, styles.frameLayout]}>
                <View style={styles.frameLayout}>
                  <View style={styles.depth4Frame02}>
                    <Text style={[styles.email, styles.emailTypo]}>Password</Text>
                    <Text style={styles.mandatoryText}>*</Text>
                  </View>
                  <View
                      style={[
                        styles.depth5Frame01,
                        styles.depth5FrameBg,
                        { flex: 1 },
                      ]}
                  >
                    <TextInput
                        style={styles.textInput}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Password"
                        secureTextEntry={!showPassword}
                    />
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
                  </View>
                </View>
              </View>
            </View>
            <View style={styles.depth1Frame6}>
              <View style={[styles.depth2Frame06]}>
                <View style={styles.frameLayout}>
                  <View style={styles.depth4Frame02}>
                    <Text style={[styles.email, styles.emailTypo]}>Username</Text>
                    <Text style={styles.mandatoryText}>*</Text>
                  </View>
                  <View style={styles.depth4Frame06}>
                    <View style={[styles.depth5Frame01, styles.depth5FrameBg]}>
                      <TextInput
                          style={styles.textInput}
                          value={username}
                          onChangeText={(val) => { setUsername(val); setUsernameError(""); }}
                          placeholder="Username"
                          onBlur={handleUsernameBlur}
                      />
                    </View>
                    {usernameError ? (
                        <Text style={{ color: "red", fontSize: 12, marginTop: 4 }}>{usernameError}</Text>
                    ) : null}
                  </View>
                </View>
              </View>
            </View>
            <View style={[styles.depth1Frame2, { height: "auto", zIndex: 100 }]}>
              <View style={[styles.depth2Frame02, { width: "100%", height: "auto", zIndex: 100, overflow: "visible" }]}>
                <View style={{ width: "100%", height: "auto", zIndex: 100, overflow: "visible" }}>
                  <View style={styles.depth4Frame02}>
                    <Text style={[styles.email, styles.emailTypo]}>
                      Brand Type
                    </Text>
                    <Text style={styles.mandatoryText}>*</Text>
                  </View>
                  <View style={{ zIndex: 100, overflow: "visible" }}>
                    <View style={{ zIndex: 100, overflow: "visible" }}>
                      <MultiDropDown
                          name={selected?.join(", ")}
                          items={data}
                          placeholder={"Select option"}
                          icon={"none"}
                          dropDownOptionStyle={{
                            width: "100%",
                            paddingVertical: 16,
                          }}
                          dropDownContainerStyle={{ width: "100%", zIndex: 100, overflow: "visible" }}
                          dropDownItemsStyle={{ width: "100%", zIndex: 200, maxHeight: 300 }}
                          titleStyle={{ paddingStart: 12, color: "#4F7A94" }}
                          selectedValue={selected}
                          setSelectedValues={setSelected}
                          close={brandTypeDropdown}
                          setClose={setBrandTypeDropdown}
                      />
                    </View>
                  </View>
                </View>
              </View>
            </View>
            {/* Business Document Upload */}
            <View style={[styles.depth1Frame2, { height: "auto", paddingVertical: 12 }]}>
              <View style={[styles.depth2Frame02, { width: "100%", height: "auto" }]}>
                <View style={{ width: "100%", height: "auto" }}>
                  <View style={styles.depth4Frame02}>
                    <Text style={[styles.email, styles.emailTypo]}>Business Verification Document</Text>
                    <Text style={styles.mandatoryText}>*</Text>
                  </View>
                  <Text style={docStyles.acceptedTypes}>
                    Accepted: GST Certificate, Business PAN, Company Registration Certificate (PDF, JPG, PNG)
                  </Text>
                  <TouchableOpacity style={docStyles.uploadBtn} onPress={handleDocumentPick}>
                    <Icon name="file-upload-outline" size={18} color="#1A5CE5" />
                    <Text style={docStyles.uploadBtnText}>
                      {document ? document.name : "Tap to upload document"}
                    </Text>
                  </TouchableOpacity>
                  {document && (
                      <Text style={docStyles.selectedDoc}>✓ {document.name}</Text>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.depth1Frame6}>
              <View style={styles.depth2Frame06}>
                <View style={styles.depth3FrameLayout}>
                  <TouchableOpacity
                      style={{ width: "100%" }}
                      onPress={handleSubmit}
                  >
                    <View style={[styles.depth4Frame07, styles.frameBg]}>
                      <View style={[styles.depth5Frame06, styles.frameBg]}>
                        <View style={styles.depth7Frame0}>
                          <Text style={[styles.signUp, styles.signUpTypo]}>
                            Generate OTP
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            <View>
              <View style={styles.loginFrame}>
                <Text style={styles.termsText}>By joining, you agree to our </Text>
                <TouchableOpacity
                    onPress={() =>
                        navigation.navigate("TosScreen", {
                          navigate: "BrandRegistrationForm",
                        })
                    }
                >
                  <Text style={styles.linkText}>Terms of Service</Text>
                </TouchableOpacity>
                <Text style={styles.termsText}> and </Text>
                <TouchableOpacity
                    onPress={() =>
                        navigation.navigate("PPScreen", {
                          navigate: "BrandRegistrationForm",
                        })
                    }
                >
                  <Text style={styles.linkText}>Privacy Policy</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.loginFrame}>
                <Text>Already have account? </Text>
                <TouchableOpacity
                    onPress={() => navigation.navigate("LoginPageBrands")}
                >
                  <Text style={{ color: Color.colorDodgerblue }}>Login</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
  );
};

const styles = StyleSheet.create({
  ...signupStyles,
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
});

const tooltipStyles = StyleSheet.create({
  hintText: {
    fontSize: 11,
    color: "#888",
    marginTop: 2,
    marginBottom: 6,
  },
});

const docStyles = StyleSheet.create({
  acceptedTypes: {
    fontSize: 11,
    color: "#888",
    marginBottom: 10,
    marginTop: 6,
  },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: "#1A5CE5",
    borderStyle: "dashed",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#f0f5ff",
    marginBottom: 20,
  },
  uploadBtnText: {
    color: "#1A5CE5",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
  },
  selectedDoc: {
    marginTop: -14,
    marginBottom: 20,
    fontSize: 12,
    color: "#2e7d32",
    fontWeight: "600",
  },
});

export default BrandRegistrationForm;
