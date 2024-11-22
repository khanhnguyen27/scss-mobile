import {
  View,
  Text,
  Image,
  ScrollView,
  Animated,
  TextInput,
  Dimensions,
  TouchableOpacity,
  Linking,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import React, { useContext, useEffect, useRef, useState } from "react";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { AuthContext } from "../../context/AuthContext";
import { NotificationContext } from "../../context/NotificationContext";
import { HomeSkeleton } from "../../layout/Skeleton";
import axiosJWT, { BASE_URL } from "../../../config/Config";
import { LinearGradient } from "expo-linear-gradient";

export default function Home() {
  const navigation = useNavigation();
  const { width, height } = Dimensions.get("screen");
  const [loading, setLoading] = useState(true);
  const { fetchProfile, profile } = useContext(AuthContext);
  const { notifications } = useContext(NotificationContext);
  const [requests, setRequests] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const scrollViewRef = useRef(null);
  useFocusEffect(
    React.useCallback(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: false });
      }
      setTimeout(() => {
        setLoading(false);
      }, 1500);
      fetchProfile();
      fetchRequest();
      const fromDate = new Date().toISOString().split("T")[0];
      const toDate = new Date(new Date().setDate(new Date().getDate() + 6))
        .toISOString()
        .split("T")[0];
      fetchAppointment(fromDate, toDate);
      fetchQuestion();
    }, [])
  );

  const ringing = useRef(new Animated.Value(0)).current;
  const blinking = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(5000),
        Animated.timing(ringing, {
          toValue: -1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(ringing, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(ringing, {
          toValue: -1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(ringing, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(ringing, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const rotation = ringing.interpolate({
    inputRange: [-1, 1],
    outputRange: ["-30deg", "30deg"],
  });

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(blinking, {
          toValue: 0.5,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(blinking, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    fetchProfile();
    fetchRequest();
    const fromDate = new Date().toISOString().split("T")[0];
    const toDate = new Date(new Date().setDate(new Date().getDate() + 6))
      .toISOString()
      .split("T")[0];
    fetchAppointment(fromDate, toDate);
    fetchQuestion();
  }, []);

  const fetchRequest = async () => {
    try {
      const requestsRes = await axiosJWT.get(
        `${BASE_URL}/booking-counseling/appointment-request`
      );
      const requestsData = requestsRes?.data?.content || [];
      setRequests(requestsData);
    } catch (err) {
      console.log("Can't fetch request", err);
    }
  };

  const fetchAppointment = async (fromDate, toDate) => {
    try {
      const appointmentRes = await axiosJWT.get(
        `${BASE_URL}/booking-counseling/appointment?fromDate=${fromDate}&toDate=${toDate}`
      );
      const data = appointmentRes.data;
      if (data.status === 200) {
        const formattedAppointments = data?.content?.map((appointment) => ({
          id: appointment.id,
          date: appointment.startDateTime.split("T")[0],
          startTime: appointment.startDateTime.split("T")[1].slice(0, 5),
          endTime: appointment.endDateTime.split("T")[1].slice(0, 5),
          meetingType: appointment.meetingType,
          place:
            appointment?.meetingType === "ONLINE"
              ? `${appointment?.meetUrl}`
              : `${appointment?.address}`,
          counselorName: appointment?.counselorInfo?.profile?.fullName,
          counselorImage: appointment?.counselorInfo?.profile?.avatarLink,
          counselorSpec:
            appointment?.counselorInfo?.specialization?.name ||
            appointment?.counselorInfo?.expertise?.name,
          status: appointment.status,
        }));
        setAppointments(formattedAppointments);
      }
    } catch (err) {
      console.log("Can't fetch upcoming appointments", err);
    }
  };

  const fetchQuestion = async () => {
    let allQuestions = [];
    let currentPage = 1;
    let totalPages = 1;
    try {
      while (currentPage <= totalPages) {
        const questionsRes = await axiosJWT.get(
          `${BASE_URL}/question-cards/student/filter`,
          {
            params: {
              page: currentPage,
            },
          }
        );
        const questionsData = questionsRes?.data?.content || [];
        const filteredQuestions = questionsData?.data?.filter(
          (question) => question.answer !== null
        );

        allQuestions = [...allQuestions, ...filteredQuestions];

        currentPage = currentPage + 1 || 1;
        totalPages = questionsRes?.data?.content?.totalPages || 1;
      }
      setQuestions(allQuestions);
    } catch (err) {
      console.log("Can't fetch answered question", err);
    }
  };

  return (
    <>
      <View style={{ backgroundColor: "#f5f7fd", flex: 1 }}>
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            paddingHorizontal: 30,
            paddingTop: height * 0.04,
            paddingBottom: height * 0.02,
            backgroundColor: "#F39300",
            borderBottomStartRadius: 40,
            borderBottomEndRadius: 40,
          }}
        >
          <View style={{ marginTop: 8, maxWidth: "70%" }}>
            {profile && (
              <Text
                style={{ fontSize: 18, fontWeight: "semibold", color: "white" }}
              >
                Hello, {profile.fullName}
              </Text>
            )}
            <Text style={{ fontSize: 24, fontWeight: "bold", color: "white" }}>
              Ready to discover
            </Text>
          </View>
          <View
            style={{ display: "flex", flexDirection: "row", marginTop: 12 }}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate("Notification")}
              style={{ position: "relative", marginRight: 16, marginTop: 2 }}
            >
              <Animated.View style={{ transform: [{ rotate: rotation }] }}>
                <Ionicons
                  name="notifications-outline"
                  size={40}
                  style={{ color: "white" }}
                />
              </Animated.View>
              {notifications.some(
                (notification) => notification.readStatus === false
              ) && (
                <Animated.View
                  style={{
                    opacity: blinking,
                    position: "absolute",
                    top: -6,
                    right: -3,
                    zIndex: 1,
                  }}
                >
                  <View
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: "white",
                    }}
                  />
                </Animated.View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                navigation.navigate("Profile", { prevScreen: "Home" })
              }
            >
              {/* <Ionicons name="menu" size={40} color="white" /> */}
              {profile ? (
                <Image
                  source={{ uri: profile.avatarLink }}
                  style={{
                    backgroundColor: "white",
                    width: width * 0.1,
                    height: width * 0.1,
                    borderRadius: 40,
                    borderColor: "#e3e3e3",
                    borderWidth: 2,
                  }}
                />
              ) : (
                <LinearGradient
                  colors={["#e0e0e0", "#f5f5f5", "#e0e0e0"]}
                  style={{
                    width: width * 0.1,
                    height: width * 0.1,
                    borderRadius: 40,
                  }}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
        <View
          style={{
            flexDirection: "row",
            borderRadius: 30,
            marginHorizontal: 25,
            paddingHorizontal: 15,
            marginVertical: 16,
            alignItems: "center",
            backgroundColor: "#ededed",
            alignContent: "center",
            height: 50,
          }}
        >
          <Ionicons
            name="search"
            size={24}
            style={{ marginRight: 10, color: "#F39300", opacity: 0.7 }}
          />
          <TextInput
            placeholder="What are you searching for?"
            placeholderTextColor="#F39300"
            style={{
              fontSize: 18,
              opacity: 0.8,
            }}
          />
        </View>
        {loading ? (
          <HomeSkeleton />
        ) : (
          <ScrollView
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            style={{ marginHorizontal: 30 }}
          >
            {/* <TouchableOpacity
              activeOpacity={0.5}
              onPress={() => navigation.navigate("Counselor")}
              style={{
                backgroundColor: "white",
                borderRadius: 10,
                borderWidth: 2,
                borderColor: "#F39300",
                width: "auto",
                borderStyle: "dashed",
                alignItems: "center",
                justifyContent: "center",
                marginVertical: 16,
                paddingHorizontal: 8,
                paddingVertical: 16,
              }}
            >
              <Ionicons name="add-circle" size={60} color="#F39300" />
              <Text
                style={{
                  marginTop: 8,
                  fontSize: 18,
                  fontWeight: "600",
                  opacity: 0.7,
                }}
              >
                Create your first appointment request
              </Text>
            </TouchableOpacity> */}
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <TouchableOpacity
                activeOpacity={0.5}
                onPress={() =>
                  navigation.navigate("Counselor", { screen: "Quick Booking" })
                }
                style={{
                  backgroundColor: "white",
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: "#F39300",
                  width: "49%",
                  borderStyle: "dashed",
                  alignItems: "center",
                  justifyContent: "center",
                  marginVertical: 16,
                  paddingHorizontal: 8,
                  paddingVertical: 16,
                }}
              >
                <Ionicons name="add-circle" size={48} color="#F39300" />
                <Text
                  style={{
                    marginTop: 8,
                    fontSize: 18,
                    fontWeight: "600",
                    opacity: 0.7,
                  }}
                >
                  Quick Booking
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.5}
                onPress={() =>
                  navigation.navigate("Counselor", { screen: "Academic" })
                }
                style={{
                  backgroundColor: "white",
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: "#F39300",
                  width: "49%",
                  borderStyle: "dashed",
                  alignItems: "center",
                  justifyContent: "center",
                  marginVertical: 16,
                  paddingHorizontal: 8,
                  paddingVertical: 16,
                }}
              >
                <Ionicons name="people" size={48} color="#F39300" />
                <Text
                  style={{
                    marginTop: 8,
                    fontSize: 18,
                    fontWeight: "600",
                    opacity: 0.7,
                  }}
                >
                  Find Counselors
                </Text>
              </TouchableOpacity>
            </View>
            <View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: "bold" }}>
                  Pending Requests
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("Request", { prevScreen: "Home" })
                  }
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: "#F39300",
                      opacity: 0.8,
                    }}
                  >
                    View all
                  </Text>
                </TouchableOpacity>
              </View>

              {requests?.data?.length === 0 ? (
                <View
                  style={{
                    width: width,
                    height: 80,
                    backgroundColor: "#ededed",
                    padding: 12,
                    marginVertical: 12,
                    justifyContent: "center",
                    alignSelf: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      fontStyle: "italic",
                      fontWeight: "600",
                      textAlign: "center",
                      color: "gray",
                      opacity: 0.7,
                    }}
                  >
                    No request created
                  </Text>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {requests?.data?.map((request, index) => (
                    <View
                      key={request.id}
                      style={{
                        width: width * 0.65,
                        height: "auto",
                        backgroundColor: "white",
                        borderRadius: 20,
                        padding: 12,
                        marginVertical: 12,
                        marginRight: 12,
                        borderWidth: 1.5,
                        borderColor: "#F39300",
                        overflow: "hidden",
                        position: "relative",
                        flexDirection: "column",
                      }}
                    >
                      <View style={{ flexDirection: "row", marginBottom: 16 }}>
                        <Image
                          source={{
                            uri: request.counselor.profile.avatarLink,
                          }}
                          style={{
                            width: 60,
                            height: 60,
                            borderRadius: 40,
                            borderColor: "#F39300",
                            borderWidth: 2,
                          }}
                        />
                        <View style={{ marginLeft: 12 }}>
                          <Text style={{ fontWeight: "bold", fontSize: 18 }}>
                            {request.counselor.profile.fullName.length > 12
                              ? request.counselor.profile.fullName.substring(
                                  0,
                                  12
                                ) + "..."
                              : request.counselor.profile.fullName}
                          </Text>
                          <View
                            style={{
                              flexDirection: "row",
                              alignSelf: "flex-start",
                              alignItems: "center",
                              justifyContent: "center",
                              backgroundColor: "#F39300",
                              borderRadius: 20,
                              paddingVertical: 4,
                              paddingHorizontal: 12,
                              marginTop: 4,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 16,
                                fontWeight: "bold",
                                color: "white",
                              }}
                            >
                              {request.meetingType.charAt(0).toUpperCase() +
                                request.meetingType.slice(1)}
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: 8,
                          }}
                        >
                          <Ionicons name="calendar" size={20} color="#F39300" />
                          <Text
                            style={{
                              fontSize: 16,
                              fontWeight: "600",
                              marginLeft: 8,
                            }}
                          >
                            {request.requireDate}
                          </Text>
                        </View>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: 8,
                          }}
                        >
                          <Ionicons name="time" size={20} color="#F39300" />
                          <Text
                            style={{
                              fontSize: 16,
                              fontWeight: "600",
                              marginLeft: 8,
                            }}
                          >
                            {request?.startTime?.slice(0, 5)} -{" "}
                            {request?.endTime?.slice(0, 5)}
                          </Text>
                        </View>
                        <View
                          style={{
                            flexDirection: "row",
                            flexWrap: "wrap",
                            justifyContent: "space-between",
                            marginBottom: 8,
                          }}
                        >
                          <View>
                            <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                              Status:{" "}
                              <Text
                                style={[
                                  request.status === "APPROVED" && {
                                    color: "green",
                                  },
                                  request.status === "WAITING" && {
                                    color: "#F39300",
                                  },
                                  request.status === "DENIED" && {
                                    color: "red",
                                  },
                                ]}
                              >
                                {request.status}
                              </Text>
                            </Text>
                          </View>
                        </View>
                      </View>
                      <View
                        style={{
                          position: "absolute",
                          top: 0,
                          right: 0,
                          backgroundColor: "#F39300",
                          paddingVertical: 4,
                          paddingLeft: 8,
                          paddingRight: 4,
                          borderBottomLeftRadius: 16,
                        }}
                      >
                        <Text style={{ fontSize: 16, color: "white" }}>
                          New
                        </Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
            <View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: "bold" }}>
                  Upcoming Appointments
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("Appointment", { prevScreen: "Home" })
                  }
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: "#F39300",
                      opacity: 0.8,
                    }}
                  >
                    View all
                  </Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {Array(7)
                  .fill(0)
                  .map((_, index) => {
                    const date = new Date();
                    date.setDate(date.getDate() + index);
                    const dateString = date.toISOString().split("T")[0];
                    const appointmentCount = appointments.filter(
                      (appointment) =>
                        appointment.date === dateString &&
                        appointment.status === "WAITING"
                    ).length;
                    return (
                      <TouchableOpacity
                        key={index}
                        onPress={() => setSelectedDate(dateString)}
                        style={{
                          flexDirection: "row",
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          marginVertical: 8,
                          marginRight: 8,
                          backgroundColor:
                            selectedDate === dateString ? "#F39300" : "white",
                          borderRadius: 10,
                          borderColor: "#F39300",
                          borderWidth: 1.5,
                        }}
                      >
                        <Text
                          style={{
                            fontWeight: "bold",
                            fontSize: 16,
                            color:
                              selectedDate === dateString ? "white" : "#F39300",
                          }}
                        >
                          {date.toISOString().split("T")[0] ===
                          new Date().toISOString().split("T")[0]
                            ? "Today"
                            : date.toLocaleDateString("en-US", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                              })}
                        </Text>
                        <Text
                          style={{
                            fontWeight: "bold",
                            fontSize: 16,
                            color:
                              selectedDate === dateString ? "white" : "#F39300",
                            marginLeft: 4,
                          }}
                        >
                          ({appointmentCount})
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
              </ScrollView>
              {appointments?.filter(
                (appointment) =>
                  appointment.date === selectedDate &&
                  appointment.status === "WAITING"
              ).length === 0 ? (
                <View
                  style={{
                    width: width,
                    height: 80,
                    backgroundColor: "#ededed",
                    padding: 12,
                    marginVertical: 12,
                    justifyContent: "center",
                    alignSelf: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      fontStyle: "italic",
                      fontWeight: "600",
                      textAlign: "center",
                      color: "gray",
                      opacity: 0.7,
                    }}
                  >
                    No appointment on this day
                  </Text>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {appointments
                    ?.filter(
                      (appointment) =>
                        appointment.date === selectedDate &&
                        appointment.status === "WAITING"
                    )
                    .map((appointment) => (
                      <View
                        key={appointment.id}
                        style={{
                          width: width * 0.85,
                          backgroundColor: "#F39300",
                          borderRadius: 20,
                          marginVertical: 12,
                          marginRight: 12,
                        }}
                      >
                        <View
                          style={{
                            backgroundColor: "#fff0e0",
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            marginTop: 4,
                            marginHorizontal: 4,
                            borderTopLeftRadius: 18,
                            borderTopRightRadius: 18,
                          }}
                        >
                          <View style={{ maxWidth: "80%" }}>
                            <Text
                              style={{
                                fontSize: 18,
                                fontWeight: "bold",
                                color: "#F39300",
                              }}
                            >
                              {appointment.counselorName}
                            </Text>
                            <Text
                              style={{
                                fontSize: 16,
                                fontWeight: "400",
                                color: "#333",
                                marginTop: 2,
                              }}
                            >
                              {appointment.counselorSpec}
                            </Text>
                          </View>
                          <Image
                            source={{ uri: appointment.counselorImage }}
                            style={{
                              backgroundColor: "white",
                              width: 50,
                              height: 50,
                              borderRadius: 40,
                              borderColor: "#F39300",
                              borderWidth: 2,
                            }}
                          />
                        </View>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "stretch",
                            justifyContent: "space-between",
                            marginTop: 2,
                            marginHorizontal: 4,
                            marginBottom: 4,
                          }}
                        >
                          <View
                            style={{
                              flex: 0.62,
                              flexDirection: "row",
                              alignItems: "center",
                              paddingHorizontal: 12,
                              paddingVertical: 6,
                              backgroundColor: "white",
                              borderBottomLeftRadius: 18,
                            }}
                          >
                            {appointment.meetingType === "ONLINE" ? (
                              <Ionicons
                                name="videocam-outline"
                                size={24}
                                color="#F39300"
                              />
                            ) : (
                              <MaterialIcons
                                name="place"
                                size={24}
                                color="#F39300"
                              />
                            )}
                            <View style={{ marginLeft: 8, flex: 1 }}>
                              <Text
                                style={{
                                  fontSize: 16,
                                  color: "#333",
                                  fontWeight: "600",
                                }}
                              >
                                {appointment.meetingType === "ONLINE"
                                  ? "Online"
                                  : "Offline"}
                              </Text>
                              <TouchableOpacity
                                disabled={appointment.meetingType !== "ONLINE"}
                                onPress={() =>
                                  Linking.openURL(
                                    `https://meet.google.com/${appointment.place}`
                                  ).catch((err) => {
                                    console.log("Can't open this link", err);
                                    Toast.show({
                                      type: "error",
                                      text1: "Error",
                                      text2: "Can't open this link",
                                    });
                                  })
                                }
                              >
                                <Text
                                  style={{
                                    fontSize: 14,
                                    color:
                                      appointment.meetingType === "ONLINE"
                                        ? "#F39300"
                                        : "#333",
                                    textDecorationLine:
                                      appointment.meetingType === "ONLINE"
                                        ? "underline"
                                        : "none",
                                  }}
                                  numberOfLines={1}
                                >
                                  {appointment.place}
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                          <View
                            style={{
                              flex: 0.37,
                              flexDirection: "row",
                              alignItems: "center",
                              paddingHorizontal: 12,
                              paddingVertical: 6,
                              backgroundColor: "white",
                              borderBottomRightRadius: 18,
                            }}
                          >
                            <Ionicons
                              name="time-outline"
                              size={24}
                              color="#F39300"
                            />
                            <View style={{ marginLeft: 8 }}>
                              <Text
                                style={{
                                  fontSize: 16,
                                  color: "#333",
                                  fontWeight: "600",
                                }}
                              >
                                {appointment.startTime}
                              </Text>
                              <Text style={{ fontSize: 14, color: "#333" }}>
                                {appointment.date}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    ))}
                </ScrollView>
              )}
            </View>
            <View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: "bold" }}>
                  Answered Questions
                </Text>
                <TouchableOpacity onPress={() => navigation.navigate("QA")}>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: "#F39300",
                      opacity: 0.8,
                    }}
                  >
                    View all
                  </Text>
                </TouchableOpacity>
              </View>
              {questions?.length === 0 ? (
                <View
                  style={{
                    width: width,
                    height: 80,
                    backgroundColor: "#ededed",
                    padding: 12,
                    marginVertical: 12,
                    justifyContent: "center",
                    alignSelf: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      fontStyle: "italic",
                      fontWeight: "600",
                      textAlign: "center",
                      color: "gray",
                      opacity: 0.7,
                    }}
                  >
                    No question was answered
                  </Text>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {questions?.map((question) => (
                    <View
                      key={question.id}
                      style={{
                        width: width * 0.85,
                        backgroundColor: "white",
                        borderRadius: 20,
                        marginVertical: 12,
                        marginRight: 12,
                        borderColor: "lightgrey",
                        borderWidth: 1,
                      }}
                    >
                      <View
                        style={{
                          backgroundColor: "#fff0e0",
                          paddingHorizontal: 16,
                          paddingVertical: 16,
                          borderRadius: 20,
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 4,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 16,
                              color: "gray",
                              fontWeight: "500",
                            }}
                          >
                            Your question
                          </Text>
                          <View
                            style={{
                              backgroundColor: "#F39300",
                              alignSelf: "flex-start",
                              alignItems: "center",
                              justifyContent: "center",
                              flexDirection: "row",
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                              borderRadius: 20,
                              borderWidth: 1.5,
                              borderColor: "transparent",
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 14,
                                fontWeight: "600",
                                color: "white",
                              }}
                            >
                              {question.questionType}
                            </Text>
                          </View>
                        </View>
                        <Text
                          style={{
                            fontSize: 18,
                            fontWeight: "600",
                            color: "#333",
                          }}
                        >
                          {question.content}
                        </Text>
                      </View>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          paddingHorizontal: 20,
                          paddingVertical: 8,
                          borderBottomRightRadius: 20,
                          borderBottomLeftRadius: 20,
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 16,
                              color: "gray",
                              fontWeight: "500",
                            }}
                          >
                            Answered by{" "}
                          </Text>
                          <Image
                            source={{
                              uri: question.counselor.profile.avatarLink,
                            }}
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 20,
                              borderColor: "#F39300",
                              borderWidth: 2,
                              marginHorizontal: 4,
                            }}
                          />
                          <Text
                            style={{
                              fontSize: 16,
                              fontWeight: "bold",
                              color: "#333",
                            }}
                          >
                            {question.counselor.profile.fullName}
                          </Text>
                        </View>
                      </View>
                      <View
                        style={{
                          alignSelf: "flex-start",
                          backgroundColor: "#ededed",
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          marginHorizontal: 20,
                          marginBottom: 16,
                          borderRadius: 10,
                          borderWidth: 0.5,
                          borderColor: "lightgrey",
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 16,
                            color: "#333",
                          }}
                          numberOfLines={2}
                        >
                          {question.answer}
                        </Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
            {/* <View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 20, fontWeight: "bold" }}>
                Recommend Events for you
              </Text>
              <TouchableOpacity>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "600",
                    opacity: 0.6,
                    marginRight: 4,
                  }}
                >
                  View all
                </Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {workshops.map((course, index) => (
                <TouchableOpacity
                  key={index}
                  style={{
                    width: width * 0.75,
                    // height: height * 0.3,
                    height: "auto",
                    backgroundColor: "white",
                    borderRadius: 20,
                    marginVertical: 15,
                    marginRight: 12,
                    overflow: "hidden",
                    position: "relative",
                    flexDirection: "column",
                  }}
                >
                  <Image
                    source={{ uri: course.imageUri }}
                    style={{
                      resizeMode: "cover",
                      width: width * 0.75,
                      height: height * 0.15,
                    }}
                  />
                  <View style={{ padding: 8 }}>
                    <Text
                      style={{
                        color: "#333",
                        fontSize: 22,
                        fontWeight: "bold",
                      }}
                    >
                      {course.title}
                    </Text>
                    <Text
                      style={{
                        color: "gray",
                        fontSize: 18,
                        fontWeight: "600",
                        opacity: 0.7,
                        marginTop: 4,
                      }}
                    >
                      {course.coursesCount}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <View>
            <View>
              <Text style={{ fontSize: 20, fontWeight: "bold" }}>
                Recommend Counselors
              </Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {counselors.map((counselor) => (
                <TouchableOpacity
                  key={counselor.id}
                  style={{
                    width: Dimensions.get("screen").width * 0.5,
                    height: "auto",
                    backgroundColor: "white",
                    borderRadius: 20,
                    marginVertical: 15,
                    marginRight: 12,
                    overflow: "hidden",
                    borderWidth: 2,
                    borderColor: "#e3e3e3",
                  }}
                  // onPress={() => alert(`${counselor.name} clicked`)}
                  onPress={() =>
                    navigation.navigate("CounselorProfile", { counselor })
                  } // Pass the counselor object
                >
                  <Image
                    source={counselor.image}
                    style={{
                      width: "100%",
                      height: 120,
                      resizeMode: "contain",
                    }}
                  />
                  <View
                    style={{
                      position: "absolute",
                      top: 12,
                      right: -12,
                      backgroundColor: "#F39300",
                      paddingRight: 14,
                      paddingLeft: 4,
                      paddingVertical: 4,
                      borderRadius: 10,
                    }}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontSize: 14,
                        fontWeight: "bold",
                      }}
                    >
                      {counselor.experience} Years
                    </Text>
                  </View>
                  <View
                    style={{
                      paddingHorizontal: 15,
                      paddingVertical: 10,
                    }}
                  >
                    <Text
                      style={{
                        color: "#333",
                        fontSize: 22,
                        fontWeight: "bold",
                        marginBottom: 4,
                      }}
                    >
                      {counselor.name}
                    </Text>
                    <Text
                      style={{
                        color: "gray",
                        fontSize: 16,
                        fontWeight: "600",
                      }}
                    >
                      {counselor.skills}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={{
                  width: 80,
                  height: 200,
                  backgroundColor: "white",
                  borderRadius: 20,
                  marginVertical: 15,
                  marginRight: 12,
                  overflow: "hidden",
                  position: "relative",
                  alignItems: "center",
                  alignSelf: "center",
                  justifyContent: "center",
                  borderWidth: 2,
                  borderColor: "#e3e3e3",
                }}
                onPress={() => navigation.navigate("PT")}
              >
                <Ionicons
                  name="arrow-forward-circle"
                  size={34}
                  style={{ color: "#F39300" }}
                />
                <Text
                  style={{ fontSize: 12, fontWeight: "600", marginTop: 10 }}
                >
                  View more
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View> */}
          </ScrollView>
        )}
      </View>
    </>
  );
}
