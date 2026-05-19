import React, { useEffect, useState } from "react";
import { Text, View, StyleSheet, Dimensions, TextInput } from 'react-native'
import MultiSlider from "@ptomasroos/react-native-multi-slider";

const SCREEN_WIDTH = Dimensions.get('window').width;

const formatValue = (val) => {
    if (val >= 10000000) return `${(val / 10000000).toFixed(val % 10000000 === 0 ? 0 : 1)}Cr`;
    if (val >= 100000) return `${(val / 100000).toFixed(val % 100000 === 0 ? 0 : 1)}L`;
    if (val >= 1000) return `${(val / 1000).toFixed(val % 1000 === 0 ? 0 : 1)}K`;
    return String(val);
};

export default function CustomSlider({ minValue, maxValue, selectedValues, containerWidth, singleHandle = false, maxLabel, step, editableMin = false, defaultMin, defaultMax }) {
    const initMin = defaultMin ?? minValue;
    const initMax = defaultMax ?? maxValue;
    const [value, setValue] = useState({ values: [initMin, initMax] })
    const [width, setWidth] = useState(0)
    const [isEditing, setIsEditing] = useState(false)
    const [inputText, setInputText] = useState(String(initMax))
    const [isEditingMin, setIsEditingMin] = useState(false)
    const [inputTextMin, setInputTextMin] = useState(String(initMin))

    useEffect(() => {
        if (defaultMin == null && defaultMax == null) {
            setValue({ values: [minValue, maxValue] });
        }
    }, [minValue, maxValue])

    const sliderLength = containerWidth || (width > 0 ? width : SCREEN_WIDTH - 96);

    const handleChange = (values) => {
        if (singleHandle) {
            setValue({ values: [minValue, values[0]] });
            selectedValues({ min: minValue, max: values[0] });
            setInputText(String(values[0]));
        } else {
            setValue({ values });
            selectedValues({ min: values[0], max: values[1] });
            setInputText(String(values[1]));
            if (editableMin) setInputTextMin(String(values[0]));
        }
    }

    const handleInputSubmit = () => {
        const parsed = parseInt(inputText.replace(/,/g, ""), 10);
        const currentMin = value.values[0];
        if (!isNaN(parsed) && parsed >= currentMin && parsed <= maxValue) {
            const newRight = parsed;
            if (singleHandle) {
                setValue({ values: [minValue, newRight] });
                selectedValues({ min: minValue, max: newRight });
            } else {
                setValue({ values: [currentMin, newRight] });
                selectedValues({ min: currentMin, max: newRight });
            }
            setInputText(String(newRight));
        } else {
            setInputText(String(value.values[1]));
        }
        setIsEditing(false);
    }

    const handleMinInputSubmit = () => {
        const parsed = parseInt(inputTextMin.replace(/,/g, ""), 10);
        const currentMax = value.values[1];
        if (!isNaN(parsed) && parsed >= minValue && parsed <= currentMax) {
            setValue({ values: [parsed, currentMax] });
            selectedValues({ min: parsed, max: currentMax });
            setInputTextMin(String(parsed));
        } else {
            setInputTextMin(String(value.values[0]));
        }
        setIsEditingMin(false);
    }

    const currentMin = value.values[0];
    const currentMax = value.values[1];

    return (
        <View style={styles.sliderContainer} onLayout={(evt) => {
            const w = evt.nativeEvent.layout.width;
            if (w > 0) setWidth(w);
        }}>
            <MultiSlider
                values={singleHandle ? [value.values[1]] : [value.values[0], value.values[1]]}
                sliderLength={sliderLength - 20}
                selectedStyle={{ backgroundColor: '#000', height: 3 }}
                containerStyle={styles.containerStyle}
                onValuesChange={handleChange}
                unselectedStyle={{ backgroundColor: "#DBE0E5" }}
                markerStyle={{ backgroundColor: "#000", height: 20, width: 20, position: "absolute", top: -8, left: -1, shadowOpacity: 0, borderWidth: 0, padding: 0 }}
                min={minValue}
                max={maxValue}
                step={step ?? (maxValue <= 1000 ? 1 : 1000)}
                trackStyle={{ height: 4, borderRadius: 50 }}
            />
            <View style={styles.valuesContainer}>
                {editableMin ? (
                    <View style={styles.editableContainer}>
                        <Text style={styles.maxLabel}>{formatValue(minValue)} /</Text>
                        {isEditingMin ? (
                            <TextInput
                                style={styles.minInput}
                                value={inputTextMin}
                                onChangeText={setInputTextMin}
                                keyboardType="numeric"
                                autoFocus
                                onBlur={handleMinInputSubmit}
                                onSubmitEditing={handleMinInputSubmit}
                                selectTextOnFocus
                                placeholder="Min"
                            />
                        ) : (
                            <Text
                                style={styles.valueText}
                                onPress={() => {
                                    setInputTextMin(String(currentMin));
                                    setIsEditingMin(true);
                                }}
                            >
                                {formatValue(currentMin)}
                            </Text>
                        )}
                    </View>
                ) : (
                    <Text style={styles.valueText}>{formatValue(minValue)}</Text>
                )}

                <View style={styles.editableContainer}>
                    {isEditing ? (
                        <TextInput
                            style={styles.maxInput}
                            value={inputText}
                            onChangeText={setInputText}
                            keyboardType="numeric"
                            autoFocus
                            onBlur={handleInputSubmit}
                            onSubmitEditing={handleInputSubmit}
                            selectTextOnFocus
                            placeholder="Max"
                        />
                    ) : (
                        <Text
                            style={styles.valueText}
                            onPress={() => {
                                setInputText(String(currentMax));
                                setIsEditing(true);
                            }}
                        >
                            {formatValue(currentMax)}
                        </Text>
                    )}
                    {maxLabel && <Text style={styles.maxLabel}>/ {maxLabel}</Text>}
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    sliderContainer: {
        width: "100%",
        height: 80,
        paddingTop: 4,
        paddingBottom: 8,
        paddingHorizontal: 10,
    },
    containerStyle: {
        alignSelf: "center",
        marginTop: 4,
        height: "auto"
    },
    valuesContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 12,
        alignItems: "center",
    },
    valueText: {
        color: "#000",
        fontWeight: "bold",
    },
    editableContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    maxLabel: {
        color: "#aaa",
        fontSize: 11,
    },
    maxInput: {
        color: "#000",
        fontWeight: "bold",
        borderBottomWidth: 1,
        borderColor: "#1a5ce6",
        minWidth: 60,
        textAlign: "right",
        padding: 0,
    },
    minInput: {
        color: "#000",
        fontWeight: "bold",
        borderBottomWidth: 1,
        borderColor: "#1a5ce6",
        minWidth: 60,
        textAlign: "left",
        padding: 0,
    },
})
