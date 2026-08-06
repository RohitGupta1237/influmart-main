import * as React from "react";
import { Text, StyleSheet, View, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { Color, Border, Padding, FontSize, FontFamily } from "../../GlobalStyles";
import { useTheme } from "../../util/ThemeContext";

const DropdownComponent = ({ title, content }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { theme } = useTheme();

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const renderContent = () => {
    if (typeof content === 'string' || typeof content === 'number') {
      return <Text style={[styles.contentText, { color: theme.subText }]}>{content}</Text>;
    } else if (Array.isArray(content.bullet)) {
      return (
        <View>
          {content.bullet.map((item, index) => (
            <Text key={index} style={[styles.contentText, { color: theme.subText }]}>• {item.content}</Text>
          ))}
        </View>
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
      <TouchableOpacity onPress={toggleDropdown} style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={[styles.title, { color: isOpen ? theme.accent : theme.text }]}>{title}</Text>
          <Image
            style={[styles.icon, { tintColor: theme.subText }]}
            contentFit="contain"
            tintColor={theme.subText}
            source={isOpen ? require("../../assets/depth-4-frame-1.png") : require("../../assets/depth-4-frame-11.png")}
          />
        </View>
      </TouchableOpacity>
      {isOpen && <View style={styles.content}>{renderContent()}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 10,
    borderRadius: Border.br_xs,
    borderWidth: 1,
    padding: Padding.p_base,
    margin: "auto",
    paddingHorizontal:Padding.p_base,
  },
  header: {
    width:"100%",
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: "100%",
    height: 21,
  },
  title: {
    fontWeight: "500",
    fontFamily: FontFamily.beVietnamProMedium,
    fontSize: FontSize.size_sm,
    textAlign: "left",
    lineHeight: 21,
  },
  icon: {
    width: 20,
    height: 20,
  },
  content: {
    borderRadius: Border.br_xs,
    fontFamily: FontFamily.beVietnamProRegular,
    fontSize: FontSize.size_sm,
    lineHeight: 21,
    marginTop: Padding.p_base,
  },
  contentText: {
    fontFamily: FontFamily.beVietnamProRegular,
    fontSize: FontSize.size_sm,
    lineHeight: 21,
  },
});

export default DropdownComponent;
