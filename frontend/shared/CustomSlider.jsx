import React, { useEffect, useState } from "react";
import { Text, View, StyleSheet, Dimensions } from 'react-native'
import MultiSlider from "@ptomasroos/react-native-multi-slider";

const SCREEN_WIDTH = Dimensions.get('window').width;

// singleHandle=true: left dot is fixed at minValue (small grey dot), only right handle moves
export default function CustomSlider({ minValue, maxValue, selectedValues, containerWidth, singleHandle = false }) {
    const [value, setValue] = useState({ values: [minValue, maxValue] })
    const [width, setWidth] = useState(0)

    useEffect(() => {
        setValue({ values: [minValue, maxValue] });
    }, [minValue, maxValue])

    const sliderLength = containerWidth || (width > 0 ? width : SCREEN_WIDTH - 96);

    const handleChange = (values) => {
        if (singleHandle) {
            setValue({ values: [minValue, values[0]] });
            selectedValues({ min: minValue, max: values[0] });
        } else {
            setValue({ values });
            selectedValues({ min: values[0], max: values[1] });
        }
    }

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
                step={1}
                trackStyle={{ height: 4, borderRadius: 50 }}
            />
            <View style={styles.valuesContainer}>
                {!singleHandle && <Text style={styles.valueText}>{value.values[0]}</Text>}
                {singleHandle && <Text style={[styles.valueText, { color: "#aaa" }]}>0</Text>}
                <Text style={styles.valueText}>{value.values[1]}</Text>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    sliderContainer: {
        width: "100%",
        height: 70,
        paddingVertical: 8,
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
        marginTop: 4,
    },
    valueText: {
        color: "#000",
        fontWeight: "bold",
    },
})
