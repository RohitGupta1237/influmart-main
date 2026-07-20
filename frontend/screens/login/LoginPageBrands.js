import * as React from "react";
import { openPrivacyPolicy, openTerms } from "../../util/legalLinks";
import { Image } from "expo-image";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { Color } from "../../GlobalStyles";
import { useNavigation } from "@react-navigation/native";
import { handleBrandLogin } from "../../controller/loginController";
import { loginStyle } from "./LoginStyle";
import { useAlert } from "../../util/AlertContext";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Loader from '../../shared/Loader'

// Admin bypass: these exact credentials open the social-verification admin
// panel directly — no brand account required. The real protection for admin
// actions is the ADMIN_SECRET checked by the backend inside that panel.
const ADMIN_EMAIL = "rohitgupta12371380@gmail.com";
const ADMIN_PASSWORD = "macbookpro@123";

const LoginPageBrand = () => {
  const navigation = useNavigation();
  const { showAlert } = useAlert();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const[loading,setLoading]=React.useState(false)

  return (
    <ScrollView
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: Color.colorWhitesmoke_100,
      }}
    >
      {loading&&<Loader loading={loading}/>}
      <TouchableOpacity
        onPress={() => navigation.navigate("BrandorInfluencer")}
      >
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
                <Text style={styles.welcomeBack}>Welcome back!</Text>
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
            Get Influencers of your choice. Please log in to your brand account
            to continue.
          </Text>
        </View>
      </View>
      <View style={{ margin: 15 }}>
        <View style={styles.depth5Frame01}>
          <View style={styles.depth6Frame0}>
            <View style={styles.depth2Frame01}>
              <TextInput
                placeholder="Email"
                textContentType="emailAddress"
                style={[styles.email, styles.emailClr]}
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>
        </View>
      </View>
      <View style={{ margin: 15 }}>
        <View style={styles.depth5Frame01}>
          <View style={styles.depth6Frame0}>
            <View style={styles.depth2Frame01}>
              <View style={styles.passwordContainer}>
                <TextInput
                  placeholder="Password"
                  secureTextEntry={!showPassword}
                  textContentType="password"
                  style={[styles.email, styles.emailClr, { flex: 1 }]}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
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
      </View>
      <View style={[styles.depth1Frame5, styles.depth1FrameSpaceBlock]}>
      <TouchableOpacity onPress={() => navigation.navigate("ForgotPasswordPage",{type:"brand"})}>
        <View style={styles.depth2Frame01}>
          <Text style={[styles.forgotYourPassword, styles.logInTypo]}>
            Forgot your password?
          </Text>
        </View>
        </TouchableOpacity>
      </View>
      <View style={{ margin: 15 }}>
        <View style={styles.depth2Frame06}>
          <TouchableOpacity
            style={{ width: "100%" }}
            onPress={async () => {
              // Admin bypass — no DB brand account needed.
              if (email.trim().toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
                setEmail("");
                setPassword("");
                navigation.navigate("SocialVerificationAdmin");
                return;
              }
              setLoading(true)
              let result = await handleBrandLogin(email, password);
              if (result.success) {
                showAlert("Success", result.message);
                navigation.navigate("BrandProfile");
                setEmail("");
                setPassword("");
              } else {
                showAlert("Error", result.message);
              }
              setLoading(false)
            }}
          >
            <View style={[styles.depth4Frame04, styles.depth4FrameLayout]}>
              <View style={[styles.depth5Frame03, styles.frameBg1]}>
                <View style={styles.depth2Frame01}>
                  <Text style={[styles.logIn, styles.logInTypo]}>Log In</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>  
        </View>
        <View>
            <View style={styles.loginFrame}>
              <Text style={styles.termsText}>
                By joining, you agree to our{" "}
              </Text>
              <TouchableOpacity onPress={()=>openTerms()}>
                <Text style={styles.linkText}>Terms of Service</Text>
              </TouchableOpacity>
              <Text style={styles.termsText}> and </Text>
              <TouchableOpacity onPress={()=>openPrivacyPolicy()}>
                <Text style={styles.linkText}>Privacy Policy</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.loginFrame}>
              <Text>Create a new Account? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("BrandRegistrationForm")}
              >
                <Text style={styles.loginText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create(loginStyle);

export default LoginPageBrand;
