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
    <TouchableOpacity onPress={() => { handleClick() }} activeOpacity={0.85}>
      <View style={styles.card}>
        <ImageWithFallback image={depth5Frame0} imageStyle={styles.image} isSelectedImage={isSelectedImage} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.92)']}
          style={styles.gradient}
        >
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText} numberOfLines={1}>{beauty}</Text>
          </View>
          <Text style={styles.nameText} numberOfLines={1}>
            {kylieCosmetics
              ? kylieCosmetics.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
              : ""}
          </Text>
          <Text style={styles.userNameText} numberOfLines={1}>@{userName}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statChip}>
              <Image style={styles.platformIcon} source={require('../../assets/instagram-logo.png')} />
              <Text style={styles.statText}>{formatNumber(statistics.instaData)}</Text>
            </View>
            <View style={styles.statChip}>
              <Image style={styles.platformIcon} source={require('../../assets/tiktok-logo.png')} />
              <Text style={styles.statText}>{formatNumber(statistics.fbData)}</Text>
            </View>
            <View style={styles.statChip}>
              <Image style={styles.platformIcon} source={require('../../assets/youtube-logo.png')} />
              <Text style={styles.statText}>{formatNumber(statistics.ytData)}</Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 260,
    height: 360,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#1a1a2e",
  },
  image: {
    width: 260,
    height: 360,
    position: "absolute",
    top: 0,
    left: 0,
  },
  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 14,
    paddingBottom: 16,
    paddingTop: 60,
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 4,
  },
  categoryBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: FontFamily.plusJakartaSansBold,
    letterSpacing: 0.5,
  },
  nameText: {
    fontSize: 17,
    fontFamily: FontFamily.interBold,
    fontWeight: "700",
    color: "#fff",
  },
  userNameText: {
    fontSize: 12,
    fontFamily: FontFamily.plusJakartaSansBold,
    color: "rgba(255,255,255,0.65)",
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: "row",
    gap: 6,
  },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  platformIcon: {
    width: 14,
    height: 14,
  },
  statText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: FontFamily.plusJakartaSansBold,
  },
});

export default InfluencerCard;
