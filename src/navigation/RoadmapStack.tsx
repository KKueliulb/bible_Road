import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RoadmapScreen from '../screens/roadmap/RoadmapScreen';
import ReadingScreen from '../screens/reading/ReadingScreen';
import { colors } from '../constants/theme';

export type RoadmapStackParamList = {
  RoadmapHome: undefined;
  Reading: { bookId: string; bookName: string };
};

const Stack = createNativeStackNavigator<RoadmapStackParamList>();

export default function RoadmapStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTintColor: colors.navy }}>
      <Stack.Screen name="RoadmapHome" component={RoadmapScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="Reading"
        component={ReadingScreen}
        options={({ route }) => ({ title: route.params.bookName, headerBackButtonDisplayMode: 'minimal' })}
      />
    </Stack.Navigator>
  );
}
