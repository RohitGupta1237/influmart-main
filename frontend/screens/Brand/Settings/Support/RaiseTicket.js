import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import axios from "axios";
import {
  Border,
  Color,
  FontFamily,
  FontSize,
  Padding,
} from "../../../../GlobalStyles";
import { Image } from "expo-image";
import { useAlert } from "../../../../util/AlertContext";

const RaiseTicket = ({ route, navigation }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("");
  const [category, setCategory] = useState("");
  const { showAlert } = useAlert();
  const handleSubmit = async () => {
    if (!name || !email || !subject || !description || !priority || !category) {
      showAlert("Error", "Please fill in all fields");
      return;
    }

    try {
      // Send the data to your backend API
      const response = await axios.post("http://localhost:3000/otp/tickets", {
        name,
        email,
        subject,
        description,
        priority,
        category,
      });

      // Assuming the backend returns the ticket ID
      const { ticketId } = response.data;

      // Send confirmation email
      await axios.post("http://localhost:3000/otp/send-confirmation-email", {
        email,
        ticketId,
      });

      showAlert(
        "Success",
        `Thank you for raising a ticket. Your Ticket ID is ${ticketId}. We will get back to you soon.`
      );
      setName("");
      setCategory("");
      setDescription("");
      setPriority("");
      setSubject("");
      setEmail("");
    } catch (error) {
      console.error(error);
      showAlert(
        "Error",
        "There was a problem raising your ticket. Please try again later."
      );
    }
  };

  return (
    <ScrollView style={styles.helpcenter}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <View style={styles.headerContent}>
            <Image
              style={styles.headerImage}
              contentFit="cover"
              source={require("../../../../assets/depth-4-frame-07.png")}
            />
            <Text style={styles.headerText}>Raise Ticket</Text>
          </View>
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
        <Text style={styles.label}>Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />

        <Text style={styles.label}>Subject</Text>
        <TextInput
          style={styles.input}
          value={subject}
          onChangeText={setSubject}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        <Text style={styles.label}>Priority</Text>
        <TextInput
          style={styles.input}
          value={priority}
          onChangeText={setPriority}
        />

        <Text style={styles.label}>Category</Text>
        <TextInput
          style={styles.input}
          value={category}
          onChangeText={setCategory}
        />

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Raise Ticket</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Padding.p_base,
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
  label: { fontWeight: "bold", marginBottom: 5 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
  button: {
    width: "100%",
    height: 40,
    borderRadius: Border.br_xs,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Color.colorDodgerblue,
    marginVertical: Padding.p_xs,
  },
  buttonText: {
    fontSize: FontSize.size_sm,
    fontFamily: FontFamily.interBold,
    color: Color.colorWhitesmoke_100,
  },
});

export default RaiseTicket;
