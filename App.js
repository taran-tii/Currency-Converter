/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

// https://www.npmjs.com/package/react-navigation
// https://codeburst.io/ricky-figures-it-out-simple-react-native-tabnavigator-using-react-navigation-592945a3b211
// https://reactnativecode.com/create-picker-spinner-using-dynamic-json-data/
// https://stackoverflow.com/questions/51360029/react-navigation-createbottomtabnavigator-not-working/51360818
// https://github.com/davekedar/React-Navigation-V2-Authflow/blob/master/App.js

import React, { Component } from "react";
import { View, Dimensions } from "react-native";
import { createBottomTabNavigator } from "react-navigation";
import PhysicalCurrency from "./src/PhysicalCurrency";
import CryptoCurrency from "./src/CryptoCurrency";

import SplashScreen from "react-native-splash-screen";

const MainNavigator = createBottomTabNavigator(
  {
    PhysicalCurrency: { screen: PhysicalCurrency },
    CryptoCurrency: { screen: CryptoCurrency }
  },
  {
    swipeEnable: false,
    tabBarPosition: "bottom",
    tabBarOptions: {
      showIcon: true,
      showLabel: false,
      activeTintColor: "#f2f2f2",
      activeBackgroundColor: "#eb4444",
      inactiveBackgroundColor: "#d5d5d5",
      inactiveTintColor: "#878383",
      labelStyle: {
        fontSize: 20,
        padding: 12
      },
      iconStyle: { width: 30, height: 30 },
    },
    animationEnabled: false,
  }
);

export default class App extends React.Component {
  componentWillMount() {
    SplashScreen.hide();
  }

  render() {
    return <MainNavigator />;
  }
}
