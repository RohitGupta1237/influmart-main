import * as React from "react";
import { Image } from "expo-image";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Button,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  Modal,
} from "react-native";
import { PricePerPostStyles } from "./PricePerPost.scss";
import CountryCurrencyPicker from "../../../shared/CountryCurrencyPicker";

const PlatformPrice = ({
  platform,
  question,
  imageSource,
  value,
  setValue,
}) => {
  return (
    <View>
      <View style={styles.depth1FrameSpaceBlock}>
        <Text style={styles.platformTitle}>{platform}</Text>
      </View>
      <View style={styles.depth1FrameSpaceBlock}>
        <Text style={styles.questionText}>{question}</Text>
      </View>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={setValue}
          keyboardType="numeric"
        />
        <View style={styles.inputIcon}>
          <Image
            style={styles.inputImage}
            contentFit="cover"
            source={imageSource}
          />
        </View>
      </View>
    </View>
  );
};

const PricePerPost = ({ route, navigation }) => {
  const [instagram, setInstagram] = React.useState(() => (route.params?.price?.ig || "").toString());
  const [twitter, setTwitter] = React.useState(() => (route.params?.price?.tr || "").toString());
  const [facebook, setFacebook] = React.useState(() => (route.params?.price?.fb || "").toString());
  const [youtube, setYoutube] = React.useState(() => (route.params?.price?.yt || "").toString());
  const [tiktok, setTiktok] = React.useState(() => (route.params?.price?.tt || "").toString());
  const [openCountryCode, setOpenCountryCode] = React.useState(false);
  const [showDiscardModal, setShowDiscardModal] = React.useState(false);
  const social = route.params?.social;
  const follower = route.params?.follower;
  const photo = route.params?.photo;
  const isCompleted = route.params?.isCompleted;
  const savedFormParams = {
    savedName: route.params?.savedName,
    savedEmail: route.params?.savedEmail,
    savedUsername: route.params?.savedUsername,
    savedGender: route.params?.savedGender,
    savedMobileNumber: route.params?.savedMobileNumber,
    savedSelected: route.params?.savedSelected,
    savedLocation: route.params?.savedLocation,
    savedCountryCode: route.params?.savedCountryCode,
    savedAgreedToTerms: route.params?.savedAgreedToTerms,
    savedEmailVerified: route.params?.savedEmailVerified,
  };
  const [currency, setCurrency] = React.useState({
    code: "IN",
    name: { en: "India" },
    dial_code: "+91",
    currency: "INR",
    subunits: 100,
  });
  const redirect = route.params?.redirect;

  // Sync if params update while screen is already mounted in the stack
  React.useEffect(() => {
    const price = route.params?.price;
    if (price) {
      setInstagram((price.ig || "").toString());
      setYoutube((price.yt || "").toString());
      setTwitter((price.tr || "").toString());
      setTiktok((price.tt || "").toString());
      if (price.currency) setCurrency(price.currency);
    }
  }, [route.params?.price]);
  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.pricePerPostContainer}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              const hasUnsavedData = !!(instagram || youtube || twitter || tiktok);
              if (hasUnsavedData) {
                setShowDiscardModal(true);
              } else {
                navigation.navigate(redirect, {
                  social, follower, photo,
                  isCompleted: { ...isCompleted, pricePerPost: false },
                  ...savedFormParams,
                });
              }
            }}
          >
            <Image
              style={styles.headerIcon}
              contentFit="cover"
              source={require("../../../assets/cross_symbol.png")}
            />
          </TouchableOpacity>
          <Text style={styles.headerText}>Set your prices</Text>
          <View style={{ width: 20, height: 20 }}></View>
        </View>
        <PlatformPrice
          platform="Instagram"
          question="What's your rate for a single Instagram post?"
          imageSource={require("../../../assets/currency_symbol.png")}
          value={instagram}
          setValue={setInstagram}
        />
        <PlatformPrice
          platform="YouTube"
          question="What's your rate for a single YouTube video?"
          imageSource={require("../../../assets/currency_symbol.png")}
          value={youtube}
          setValue={setYoutube}
        />
        <PlatformPrice
          platform="TikTok"
          question="What's your rate for a single TikTok?"
          imageSource={require("../../../assets/currency_symbol.png")}
          value={tiktok}
          setValue={setTiktok}
        />
        <PlatformPrice
          platform="Twitter"
          question="What's your rate for a single Twitter post?"
          imageSource={require("../../../assets/currency_symbol.png")}
          value={twitter}
          setValue={setTwitter}
        />
        <TouchableOpacity onPress={() => Alert.alert("Currency", "Only INR (₹) is supported at this time.")}>
          <View style={styles.currencyContainer}>
            <Image
              style={styles.currencyIcon}
              contentFit="cover"
              source={require("../../../assets/coin_symbol.png")}
            />
            <Text style={styles.currencyText}>Currency</Text>
            <Text style={styles.currencyValue}>INR</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() => {
            const hasAnyPrice = !!(instagram || youtube || twitter || tiktok);
            navigation.navigate(redirect, {
              price: {
                ig: instagram,
                yt: youtube,
                tr: twitter,
                tt: tiktok,
                currency: currency,
              },
              social,
              follower,
              photo,
              isCompleted: { ...isCompleted, pricePerPost: hasAnyPrice },
              ...savedFormParams,
            });
          }}
        >
          <Text style={styles.confirmText}>Confirm</Text>
        </TouchableOpacity>

      </View>

      {/* Discard confirmation modal */}
      <Modal transparent visible={showDiscardModal} animationType="fade">
        <View style={discardModalStyles.overlay}>
          <View style={discardModalStyles.box}>
            <Text style={discardModalStyles.title}>Discard Changes?</Text>
            <Text style={discardModalStyles.message}>
              Your entered prices will be lost. Press Confirm to save them first.
            </Text>
            <View style={discardModalStyles.buttons}>
              <TouchableOpacity
                style={[discardModalStyles.btn, discardModalStyles.stayBtn]}
                onPress={() => setShowDiscardModal(false)}
              >
                <Text style={discardModalStyles.stayText}>Stay</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[discardModalStyles.btn, discardModalStyles.discardBtn]}
                onPress={() => {
                  setShowDiscardModal(false);
                  navigation.navigate(redirect, {
                    social, follower, photo,
                    isCompleted: { ...isCompleted, pricePerPost: false },
                    ...savedFormParams,
                  });
                }}
              >
                <Text style={discardModalStyles.discardText}>Discard</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
};

const styles = StyleSheet.create(PricePerPostStyles);

const discardModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
  },
  box: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 24,
    width: "80%",
    maxWidth: 340,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111",
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    color: "#555",
    marginBottom: 22,
    lineHeight: 20,
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  btn: {
    paddingVertical: 9,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  stayBtn: {
    backgroundColor: "#f0f0f0",
  },
  stayText: {
    color: "#333",
    fontWeight: "600",
    fontSize: 14,
  },
  discardBtn: {
    backgroundColor: "#e53935",
  },
  discardText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});

export default PricePerPost;
