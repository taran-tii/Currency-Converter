/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

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
      iconStyle: { width: 30, height: 30 }
    },
    animationEnabled: false
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
