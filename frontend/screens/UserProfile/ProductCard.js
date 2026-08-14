import React, { useMemo, useState } from "react";
import { Image } from "expo-image";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  FontSize,
  Color,
  Border,
  FontFamily,
  Padding,
} from "../../GlobalStyles";
import ImageWithFallback from "../../util/ImageWithFallback";
import { useTheme } from "../../util/ThemeContext";
import { StatusMenu } from "../../shared/CollabStatus";

const getStyleValue = (key, value) => {
  if (value === undefined) return;
  return { [key]: value === "unset" ? undefined : value };
};

const ProductCard = ({
  imageSource,
  postTitle,
  postDate,
  productName,
  isSelectedImage,
  cardWidth,
  id,
  postTitleWidth,
  postDateWidth,
  productNameWidth,
  buttonWidth,
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
  const[viewWidth,setViewWidth]=useState(0)
  return (
    <View style={[styles.card, cardStyle, { backgroundColor: theme.card, borderColor: theme.cardBorder }]} onLayout={(evt)=>{
      setViewWidth(evt.nativeEvent.layout.width)
    }}>
      <View style={styles.cardContent}>
        <ImageWithFallback image={imageSource} imageStyle={styles.image} isSelectedImage={isSelectedImage} />
        <View style={styles.cardText}>
          <View style={styles.textContainer}>
            <Text style={[styles.postTitle, { color: theme.text }]} numberOfLines={1}>{postTitle}</Text>
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.postDate, { color: theme.subText }]} numberOfLines={1}>Date: {postDate}</Text>
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.productName, { color: theme.subText }]} numberOfLines={1}>Product: {productName}</Text>
          </View>
        </View>
      </View>
      <View style={styles.rightCol}>
        {(status || "pending") === "pending" && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate("FriendRequestPage",{name: postTitle,requestId: id})}
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
    width: "100%",
    minHeight: 96,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: "space-between",
    borderRadius: Border.br_xs,
    borderWidth: 1,
    marginBottom: 10,
  },
  cardContent: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
  },
  cardText: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
  },
  image: {
    borderRadius: Border.br_5xs,
    width: 72,
    height: 72,
    overflow: "hidden",
  },
  textContainer: {
    marginLeft: 0,
  },
  postTitle: {
    fontSize: FontSize.size_base,
    lineHeight: 24,
    color: Color.colorWhite,
    fontFamily: FontFamily.beVietnamProMedium,
    fontWeight: "500",
  },
  postDate: {
    fontSize: FontSize.size_sm,
    lineHeight: 21,
    color: Color.colorLightgray,
    fontFamily: FontFamily.beVietnamProRegular,
  },
  productName: {
    fontSize: FontSize.size_sm,
    lineHeight: 21,
    color: Color.colorLightgray,
    fontFamily: FontFamily.beVietnamProRegular,
  },
  rightCol: {
    width: 132,
    alignItems: "stretch",
    justifyContent: "center",
    gap: 8,
    flexShrink: 0,
  },
  actionBtn: {
    height: 34,
    width: "100%",
  },
  buttonContainer: {
    height: 32,
    width: "auto",
  },
  button: {
    backgroundColor: Color.colorDarkslategray_200,
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

export default ProductCard;
