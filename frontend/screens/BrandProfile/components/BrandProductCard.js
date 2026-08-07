import React, { useMemo } from "react";
import { Image } from "expo-image";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Border, Color, FontFamily, FontSize, Padding } from "../../../GlobalStyles";
import ImageWithFallback from "../../../util/ImageWithFallback";
import { useTheme } from "../../../util/ThemeContext";
import { StatusMenu } from "../../../shared/CollabStatus";


const getStyleValue = (key, value) => {
  if (value === undefined) return;
  return { [key]: value === "unset" ? undefined : value };
};

const BrandProductCard = ({
  imageSource,
  postTitle,
  postDate,
  productName,
  campaignTitle,
  cardWidth,
  id,
  postTitleWidth,
  postDateWidth,
  productNameWidth,
  buttonWidth,
  isSelectedImage,
  status,
  onStatusChange,
}) => {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const cardStyle = useMemo(
    () => getStyleValue("width", cardWidth),
    [cardWidth]
  );
  const postTitleStyle = useMemo(
    () => getStyleValue("width", postTitleWidth),
    [postTitleWidth]
  );
  const postDateStyle = useMemo(
    () => getStyleValue("width", postDateWidth),
    [postDateWidth]
  );
  const productNameStyle = useMemo(
    () => getStyleValue("width", productNameWidth),
    [productNameWidth]
  );
  const buttonStyle = useMemo(
    () => getStyleValue("width", buttonWidth),
    [buttonWidth]
  );

  return (
    <View style={[styles.card, cardStyle, { backgroundColor: theme.card, borderColor: theme.cardBorder, borderWidth: 1 }]}>
      <View style={styles.cardContent}>
        <ImageWithFallback image={imageSource} isSelectedImage={isSelectedImage} imageStyle={styles.image} />
        <View style={styles.textWrapper}>
          <Text style={[styles.postTitle, { color: theme.text }]} numberOfLines={1}>{postTitle}</Text>
          <Text style={[styles.postDate, { color: theme.subText }]} numberOfLines={1}>Date: {postDate}</Text>
          <Text style={[styles.productName, { color: theme.subText }]} numberOfLines={1}>Product: {productName}</Text>
          {campaignTitle && (
            <Text style={[styles.productName, { color: theme.subText }]} numberOfLines={1}>Campaign: {campaignTitle}</Text>
          )}
        </View>
      </View>
      <View style={{ width: 132, alignItems: "stretch", justifyContent: "center", gap: 8, flexShrink: 0 }}>
        {(status || "pending") === "pending" && (
          <TouchableOpacity
            style={{ height: 34, width: "100%" }}
            onPress={() => navigation.navigate("BrandCollabRequestPage",{name: postTitle,requestId: id})}
          >
            <View style={[styles.button, { backgroundColor: theme.accent }]}>
              <Text style={styles.buttonText}>View Request</Text>
            </View>
          </TouchableOpacity>
        )}
        {onStatusChange && (status || "pending") !== "pending" && (
          <StatusMenu current={status} onSelect={(s) => onStatusChange(id, s)} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Color.colorWhitesmoke_300,
    width: 390,
    minHeight: 96,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Padding.p_base,
    paddingVertical: 12,
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: Color.colorWhitesmoke_400,
    borderRadius: Border.br_base,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
    overflow: "hidden",
  },
  textWrapper: {
    flex: 1,
    marginLeft: 12,
    overflow: "hidden",
  },
  image: {
    borderRadius: Border.br_5xs,
    width: 72,
    height: 72,
    overflow: "hidden",
  },
  textContainer: {
    marginLeft: 16,
    flex: 1,
  },
  postTitle: {
    fontSize: FontSize.size_base,
    lineHeight: 24,
    fontFamily: FontFamily.beVietnamProMedium,
    fontWeight: "500",
  },
  postDate: {
    fontSize: FontSize.size_sm,
    lineHeight: 21,
    color: Color.colorSlategray_300,
    fontFamily: FontFamily.beVietnamProRegular,
  },
  productName: {
    fontSize: FontSize.size_sm,
    lineHeight: 21,
    color: Color.colorSlategray_300,
    fontFamily: FontFamily.beVietnamProRegular,
  },
  buttonContainer: {
    height: 32,
    width: 110,
    flexShrink: 0,
  },
  button: {
    backgroundColor: Color.colorRoyalblue,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    height: 34,
    width: "100%",
    paddingHorizontal: Padding.p_base,
  },
  buttonText: {
    color: Color.colorWhite,
    fontFamily: FontFamily.beVietnamProMedium,
    fontWeight: "500",
    fontSize: FontSize.size_sm,
    lineHeight: 21,
  },
});

export default  BrandProductCard;
