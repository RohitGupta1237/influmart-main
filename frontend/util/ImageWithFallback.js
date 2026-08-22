import React, { useEffect, useState } from "react";
import { Image, StyleSheet } from "react-native";

const ImageWithFallback = ({ image, imageStyle, isSelectedImage, fallback }) => {
  const selectedImage = {
    images: {
      avatar1: require("../assets/avatars/avatar1.png"),
      avatar2: require("../assets/avatars/avatar2.png"),
      avatar3: require("../assets/avatars/avatar3.png"),
      avatar4: require("../assets/avatars/avatar4.png"),
      avatar5: require("../assets/avatars/avatar5.png"),
      avatar6: require("../assets/avatars/avatar6.png"),
      avatar7: require("../assets/avatars/avatar7.png"),
      avatar8: require("../assets/avatars/avatar8.png"),
      avatar9: require("../assets/avatars/avatar9.png"),
      avatar10: require("../assets/avatars/avatar10.png"),
      avatar11: require("../assets/avatars/avatar11.png"),
      avatar12: require("../assets/avatars/avatar12.png"),
      avatar13: require("../assets/avatars/avatar13.png"),
      avatar14: require("../assets/avatars/avatar14.png"),
      avatar15: require("../assets/avatars/avatar15.png"),
      avatar16: require("../assets/avatars/avatar16.png"),
      avatar17: require("../assets/avatars/avatar17.png"),
      avatar18: require("../assets/avatars/avatar18.png"),
      avatar19: require("../assets/avatars/avatar19.png"),
      avatar20: require("../assets/avatars/avatar20.png"),
      avatar21: require("../assets/avatars/avatar21.png"),
      avatar22: require("../assets/avatars/avatar22.png"),
      avatar23: require("../assets/avatars/avatar23.png"),
      avatar24: require("../assets/avatars/avatar24.png"),
      avatar25: require("../assets/avatars/avatar25.png"),
      avatar26: require("../assets/avatars/avatar26.png"),
      avatar27: require("../assets/avatars/avatar27.png"),
      avatar28: require("../assets/avatars/avatar28.png"),
    },
  };
  const fallbackImages = [
    require("../assets/influencer1.jpg"),
    require("../assets/influencer2.jpg"),
    require("../assets/influencer3.jpg"),
    require("../assets/influencer4.jpg"),
    require("../assets/influencer5.jpg"),
    require("../assets/influencer6.jpg"),
    require("../assets/influencer7.jpg"),
    require("../assets/influencer8.jpg"),
    require("../assets/influencer9.jpg"),
    require("../assets/influencer10.jpg"),
  ];

  // Deterministic fallback: the SAME input always maps to the SAME image, so
  // it never changes on refresh. (Previously Math.random() picked a new image
  // every render, making selected/placeholder avatars flicker each reload.)
  const hashStr = (s) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  };
  const getFallback = () => {
    if (fallback !== undefined) return fallback;
    const key = typeof image === "string" && image ? image : "default";
    return fallbackImages[hashStr(key) % fallbackImages.length];
  };

  // Resolve the correct source synchronously so we never briefly try to load an
  // avatar key (e.g. "avatar5") as a network URL, which caused a flaky race.
  const resolveSource = () => {
    if (!image || image == null || image == undefined) return getFallback();
    if (!isNaN(image)) return getFallback();
    if (isSelectedImage) return selectedImage.images[image] || getFallback();
    return { uri: image };
  };

  const [imageSource, setImageSource] = useState(resolveSource);
  const [imageLoaded, setImageLoaded] = useState(true);

  useEffect(() => {
    setImageSource(resolveSource());
  }, [image, isSelectedImage]);

  const handleError = () => {
    setImageSource(getFallback());
    setImageLoaded(false);
  };

  return (
    <Image
      source={imageSource}
      onError={handleError}
      style={imageStyle}
      contentFit="cover"
      resizeMode="cover"
    />
  );
};

export default ImageWithFallback;
