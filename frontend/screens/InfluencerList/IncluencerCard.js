import * as React from "react";
import { Image } from "expo-image";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import {
  Border,
  FontSize,
  FontFamily,
  Color,
  Padding,
} from "../../GlobalStyles";
import { formatNumber } from '../../helpers/GraphData';
import { useNavigation } from "@react-navigation/core";
import ImageWithFallback from "../../util/ImageWithFallback";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAlert } from "../../util/AlertContext";
import { LinearGradient } from 'expo-linear-gradient'


const InfluencerCard = ({
  depth5Frame0,
  kylieCosmetics,
  beauty,
  influencerId,
  userName,
  statistics,
  isSelectedImage
}) => {
  const { showAlert } = useAlert()
  const navigation = useNavigation()
  const [navigate, setnavigate] = React.useState(false)
  React.useEffect(() => {
    const getData = async () => {
      const brand = await AsyncStorage.getItem("brandId")
      const influencer = await AsyncStorage.getItem("influencerId")
      if (!brand && !influencer) {
        setnavigate(false)
      } else {
        setnavigate(true)
      }
    }
    getData()
  })
  const handleClick = async () => {
    if (navigate) {
      navigation.navigate("Analytics", { influencerId })
    } else {
      showAlert("Login Require!", "Please login to see Influencer's Analytics.")
    }
  }
  return (
    <View>
      <TouchableOpacity onPress={() => { handleClick() }}>
        <View style={styles.depth2FrameLayout}>
          <Text style={styles.google}>
            {kylieCosmetics
              ? kylieCosmetics.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
              : ""}
          </Text>
          <View style={styles.profileTop}>
            <Text style={styles.userNameText}>@ {userName}</Text>
            <Text style={styles.insightText}>{beauty}</Text>
          </View>
          <ImageWithFallback image={depth5Frame0} imageStyle={styles.image} isSelectedImage={isSelectedImage} />
          <View style={styles.profileBottomContainer}>
            <View style={styles.profileBottomChip}>
              <Image style={{ width: 16, height: 16 }} source={require('../../assets/instagram-logo.png')} />
              <Text style={styles.collaborationCount}>{formatNumber(statistics.instaData)}</Text>
            </View>
            <View style={styles.profileBottomChip}>
              <Image style={{ width: 16, height: 16 }} source={require('../../assets/tiktok-logo.png')} />
              <Text style={styles.collaborationCount}>{formatNumber(statistics.fbData)}</Text>
            </View>
            <View style={styles.profileBottomChip}>
              <Image style={{ width: 16, height: 16 }} source={require('../../assets/youtube-logo.png')} />
              <Text style={styles.collaborationCount}>{formatNumber(statistics.ytData)}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
      <View style={styles.divider}></View>
    </View>

  );
};

const styles = StyleSheet.create({
  cardContainer: {
    height: "auto",
    width: 280,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: Color.colorWhite,
    paddingTop: 16
  },
  cardContent: {
    height: "100%",
    width: "100%"
  },
  imageContainer: {
    height: 420,
    width: 280,
    borderRadius: Border.br_xs,
    overflow: "hidden",
    backgroundColor: "#0C0B0B"
  },
  image: {
    height: 350,
    width: 280,
    borderRadius: Border.br_xs,
  },
  textContainer: {
    height: 83,
    width: 358,
    justifyContent: "center",
    paddingVertical: Padding.p_base,
  },
  titleContainer: {
    height: 23,
    width: 358,
  },
  title: {
    fontSize: FontSize.size_lg,
    lineHeight: 23,
    fontWeight: "700",
    fontFamily: FontFamily.beVietnamProBold,
    color: Color.colorWhite,
    textAlign: "left",
  },
  categoryContainer: {
    height: 24,
    width: 358,
    marginTop: 4,
    alignItems: "flex-end",
    justifyContent: "flex-start",
    flexDirection: "row",
  },
  category: {
    fontSize: FontSize.size_base,
    lineHeight: 24,
    fontFamily: FontFamily.beVietnamProRegular,
    color: "#ccc",
    textAlign: "left",
  },
  overlayContainer: {
    width: 280,
    height: 350,
    position: "absolute",
    top: 0,
    overflow: "hidden"
  },
  overlay: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    padding: Padding.p_base,
    gap: 3
  },
  insightText: {
    fontSize: FontSize.size_xs,
    fontFamily: FontFamily.plusJakartaSansBold,
    color: Color.colorSlategray_300,
  },
  google: {
    fontSize: FontSize.size_base,
    lineHeight: 24,
    fontFamily: FontFamily.interBold,
    fontWeight: "500",
    textAlign: "left",
    color: Color.colorBlack,
    alignSelf: "stretch",
    marginBottom: 4,
  },
  categoryText: {
    fontSize: FontSize.size_smi,
    lineHeight: 24,
    fontFamily: FontFamily.interMedium,
    fontWeight: "500",
    color: Color.colorSlategray_100,
  },
  statisticsContainer: {
    width: "100%",
    height: "auto",
    paddingHorizontal: Padding.p_base,
    paddingVertical: Padding.p_xs,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-evenly"
  },
  statistics: {
    width: 80,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4
  },
  depth2FrameLayout: {
    height: "auto",
    width: 280,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: Color.colorWhite,
    paddingTop: 16
  },
  profileTop: {
    width: "100%",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  userNameText: {
    fontSize: FontSize.size_sm,
    fontFamily: FontFamily.plusJakartaSansBold,
    color: Color.colorBlack,
  },
  profileBottomContainer: {
    width: "100%",
    display: "flex",
    flexDirection: "row",
    justifyContent:"space-between",
    marginTop: 10,
  },
  profileBottomChip: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderColor: "#ccc",
    borderWidth: 1,
    paddingHorizontal: Padding.p_xs,
    paddingVertical: 6,
    borderRadius: Border.br_base
  },
  collabrationText: {
    fontFamily: FontFamily.plusJakartaSansBold,
    fontSize: FontSize.size_xs
  },
  collaborationCount: {
    fontFamily: FontFamily.plusJakartaSansBold,
    fontSize:FontSize.size_xs
  },
  divider: {
    width: "100%",
    borderWidth: 0.5,
    borderColor: "#ccc",
    marginTop: 30
  }
});

export default InfluencerCard;
