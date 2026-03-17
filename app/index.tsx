
import { AuthContext } from "@/context/AuthProvider";
import { router } from "expo-router";
import { useContext, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, useTheme } from "react-native-paper";
import { Rect, Svg, Text as SvgText } from "react-native-svg";
import * as Notifications from 'expo-notifications';

	
export default function Preload() {
	const theme = useTheme();
	const { userAuth, isLoading } = useContext<any>(AuthContext);
	const [progress, setProgress] = useState(0);

	useEffect(() => {
		const interval = setInterval(() => {
			setProgress(prev => {
				if (prev >= 100) {
					clearInterval(interval);
					return 100;
				}
				return prev + 2;
			});
		}, 50);

		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		if (!isLoading && progress >= 100) {
			setTimeout(() => {
				if (userAuth) {
					router.replace("/(tabs)");
				} else {
					router.replace("/signIn");
				}
			}, 300);
		}
	}, [userAuth, isLoading, progress]);

	return (
		<SafeAreaView
			style={{ ...styles.container, backgroundColor: theme.colors.background }}
		>
			<Svg
				width={220}
				height={180}
				viewBox="0 0 230 120"
				style={styles.logoSvg}
			>
				<Rect
					x="4"
					y="4"
					width="200"
					height="120"
					rx="13"
					fill={theme.colors.surface}
					stroke={theme.colors.primary}
					strokeWidth="3"
				/>
				<Rect
					x="4"
					y="4"
					width="200"
					height="22"
					rx="13"
					fill={theme.colors.primary}
				/>
				<SvgText
					x="20"
					y="78"
					fill={theme.colors.onSurface}
					fontSize="32"
					fontWeight="bold"
				>
					&gt; Execlog_
				</SvgText>
			</Svg>

			<View style={styles.progressContainer}>
				<View style={[styles.progressTrack, { backgroundColor: theme.colors.surfaceVariant }]}>
					<View 
						style={[
							styles.progressFill,
							{
								width: `${progress}%`,
								backgroundColor: theme.colors.primary,
							}
						]}
					/>
				</View>
				<Text variant="bodyMedium" style={[styles.progressText, { color: theme.colors.onSurface }]}>
					{progress}%
				</Text>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	logoSvg: {
		marginBottom: 40,
	},
	progressContainer: {
		width: 280,
		alignItems: "center",
	},
	progressTrack: {
		width: "100%",
		height: 8,
		borderRadius: 4,
		overflow: "hidden",
		marginBottom: 12,
	},
	progressFill: {
		height: "100%",
		borderRadius: 4,
		minWidth: 2,
	},
	progressText: {
		fontWeight: "600",
	},
});
