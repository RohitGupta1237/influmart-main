import * as React from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { Asset } from "expo-asset";
import Icon from "react-native-vector-icons/FontAwesome";
import { useAlert } from "../util/AlertContext";
import { BrandSignUp } from "../controller/signupController";
import { BrandAccountSignupDataPreviewStyles } from "./BrandAccountSignupDataPreview.scss";
import { handleImageSelection } from "../util/imagePickerUtil";
import Loader from "../shared/Loader";
import avatarImages from "../constants/Avatars";

const BrandAccountSignupDataPreview = ({ route, navigation }) => {
  const payload = route.params?.payload;
  const [selectedImage, setSelectedImage] = React.useState(null);
  const [photo, setPhoto] = React.useState(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const { showAlert } = useAlert();
  const [loading, setLoading] = React.useState(false);
  const [selectedAvatarIndex, setSelectedAvatarIndex] = React.useState("");

  const registerBrand = async () => {
    setLoading(true);
    await BrandSignUp({ ...payload, image: photo }, navigation, showAlert);
    setLoading(false);
  };

  const handleUploadPhoto = async () => {
    if (Platform.OS === "web") {
      // Web: use the native file input (reliable) instead of expo-image-picker
      document.getElementById("brandSignupFileInput")?.click();
      return;
    }
    const result = await handleImageSelection("library");

    if (result.canceled) {
      if (result.error) {
        showAlert("Alert", result.error);
      }
      return;
    }

    setPhoto(result);
    setSelectedImage(result.uri);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const uri = URL.createObjectURL(file);
      const img = { uri, name: file.name, type: file.type };
      setPhoto(img);
      setSelectedImage(uri);
    }
  };

  const renderImageSection = () => (
    <View style={styles.centeredView}>
      <Image
        source={
          selectedImage
            ? { uri: selectedImage }
            : require("../assets/blank-profile.png")
        }
        contentFit="cover"
        style={styles.profileImage}
      />
      <Text style={styles.tipTitle}>
        Select your first avatar.You can always change your style later.
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.avatarsContainer}
      >
        {avatarImages &&
          avatarImages?.map((avatar, index) => {
            return (
              <TouchableOpacity
                style={[
                  styles.avatarContainer,
                  selectedAvatarIndex === index && styles.selectedAvatar,
                ]}
                key={index}
                onPress={() => {
                  setSelectedAvatarIndex(index);
                }}
              >
                <Image
                  style={styles.avatarImage}
                  source={avatar.imageUrl}
                  contentFit="contain"
                />
              </TouchableOpacity>
            );
          })}
      </ScrollView>
      <View style={styles.divider}>
        <Text style={styles.orText}>or</Text>
      </View>

      {Platform.OS === "web" && (
        <input
          id="brandSignupFileInput"
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      )}

      <View style={styles.buttonContainer}>
        <Pressable style={styles.uploadButton} onPress={handleUploadPhoto}>
          <Text style={styles.uploadBtnText}>Upload Image</Text>
        </Pressable>
        <Pressable
          style={styles.uploadButton}
          onPress={() => setSelectedImage(null)}
        >
          <Text style={styles.removeBtnText}>Remove Image</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderTextRow = (label, value, isPassword) => (
    <View style={styles.rowContainer}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, isPassword && styles.password]}>
        {isPassword && !showPassword ? "********" : value}
      </Text>
      {isPassword && (
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Icon
            name={showPassword ? "eye" : "eye-slash"}
            size={24}
            color="black"
          />
        </TouchableOpacity>
      )}
    </View>
  );

  function readImage(url, callback) {
    var request = new XMLHttpRequest();
    request.onload = function () {
      var file = new FileReader();
      file.onloadend = function () {
        callback(file.result);
      };
      file.readAsDataURL(request.response);
    };
    request.open("GET", url);
    request.responseType = "blob";
    request.send();
  }

  React.useEffect(() => {
    if (selectedAvatarIndex !== "") {
      // Resolve bundled avatar to a real URI (web + native). Old readImage()
      // fetched a relative path that 404'd, so the avatar was never saved.
      const uri = Asset.fromModule(avatarImages[selectedAvatarIndex].imageUrl).uri;
      setPhoto({
        name: `avatar${selectedAvatarIndex + 1}`,
        uri,
        type: "image/png",
        isSelected: true,
        file: `avatar${selectedAvatarIndex + 1}`,
      });
      setSelectedImage(uri);
    }
  }, [selectedAvatarIndex]);

  return (
    <ScrollView style={styles.container}>
      {loading && <Loader loading={loading} />}
      <View style={styles.mainView}>
        <TouchableOpacity
          style={styles.fullWidth}
          onPress={() => navigation.navigate("OtpVerification")}
        >
          <View style={styles.header}>
            <Text style={styles.headerText}>Review</Text>
          </View>
        </TouchableOpacity>
        {renderImageSection()}
        {renderTextRow("Email ID", payload?.email)}
        {renderTextRow("Password", payload?.password, true)}
        <View style={styles.rowContainer}>
          <Text style={styles.label}>Brand type</Text>
          <Text style={styles.value}>{payload?.category?.join(", ")}</Text>
        </View>
        {renderTextRow("Username", payload?.name)}
        <TouchableOpacity style={styles.fullWidth} onPress={registerBrand}>
          <View style={styles.createAccountButton}>
            <Text style={styles.createAccountText}>Create account</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create(BrandAccountSignupDataPreviewStyles);

export default BrandAccountSignupDataPreview;
