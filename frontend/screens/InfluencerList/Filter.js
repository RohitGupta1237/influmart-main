import React, { useEffect, useRef, useMemo, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, TouchableOpacity, TextInput } from "react-native";
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import CustomSlider from "../../shared/CustomSlider"
import DropDown from "../../shared/DropDown";
import MultipleSelectList from "../../shared/MultiSelect";
import { useNavigation } from "@react-navigation/core";
import { FilterInfluencerProfile } from '../../controller/InfluencerController'
import { Color, FontFamily, FontSize, Padding, Border } from "../../GlobalStyles";

function Filter({ selectedFilter, setLoading, setSeletedFilter }) {
    const snapPoints = useMemo(() => ['40%', '60%', '80%'], []);
    const handleClosePress = () => {
        bottomSheetRef.current?.close();
        setSeletedFilter?.("");
    };
    const handleOpenPress = () => bottomSheetRef.current?.expand();
    const renderBackdrop = useCallback(
        (props) => <BottomSheetBackdrop appearsOnIndex={0} disappearsOnIndex={-1} {...props} />,
        []
    );
    const bottomSheetRef = useRef(null);
    const navigation = useNavigation()
    const [platform, setPlatform] = React.useState([])
    const [selectedAges, setSelectedAges] = React.useState({})
    const [selectedFollowersCount, setSelectedFollowersCount] = React.useState({})
    const [selectedPostCount, setSelectedPostCount] = React.useState({})
    const [selectedViewsCount, setSelectedViewsCount] = React.useState({})
    const [selectedLocation, setSelectedLocation] = React.useState("")
    const [gender, setGender] = React.useState("")
    const [engagementRate, setEngagementRate] = React.useState({ ig: null, yt: null, fb: null })
    const [engagementEnabled, setEngagementEnabled] = React.useState({ ig: false, yt: false, fb: false })
    const [price, setPrice] = React.useState({ ig: null, yt: null, fb: null })
    const [priceEnabled, setPriceEnabled] = React.useState({ ig: false, yt: false, fb: false })
    const [reachability, setReachability] = React.useState({})
    const [categories, setCategories] = React.useState([])
    const [cities, setCities] = React.useState([])
    const [tags, setTags] = React.useState("")
    const [showElements, setShowElements] = React.useState(false)
    useEffect(() => {
        if (selectedFilter === "Reset") {
            setPlatform([]);
            setPrice({ ig: null, yt: null, fb: null });
            setPriceEnabled({ ig: false, yt: false, fb: false });
            setEngagementRate({ ig: null, yt: null, fb: null });
            setEngagementEnabled({ ig: false, yt: false, fb: false });
        } else if (selectedFilter !== "") {
            handleOpenPress();
        }
    }, [selectedFilter])
    const locationData = [
        {
            key: "india",
            value: "india"
        },
        {
            key: "pakistan",
            value: "Pakistan"
        },
        {
            key: "srilanka",
            value: "Srilanka"
        }
    ]
    const genderData = [
        {
            key: "male",
            value: "Male"
        }, {
            key: "female",
            value: "Female"
        }
    ]
    const categoriedData = [
        { key: "grocery", value: "Grocery" },
        { key: "electronics", value: "Electronics" },
        { key: "fashion", value: "Fashion" },
        { key: "toys", value: "Toys" },
        { key: "beauty", value: "Beauty" },
        { key: "home-decoration", value: "Home Decoration" },
        { key: "fitness", value: "Fitness" },
        { key: "education", value: "Education" },
        { key: "others", value: "Others" },
    ];
    const handleApplyFilters = async () => {
        setLoading(true)
        const filters = {
            location: selectedLocation,
            category: categories,
            price: {
                ig: priceEnabled.ig ? price.ig : null,
                yt: priceEnabled.yt ? price.yt : null,
                fb: priceEnabled.fb ? price.fb : null,
            },
            platform,
            followers: selectedFollowersCount,
            likes: selectedPostCount,
            engagementRate: {
                ig: engagementEnabled.ig ? engagementRate.ig : null,
                yt: engagementEnabled.yt ? engagementRate.yt : null,
                fb: engagementEnabled.fb ? engagementRate.fb : null,
            },
            audienceAge: selectedAges,
            gender,
            tags,
            reachability: reachability,
            viewCount: selectedViewsCount,
            cities
        };
        await FilterInfluencerProfile(filters, navigation);
        setLoading(false)
    }
    return (
        <BottomSheet
            ref={bottomSheetRef}
            index={-1}
            snapPoints={snapPoints}
            enablePanDownToClose={true}
            handleIndicatorStyle={{ backgroundColor: '#ccc' }}
            backgroundStyle={{ backgroundColor: '#fff' }}
            backdropComponent={renderBackdrop}
            onChange={(index) => { if (index === -1) setSeletedFilter?.(""); }}
        >
            <View style={styles.contentContainer}>
                <View style={styles.headlineRow}>
                    <Text style={styles.containerHeadline}>{selectedFilter}</Text>
                    {(selectedFilter === "Platform" || selectedFilter === "Price" || selectedFilter === "Engagement Rate") && (
                        <TouchableOpacity onPress={handleClosePress} style={styles.clearButton}>
                            <Text style={styles.clearButtonText}>✕</Text>
                        </TouchableOpacity>
                    )}
                </View>
                {
                    selectedFilter == "Platform" ?
                        <View style={styles.platformsContainer}>
                            {["instagram", "facebook", "twitter", "youtube", "tiktok"].map((p) => {
                                const isSelected = platform.includes(p);
                                return (
                                    <Pressable
                                        key={p}
                                        onPress={() => setPlatform(prev =>
                                            prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
                                        )}
                                        style={[styles.platformContainer, {
                                            backgroundColor: isSelected ? Color.colorRoyalblue : Color.colorWhite,
                                            borderColor: isSelected ? Color.colorRoyalblue : "#ccc",
                                        }]}
                                    >
                                        <Text style={[styles.platformText, { color: isSelected ? "#fff" : "#000" }]}>
                                            {p.charAt(0).toUpperCase() + p.slice(1)}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                        :
                        selectedFilter == "Price" ?
                            <View style={{ width: "100%" }}>
                                {[
                                    { label: "Instagram", field: "ig" },
                                    { label: "YouTube", field: "yt" },
                                    { label: "Facebook", field: "fb" },
                                ].map(({ label, field }) => {
                                    const enabled = priceEnabled[field];
                                    return (
                                        <View key={field} style={styles.pricePlatformRow}>
                                            <Pressable
                                                style={styles.priceLabelRow}
                                                onPress={() => {
                                                    const nowEnabled = !priceEnabled[field];
                                                    setPriceEnabled(prev => ({ ...prev, [field]: nowEnabled }));
                                                    if (nowEnabled) setPrice(prev => ({ ...prev, [field]: prev[field] ?? { min: 0, max: 50000 } }));
                                                    else setPrice(prev => ({ ...prev, [field]: null }));
                                                }}
                                                hitSlop={8}
                                            >
                                                <View style={[styles.checkbox, enabled && styles.checkboxChecked]}>
                                                    {enabled && <Text style={styles.checkmark}>✓</Text>}
                                                </View>
                                                <Text style={styles.pricePlatformLabel}>{label}</Text>
                                            </Pressable>
                                            <CustomSlider
                                                minValue={0}
                                                maxValue={50000}
                                                singleHandle={true}
                                                selectedValues={(val) => setPrice(prev => ({ ...prev, [field]: val }))}
                                            />
                                        </View>
                                    );
                                })}
                            </View>
                            :
                            selectedFilter == "Engagement Rate" ?
                                <View style={{ width: "100%" }}>
                                    {[
                                        { label: "Instagram", field: "ig" },
                                        { label: "YouTube", field: "yt" },
                                        { label: "Facebook", field: "fb" },
                                    ].map(({ label, field }) => {
                                        const enabled = engagementEnabled[field];
                                        return (
                                            <View key={field} style={styles.pricePlatformRow}>
                                                <Pressable
                                                    style={styles.priceLabelRow}
                                                    onPress={() => {
                                                        const nowEnabled = !engagementEnabled[field];
                                                        setEngagementEnabled(prev => ({ ...prev, [field]: nowEnabled }));
                                                        if (nowEnabled) setEngagementRate(prev => ({ ...prev, [field]: prev[field] ?? { min: 0, max: 100 } }));
                                                        else setEngagementRate(prev => ({ ...prev, [field]: null }));
                                                    }}
                                                    hitSlop={8}
                                                >
                                                    <View style={[styles.checkbox, enabled && styles.checkboxChecked]}>
                                                        {enabled && <Text style={styles.checkmark}>✓</Text>}
                                                    </View>
                                                    <Text style={styles.pricePlatformLabel}>{label}</Text>
                                                </Pressable>
                                                <CustomSlider
                                                    minValue={0}
                                                    maxValue={100}
                                                    singleHandle={true}
                                                    selectedValues={(val) => setEngagementRate(prev => ({ ...prev, [field]: val }))}
                                                />
                                            </View>
                                        );
                                    })}
                                </View>
                                :
                                selectedFilter == "Age" ?
                                    <View style={[styles.depth5Frame01, styles.frameLayout]}>
                                        <CustomSlider minValue={0} maxValue={100} selectedValues={setSelectedAges} />
                                    </View>
                                    :
                                    selectedFilter == "Followers Count" ?
                                        <View style={[styles.depth5Frame01, styles.frameLayout]}>
                                            <CustomSlider minValue={1000} maxValue={50000} selectedValues={setSelectedFollowersCount} />
                                        </View>
                                        :
                                        selectedFilter == "Post Count" ?
                                            <View style={[styles.depth5Frame01, styles.frameLayout]}>
                                                <CustomSlider minValue={100} maxValue={2000} selectedValues={setSelectedPostCount} />
                                            </View>
                                            :
                                            selectedFilter == "Views Count" ?
                                                <View style={[styles.depth5Frame01, styles.frameLayout]}>
                                                    <CustomSlider minValue={100} maxValue={2000} selectedValues={setSelectedViewsCount} />
                                                </View>
                                                :
                                                selectedFilter == "Location" ?
                                                    <View style={{ paddingVertical: 8 }}>
                                                        <View>
                                                            <DropDown
                                                                name={selectedLocation}
                                                                items={locationData}
                                                                dropDownOptionStyle={{
                                                                    width: "100%",
                                                                    paddingVertical: 16,
                                                                    backgroundColor: "#fff",
                                                                    borderWidth: 2,
                                                                    borderColor: "#DBE0E5"
                                                                }}
                                                                showElements={showElements}
                                                                setShowElement={setShowElements}
                                                                dropDownContainerStyle={{ width: "100%" }}
                                                                dropDownItemsStyle={{ width: "100%", position: "absolute", top: 50, zIndex: 1000, height: 160, overflow: "scroll" }}
                                                                titleStyle={{ paddingStart: 12, color: "#4F7A94" }}
                                                                selectedValue={setSelectedLocation}
                                                            />
                                                        </View>
                                                    </View>
                                                    :
                                                    selectedFilter == "Gender" ?
                                                        <View style={{ paddingVertical: 8 }}>
                                                            <View>
                                                                <DropDown
                                                                    name={gender}
                                                                    items={genderData}
                                                                    dropDownOptionStyle={{
                                                                        width: "100%",
                                                                        paddingVertical: 16,
                                                                        backgroundColor: "#fff",
                                                                        borderWidth: 2,
                                                                        borderColor: "#DBE0E5"
                                                                    }}
                                                                    dropDownContainerStyle={{ width: "100%" }}
                                                                    dropDownItemsStyle={{ width: "100%", position: "absolute", top: 55, zIndex: 1000, height: 120, overflow: "scroll" }}
                                                                    titleStyle={{ paddingStart: 12, color: "#4F7A94" }}
                                                                    selectedValue={setGender}
                                                                    showElements={showElements}
                                                                    setShowElement={setShowElements}
                                                                />
                                                            </View>
                                                        </View>
                                                        :
                                                        selectedFilter == "Tags" ?
                                                            <View style={[styles.textBoxContainer]}>
                                                                <TextInput
                                                                    style={styles.textInput}
                                                                    value={tags}
                                                                    onChangeText={setTags}
                                                                    placeholder="Search tags"
                                                                />
                                                            </View>
                                                            :
                                                            selectedFilter == "Category" ?
                                                                <View style={{ width: "100%", zIndex: 10 }}>
                                                                    <MultipleSelectList
                                                                        setSelected={(val) => setCategories(val)}
                                                                        data={categoriedData}
                                                                        save="value"
                                                                        selectedval={categories}
                                                                        setSelectedVal={setCategories}
                                                                    />
                                                                </View>
                                                                :
                                                                <View style={{ width: "100%", zIndex: 10 }}>
                                                                    <MultipleSelectList
                                                                        setSelected={(val) => setCities(val)}
                                                                        data={locationData}
                                                                        save="value"
                                                                        selectedval={cities}
                                                                        setSelectedVal={setCities}
                                                                    />
                                                                </View>
                }
                <TouchableOpacity style={[styles.depth3Frame05]} onPress={()=>{
                    handleApplyFilters()
                    handleClosePress()
                }}>
                    <Text
                        style={[styles.applyFilters, styles.ageLayout]}
                        numberOfLines={1}
                    >
                        Apply Filters
                    </Text>
                </TouchableOpacity>
            </View>
        </BottomSheet>
    )
}
const styles = StyleSheet.create({
    depth3Frame05: {
        width: "100%",
        backgroundColor: Color.colorRoyalblue,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 6,
        height: 50,
        maxHeight: 50,
        borderRadius: Border.br_base,
        position: "absolute",
        bottom: 20
    },
    applyFilters: {
        color: Color.colorWhite,
        textAlign: "center",
        fontFamily: FontFamily.beVietnamProBold,
        fontWeight: "700",
        alignSelf: "stretch",
        overflow: "hidden",
    },
    contentContainer: {
        width: "100%",
        flex: 1,
        alignItems: 'center',
        height: "auto",
        paddingHorizontal: 28,
        position: "relative"
    },
    headlineRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        paddingVertical: Padding.p_base,
        position: "relative",
    },
    containerHeadline: {
        color: Color.colorBlack,
        fontFamily: FontFamily.beVietnamProBold,
        fontSize: FontSize.size_lg,
    },
    clearButton: {
        position: "absolute",
        right: 0,
        padding: 6,
    },
    clearButtonText: {
        fontSize: FontSize.size_lg,
        color: Color.colorGray_400,
    },
    platformsContainer: {
        width: "100%",
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 16
    },
    platformContainer: {
        paddingHorizontal: 32,
        paddingVertical: 8,
        borderRadius: Border.br_base,
        backgroundColor: Color.colorWhitesmoke_300,
        borderWidth: 1,
        borderColor: "#ccc"
    },
    depth5Frame01: {
        width:"100%",
        backgroundColor: Color.colorGainsboro,
        paddingLeft: Padding.p_196xl,
        paddingRight: Padding.p_35xl,
        flexDirection: "row",
    },
    pricePlatformRow: {
        width: "100%",
        marginBottom: 2,
    },
    priceLabelRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: "#ccc",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
    },
    checkboxChecked: {
        backgroundColor: Color.colorRoyalblue,
        borderColor: Color.colorRoyalblue,
    },
    checkmark: {
        color: "#fff",
        fontSize: 12,
        fontWeight: "bold",
        lineHeight: 14,
    },
    pricePlatformLabel: {
        fontFamily: FontFamily.beVietnamProBold,
        fontSize: FontSize.size_base,
        color: Color.colorBlack,
    },
    textBoxContainer: {
        borderRadius: Border.br_xs,
        backgroundColor: Color.colorAliceblue,
        height: 56,
        justifyContent: "space-between",
        flexDirection: "row",
        width: "100%",
        zIndex: 1,
    },
    textInput: {
        width: "100%",
        borderColor: Color.colorGray_400,
        borderWidth: 0,
        borderRadius: Border.br_xs,
        paddingHorizontal: Padding.p_base,
        fontSize: FontSize.size_base,
        flex: 1,
        color: Color.colorSteelblue_200,
    },
});

export default Filter;