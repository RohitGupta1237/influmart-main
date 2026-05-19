import * as React from "react";
import { StyleSheet, View, Text, TouchableOpacity, TextInput } from "react-native";
import { Image } from "expo-image";
import { useNavigation } from "@react-navigation/native";
import { FontSize, FontFamily, Color, Padding, Border } from "../GlobalStyles";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "../util/ThemeContext";

const Depth1Frame11 = ({ onChange, style }) => {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const [isSearchBarOpen, setIsSearchBarOpen] = React.useState(false);

  const handleSearch = () => {
    setIsSearchBarOpen(!isSearchBarOpen);
  };
  const handleBack = async () => {
    const brand = await AsyncStorage.getItem("brandId");
    const influencer = await AsyncStorage.getItem("influencerId");
    if (brand) {
      navigation.navigate('BrandProfile');
    } else if (influencer) {
      navigation.navigate('UserProfile');
    } else {
      navigation.navigate('Homepage');
    }
  };

  return (
    <View style={[styles.depth1Frame0, { backgroundColor: theme.headerBg, borderBottomColor: theme.headerBorder }, style]}>
      <View style={styles.depth2Frame0}>
        <TouchableOpacity onPress={() => handleBack()}>
          <View style={styles.BackArrow}>
            <Image
              style={styles.depth4Frame0}
              contentFit="cover"
              tintColor={theme.iconTint}
              source={require("../assets/depth-4-frame-010.png")}
            />
          </View>
        </TouchableOpacity>
        {isSearchBarOpen ? (
          <TextInput
            onChangeText={(text) => { onChange(text); }}
            style={[styles.SearchBar, {
              color: theme.searchText,
              backgroundColor: theme.searchBg,
              borderColor: theme.searchBorder,
            }]}
            placeholder="Search anything"
            placeholderTextColor={theme.placeholder}
            autoFocus
          />
        ) : (
          <TouchableOpacity>
            <View style={styles.depth3Frame1}>
              <View style={styles.depth4Frame0}>
                <View style={styles.depth5Frame0}>
                  <Text style={[styles.marketplace, { color: theme.text }]}>Marketplace</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={handleSearch} style={[styles.depth3Frame2, styles.depth3FrameLayout]}>
          <View style={[styles.depth4Frame01, styles.depth3FrameLayout]}>
            <Image
              style={styles.depth5Frame01}
              contentFit="cover"
              tintColor={theme.iconTint}
              source={require("../assets/depth-5-frame-0.png")}
            />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  depth3FrameLayout: {
    width: "auto",
    height: "auto",
  },
  marketplace: {
    fontSize: FontSize.size_lg,
    letterSpacing: 0,
    lineHeight: 23,
    fontWeight: "700",
    fontFamily: FontFamily.beVietnamProBold,
    textAlign: "left",
  },
  depth5Frame0: {
    alignSelf: "stretch",
  },
  depth4Frame0: {
    width: "auto",
    overflow: "hidden",
    height: 23,
  },
  depth3Frame1: {
    width: "auto",
    justifyContent: "center",
    height: "auto",
    alignItems: "center",
    flexDirection: "row",
  },
  depth5Frame01: {
    width: 24,
    height: 24,
  },
  depth4Frame01: {
    justifyContent: "flex-end",
    alignItems: "center",
    flexDirection: "row",
  },
  depth3Frame2: {
    flexDirection: "row",
  },
  depth2Frame0: {
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    height: 50,
    paddingHorizontal: Padding.p_base,
  },
  depth1Frame0: {
    width: "100%",
    paddingHorizontal: Padding.p_base,
    paddingTop: Padding.p_base,
    paddingBottom: Padding.p_5xs,
    height: "auto",
    borderBottomWidth: 1,
  },
  BackArrow: {
    width: 24,
    height: 24,
    marginLeft: -16,
  },
  SearchBar: {
    width: "80%",
    paddingVertical: Padding.p_smi,
    paddingHorizontal: Padding.p_base,
    fontSize: FontSize.size_base,
    outlineStyle: "none",
    borderRadius: Border.br_xs,
    borderWidth: 1,
  },
});

export default Depth1Frame11;
