import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { handleImageSelection } from "../../../util/imagePickerUtil";
import MultiDropDown from "../../../shared/MultiDropDown";
import { useAlert } from "../../../util/AlertContext";
import {
  BrandUpdate,
  getBrandProfile,
} from "../../../controller/brandController";
import { Asset } from "expo-asset";
import * as FileSystem from "expo-file-system";
import Loader from "../../../shared/Loader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ImageWithFallback from "../../../util/ImageWithFallback";
import avatarImages from "../../../constants/Avatars";
import {
  Border,
  Color,
  FontFamily,
  FontSize,
  Padding,
} from "../../../GlobalStyles";

const BrandAccountManage = ({ route, navigation }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedAvatarIndex, setSelectedAvatarIndex] = useState("");
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    password: "",
    brandName: "",
    category: [],
    image: null,
    isSelectedImage: false,
  });
  const [editFields, setEditFields] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showAlert } = useAlert();
  const [brandId, setBrandId] = useState("");
  const [change, setChange] = useState(false);
  const [brandTypeDropdown, setBrandTypeDropdown] = useState(false);

  useEffect(() => {
    const getData = async () => {
      const _brandId = await AsyncStorage.getItem("brandId");
      setBrandId(_brandId);
      const data = await getBrandProfile(_brandId, showAlert);
      if (data) {
        setProfileData({
          name: data?.name || "",
          email: data?.email || "",
          brandName: data?.brandName || "",
          category: data?.category?.split(",") || [],
          image: data?.profileUrl || null,
          isSelectedImage: data?.isSelectedImage,
        });
      }
    };
    getData();
  }, [route.params]);

  const toggleEditField = (field) => {
    setEditFields((prev) => ({ ...prev, [field]: !prev[field] }));
  };
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

  useEffect(() => {
    if (selectedAvatarIndex !== "") {
      readImage(
        `../../../assets/avatars/avatar${selectedAvatarIndex + 1}.png`,
        function (base64) {
          setProfileData((prev) => ({
            ...prev,
            image: {
              name: `avatar${selectedAvatarIndex}`,
              uri: base64,
              type: "image/png",
              isSelected: true,
              file: `avatar${selectedAvatarIndex + 1}`,
            },
          }));
          setSelectedImage(base64);
          setChange(false);
        }
      );
    }
  }, [selectedAvatarIndex]);

  const handleImagePick = async (type) => {
    const result = await handleImageSelection(type);
    if (result.canceled) {
      if (result.error) {
        showAlert("Alert", result.error);
      }
      return;
    }
    setProfileData((prev) => ({ ...prev, image: result }));
    setChange(false);
    setSelectedImage(result.uri);
    setSelectedAvatarIndex("");
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const uri = URL.createObjectURL(file);
      setProfileData((prev) => ({
        ...prev,
        image: { uri, name: file.name, type: file.type },
      }));
      setChange(false);
      setSelectedImage(uri);
      setSelectedAvatarIndex("");
    }
  };
  const handleSubmit = async () => {
    if (!profileData.name || !profileData.email || !profileData.brandName) {
      showAlert("Brand Update Error", "Please fill all the required fields");
      return;
    }
    setLoading(true);
    await BrandUpdate(brandId, profileData, navigation, showAlert);
    setLoading(false);
  };

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <View style={styles.headerContent}>
            <Image
              style={styles.headerImage}
              contentFit="cover"
              source={require("../../../assets/depth-4-frame-07.png")}
            />
            <Text style={styles.headerText}>Manage Account</Text>
          </View>
        </TouchableOpacity>
      </View>
      {loading && <Loader loading={loading} />}
      <View style={styles.brandUpdateForm}>
        {selectedImage ? (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: selectedImage }}
              style={styles.profileImage}
              contentFit="contain"
            />
          </View>
        ) : (
          profileData.image && (
            <View style={styles.imageContainer}>
              <ImageWithFallback
                image={profileData?.image}
                isSelectedImage={profileData?.isSelectedImage}
                imageStyle={styles.profileImage}
              />
            </View>
          )
        )}
        <TouchableOpacity onPress={() => setChange(true)}>
          <Text style={styles.changePhotoText}>Change Photo</Text>
        </TouchableOpacity>
        {change && (
          <>
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
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.uploadButton]}
                onPress={() => handleImagePick("library")}
              >
                <Text style={styles.buttonText}>Upload Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.takePhotoButton]}
                onPress={() => handleImagePick("camera")}
              >
                <Text style={[styles.buttonText, styles.takePhotoButtonText]}>
                  Take Photo
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
        {Platform.OS === "web" && (
          <input
            id="fileInput"
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        )}

        <View style={styles.formGroup}>
          <Text style={styles.label}>Name</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={profileData.name}
              editable={editFields.name}
              onChangeText={(text) =>
                setProfileData((prev) => ({ ...prev, name: text }))
              }
            />
            <TouchableOpacity
              style={styles.editIcon}
              onPress={() => toggleEditField("name")}
            >
              <Icon name="pencil" size={20} color="gray" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={profileData.email}
              editable={editFields.email}
              onChangeText={(text) =>
                setProfileData((prev) => ({ ...prev, email: text }))
              }
            />
            <TouchableOpacity
              style={styles.editIcon}
              onPress={() => toggleEditField("email")}
            >
              <Icon name="pencil" size={20} color="gray" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Brand Name</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={profileData.brandName}
              editable={editFields.brandName}
              onChangeText={(text) =>
                setProfileData((prev) => ({ ...prev, brandName: text }))
              }
            />
            <TouchableOpacity
              style={styles.editIcon}
              onPress={() => toggleEditField("brandName")}
            >
              <Icon name="pencil" size={20} color="gray" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Category</Text>
          <MultiDropDown
            name={profileData.category.join(",")}
            items={[
              { key: "grocery", value: "Grocery" },
              { key: "electronics", value: "Electronics" },
              { key: "fashion", value: "Fashion" },
              { key: "toys", value: "Toys" },
              { key: "beauty", value: "Beauty" },
              { key: "home-decoration", value: "Home Decoration" },
              { key: "fitness", value: "Fitness" },
              { key: "education", value: "Education" },
              { key: "others", value: "Others" },
            ]}
            placeholder="Select option"
            icon="none"
            dropDownOptionStyle={{
              width: "100%",
              paddingVertical: 16,
            }}
            dropDownContainerStyle={{ width: "100%" }}
            dropDownItemsStyle={{ width: "100%", top: -470 }}
            titleStyle={{ paddingStart: 12, color: "#4F7A94" }}
            selectedValue={profileData.category}
            setSelectedValues={(values) =>
              setProfileData((prev) => ({ ...prev, category: values }))
            }
            close={brandTypeDropdown}
            setClose={setBrandTypeDropdown}
          />
        </View>

        {/* Add similar fields for location, website, and description */}

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Update Profile</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  // Define your styles here, following a similar pattern as in the previous components.
  scrollView: {
    flex: 1,
    backgroundColor: "#fff",
  },
  brandUpdateForm: {
    padding: 16,
  },
  userProfilePhoto: {
    flex: 1,
    backgroundColor: Color.colorWhite,
    padding: Padding.p_base,
    width: "100%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: Padding.p_base,
  },
  profileImage: {
    width: 20,
    height: 20,
    borderRadius: 24,
    marginRight: Padding.p_base,
  },
  profilePhotoText: {
    fontSize: FontSize.size_lg,
    fontFamily: FontFamily.beVietnamProBold,
    width: "80%",
    textAlign: "center",
  },
  imageContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  changePhotoText: {
    textAlign: "center",
    color: "#007BFF",
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: FontSize.size_3xl,
    fontFamily: FontFamily.beVietnamProBold,
    marginVertical: Padding.p_base,
    lineHeight: 28,
  },
  buttonContainer: {
    flexDirection: "column",
    justifyContent: "center",
    marginTop: Padding.p_base,
    gap: Padding.p_base,
    width: "100%",
    paddingHorizontal: Padding.p_base,
  },
  tipContainer: {
    flexDirection: "row",
    marginBottom: Padding.p_base,
    backgroundColor: Color.colorWhitesmoke,
    borderRadius: Border.br_xs,
    padding: Padding.p_base,
  },
  tipImage: {
    width: 48,
    height: 48,
    borderRadius: Border.br_xs,
  },
  tipTextContainer: {
    marginLeft: Padding.p_base,
    flex: 1,
  },
  tipTitle: {
    fontSize: FontSize.size_base,
    fontFamily: FontFamily.beVietnamProMedium,
    color: Color.colorSlategray_300,
    marginBottom: Padding.p_5xs,
    textAlign: "center",
    marginTop: 60,
  },
  tipDescription: {
    fontSize: FontSize.size_sm,
    fontFamily: FontFamily.beVietnamProRegular,
    color: "#637587",
    lineHeight: FontSize.size_base,
  },
  label: {
    marginBottom: 4,
    fontFamily: FontFamily.plusJakartaSansMedium,
    fontWeight: "500",
    fontSize: FontSize.size_base,
    color: Color.colorGray_100,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    borderRadius: Border.br_xs,
    backgroundColor: Color.colorAliceblue,
    marginTop: Padding.p_5xs,
    color: "#4F7A94",
    fontSize: FontSize.size_base,
    fontFamily: FontFamily.plusJakartaSansRegular,
  },
  textInput: {
    flex: 1,
    height: 40,
    borderRadius: Border.br_xs,
    backgroundColor: Color.colorAliceblue,
    paddingRight: Padding.p_base,
    color: "#4F7A94",
    fontSize: FontSize.size_base,
    fontFamily: FontFamily.plusJakartaSansRegular,
  },
  editIcon: {
    marginLeft: 8,
  },
  passwordIcon: {
    marginLeft: 8,
  },
  submitButton: {
    backgroundColor: "#007BFF",
    paddingVertical: 12,
    borderRadius: 4,
  },
  submitButtonText: {
    textAlign: "center",
    color: "#fff",
    fontSize: 16,
  },
  uploadButton: {
    backgroundColor: "#F0F2F5",
  },
  takePhotoButton: {
    backgroundColor: Color.colorRoyalblue,
    marginBottom: 20,
  },
  buttonText: {
    fontSize: FontSize.size_base,
    fontFamily: FontFamily.beVietnamProBold,
    color: Color.colorGray,
  },
  takePhotoButtonText: {
    color: Color.colorWhite,
  },
  previewContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  selectedImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  confirmButtonContainer: {
    margin: "auto",
    width: "100%",
    marginTop: 100,
  },
  confirmButton: {
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Color.colorDodgerblue,
    borderRadius: Border.br_xs,
    paddingHorizontal: Padding.p_base,
  },
  confirmButtonText: {
    color: Color.colorWhitesmoke_100,
    fontFamily: FontFamily.interBold,
    fontSize: FontSize.size_sm,
    fontWeight: "700",
    letterSpacing: 0,
    lineHeight: 21,
    textAlign: "left",
  },
  avatarsContainer: {
    width: "100%",
    paddingVertical: 40,
    height: "auto",
    paddingHorizontal: Padding.p_base,
  },
  avatarContainer: {
    padding: 20,
    width: 190,
    borderRadius: Border.br_base,
    marginEnd: 16,
  },
  selectedAvatar: {
    borderWidth: 2,
    backgroundColor: Color.colorWhitesmoke_400,
    borderColor: Color.colorGainsboro_300,
  },
  avatarImage: {
    width: 150,
    height: 150,
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: Color.colorGainsboro_300,
    marginVertical: 12,
  },
  orText: {
    position: "absolute",
    left: "50%",
    top: -10,
    color: Color.colorDimgray,
    backgroundColor: "#fff",
    paddingHorizontal: 8,
  },
  helpcenter: {
    backgroundColor: "#fff",
    width: "100%",
    flex: 1,
  },
  headerContainer: {
    height: 72,
    marginTop: Padding.p_base,
    padding: Padding.p_base,
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
  button: {
    height: 40,
    borderRadius: Border.br_xs,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Padding.p_base,
    marginHorizontal: Padding.p_2xs,
    width: "100%",
  },
});

export default BrandAccountManage;
