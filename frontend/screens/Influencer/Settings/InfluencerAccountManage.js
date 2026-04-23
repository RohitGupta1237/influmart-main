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
import Loader from "../../../shared/Loader";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ImageWithFallback from "../../../util/ImageWithFallback";
import avatarImages from "../../../constants/Avatars";
import { GetInfluencerProfile, InfluencerUpdate } from "../../../controller/InfluencerController";
import {InfluencerManageAccountStyles} from "./InfluencerAccountManage.scss"

const InfluencerManageAccount = ({ route, navigation }) => {
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
      const _brandId = await AsyncStorage.getItem("influencerId");
      setBrandId(_brandId);
      const data = await GetInfluencerProfile(
        _brandId,
        setShowPassword,
        showAlert
      );
      if (data) {
        setProfileData({
          name: data?.userName || "",
          email: data?.email || "",
          brandName: data?.influencerName || "",
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
    await InfluencerUpdate(brandId, profileData, navigation, showAlert);
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
          <Text style={styles.label}>User Name</Text>
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
          <Text style={styles.label}>Influencer Name</Text>
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

const styles = StyleSheet.create(InfluencerManageAccountStyles);

export default InfluencerManageAccount;
