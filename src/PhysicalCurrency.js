import React, { Component } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  ActivityIndicator,
  View,
  Button,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  FlatList,
  TouchableHighlight,
  TouchableOpacity,
  Image,
  ToastAndroid,
  Dimensions,
  SafeAreaView
} from "react-native";
import physicalCurrencyData from "../data/physicalCurrencyData.json";
import Icon from "react-native-vector-icons/MaterialIcons";
import { NavigationEvents } from "react-navigation";
import PopupDialog, {
  SlideAnimation,
  DialogTitle
} from "react-native-popup-dialog";

type Props = {};

const Realm = require("realm");
//let realm;

const currencyConverter = {
  name: "Currency_Converter",
  properties: {
    id: { type: "int", default: 0 },
    introShow: { type: "bool", default: false },
    usdExchange: "string",
    lastUSDRefresh: "string",
    bitcoinExchange: "string",
    lastBitCoinExchange: "string"
  }
};

const slideAnimation = new SlideAnimation({
  slideFrom: "bottom"
});

export default class PhysicalCurrency extends Component<Props> {
  static navigationOptions = {
    tabBarLabel: " ",
    tabBarIcon: ({ tintColor }) => (
      <Image
        source={require("../images/ic_physical_currency.png")}
        style={{
          width: 55,
          height: 24,
          tintColor: tintColor,
          marginTop: Platform.OS === "ios" ? "1%" : 0
        }}
      />
    )
  };

  constructor(props) {
    super(props);

    iPhoneXHeight = Dimensions.get("window").height;
    console.log("IPhoneX : " + iPhoneXHeight);

    this.state = {
      FromCurrency: "USD",
      ToCurrency: "INR",
      amount: "",
      error: null,
      data: null,
      convertedAmount: "0.000000",
      exchangeRate: "0.000000",
      isIntroShow: false,
      isLoading: false
    };

    fromTextPress = false;
    isReverse = false;
    currentOS = Platform.OS;

    Realm.open({ schema: [currencyConverter] })
      .then(realm => {
        realm.write(() => {
          if (realm.objects("Currency_Converter")[0] === undefined) {
            realm.create("Currency_Converter", {
              id: 0,
              introShow: true,
              usdExchange: "0.000000",
              lastUSDRefresh: "",
              bitcoinExchange: "0.000000",
              lastBitCoinExchange: ""
            });
          }
        });
      })
      .catch(error => {
        console.log(error);
      });
  }

  componentWillMount() {
    // Realm.open({ schema: [currencyConverter] }).then(realm => {
    //   realm.write(realm => {

    //   });
    // }).catch(error => { console.log(error);});

    Realm.open({ schema: [currencyConverter] })
      .then(realm => {
        let data;
        realm.write(() => {
          data = realm.objects("Currency_Converter")[0];
        });

        console.log(data);
        this.setState({ isIntroShow: data.introShow });

        realm.write(() => {
          const data = realm.objects("Currency_Converter")[0];
          data.introShow = false;
        });
      })
      .catch(error => {
        console.log(error);
      });

    this.makeRemoteRequest();
  }

  _onWillFocus = () => {
    Realm.open({ schema: [currencyConverter] })
      .then(realm => {
        let data;
        realm.write(() => {
          data = realm.objects("Currency_Converter")[0];
        });

        console.log(data);
        if (data !== NaN) {
          var hourDiff =
            new Date().getTime() - new Date(data.lastUSDRefresh).getTime();
          var minDiff = hourDiff / 60 / 1000; //in minutes
          console.log(minDiff);
        }

        if (minDiff > 5.0) {
          this.makeRemoteRequest();
        } else {
          this.setState({ exchangeRate: data.usdExchange });
        }
      })
      .catch(error => {
        console.log(error);
      });
  };

  showSlideAnimationDialog = () => {
    this.slideAnimationDialog.show();
  };

  _onWillBlur = () => {
    this.setState({
      amount: "",
      convertedAmount: "0.000000",
      FromCurrency: "USD",
      ToCurrency: "INR",
      error: null,
      data: null,
      exchangeRate: "0.000000",
      isLoading: false
    });
    isReverse = false;
  };

  makeRemoteRequest = () => {
    setTimeout(() => {
      const url = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=${
        this.state.FromCurrency
      }&to_currency=${this.state.ToCurrency}&apikey=2IU1ZARJCUFB24Z7`;
      this.setState({ isLoading: true });
      fetch(url)
        .then(res => res.json())
        .then(res => {
          this.setState({
            exchangeRate:
              res["Realtime Currency Exchange Rate"]["5. Exchange Rate"],
            error: res.error || null,
            isLoading: false
          });
          console.log(res);
          console.log(this.state.exchangeRate);
          this.calculateAmount();

          if (this.state.FromCurrency === "USD") {
            Realm.open({ schema: [currencyConverter] })
              .then(realm => {
                realm.write(() => {
                  let data = realm.objects("Currency_Converter")[0];
                  data.usdExchange = this.state.exchangeRate;
                  data.lastUSDRefresh = new Date().toString();
                });
              })
              .catch(error => {
                //console.log(error);
              });
          }
        })
        .catch(error => {
          this.setState({ error: error, isLoading: false });
          console.log(this.state.error);
          this.showAlert();
        });
    }, 1000);
  };

  showAlert = () => {
    Alert.alert(
      "Alert",
      "Something went wrong please try again !!",
      [
        {
          text: "Cancel",
          onPress: () => console.log("Cancel Pressed"),
          style: "cancel"
        },
        { text: "OK", onPress: () => this.makeRemoteRequest() }
      ],
      { cancelable: false }
    );
  };

  calculateAmount = () => {
    if (this.state.amount !== "") {
      var amt = parseFloat(this.state.amount).toFixed(6);
      var exchangeRate = parseFloat(this.state.exchangeRate).toFixed(6);

      if (isReverse) {
        var totalAmount = parseFloat(amt / exchangeRate).toFixed(6);
        console.log(
          "Rev: " +
            isReverse +
            " Amt: " +
            amt +
            " Exc: " +
            exchangeRate +
            " Tot: " +
            totalAmount
        );
        this.setState({ convertedAmount: totalAmount });
      } else {
        var totalAmount = parseFloat(amt * exchangeRate).toFixed(6);
        console.log(
          "Rev: " +
            isReverse +
            " Amt: " +
            amt +
            " Exc: " +
            exchangeRate +
            " Tot: " +
            totalAmount
        );
        this.setState({ convertedAmount: totalAmount });
      }
    } else {
      this.setState({ convertedAmount: "0.000000" });
    }
  };

  handelReverseIconPress = () => {
    this.calculateAmount();
    this.setState({
      FromCurrency: this.state.ToCurrency
    });

    this.setState({
      ToCurrency: this.state.FromCurrency
    });
  };

  handelUpdateButtonPress = item => {
    if (fromTextPress) {
      this.setState({
        FromCurrency: item.currency_code
      });
    } else {
      this.setState({
        ToCurrency: item.currency_code
      });
    }

    this.makeRemoteRequest();
    this.slideAnimationDialog.dismiss();
  };

  render() {
    return (
      <TouchableWithoutFeedback
        onPress={() => {
          Keyboard.dismiss;
          this.setState({ isIntroShow: false });
        }}
      >
        <View style={styles.container}>
          <PopupDialog
            ref={popupDialog => {
              this.slideAnimationDialog = popupDialog;
            }}
            dialogAnimation={slideAnimation}
            width={0.85}
            dialogTitle={
              <View style={styles.currencySelectorDialog}>
                <Text style={styles.currencySelectorDialogTitle}>
                  Select Currency
                </Text>
              </View>
            }
          >
            <View style={{ marginLeft: 10, marginRight: 10 }}>
              <FlatList
                style={{ height: 250 }}
                data={physicalCurrencyData}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  return (
                    <TouchableHighlight
                      underlayColor="#878383"
                      onPress={() => this.handelUpdateButtonPress(item)}
                    >
                      <Text style={styles.currencySelectorDialogList}>
                        {item.currency_code + ", " + item.currency_name}
                      </Text>
                    </TouchableHighlight>
                  );
                }}
                keyExtractor={(item, index) => index.toString()}
              />
            </View>
          </PopupDialog>

          <NavigationEvents
            onWillFocus={payload => {
              this._onWillFocus();
            }}
            onWillBlur={payload => {
              this._onWillBlur();
            }}
          />

          <View style={styles.titleContainer}>
            <Text style={styles.title}>Currency Converter</Text>
          </View>

          <ScrollView style={styles.scrollView}>
            <View>
              <View style={styles.currencyType}>
                <TouchableOpacity
                  onPress={() => {
                    fromTextPress = true;
                    this.showSlideAnimationDialog();
                  }}
                >
                  <View>
                    <Text style={styles.currencyTypeText}>
                      {this.state.FromCurrency}
                    </Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.arrowIcon}>
                  <Image
                    style={styles.arrowIconStyle}
                    source={require("../images/ic_arrow.png")}
                  />
                </View>

                <TouchableOpacity
                  onPress={() => {
                    fromTextPress = false;
                    this.showSlideAnimationDialog();
                  }}
                >
                  <View>
                    <Text style={styles.currencyTypeText}>
                      {this.state.ToCurrency}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.amountText}
                placeholder="Enter Amount"
                placeholderTextColor="#878383"
                onChangeText={text => {
                  this.onChanged(text);
                }}
                onSubmitEditing={() => this.calculateAmount()}
                value={this.state.amount}
                keyboardType="numeric"
                returnKeyType="done"
              />
              {this.state.isLoading ? (
                <View style={styles.loading}>
                  <ActivityIndicator size="large" color="#878383" />
                </View>
              ) : (
                <Text style={styles.convertedAmountText}>
                  {this.state.convertedAmount} {this.state.ToCurrency}
                </Text>
              )}
            </View>
          </ScrollView>

          <View style={styles.reverseIcon}>
            <TouchableOpacity
              onPress={() => {
                this.setState({ convertedAmount: "0.00" });
                isReverse
                  ? ((isReverse = false), console.log("Rev1: " + isReverse))
                  : ((isReverse = true), console.log("Rev2: " + isReverse));
                this.handelReverseIconPress();
              }}
            >
              <Image
                style={{ width: 75, height: 75 }}
                source={require("../images/ic_float_action.png")}
              />
            </TouchableOpacity>
          </View>

          {this.state.isIntroShow ? (
            Platform.OS === "ios" ? (
              <View
                style={{
                  height: "100%",
                  width: "100%",
                  zIndex: 1,
                  position: "absolute"
                }}
              >
                {Dimensions.get("window").height >= 812 ? (
                  <Image
                    style={{ width: "100%", height: "100%" }}
                    source={require("../images/intro_iphone_x.png")}
                  />
                ) : (
                  <Image
                    style={{ width: "100%", height: "100%" }}
                    source={require("../images/intro_iPhone.png")}
                  />
                )}
              </View>
            ) : (
              <View
                style={{
                  height: "100%",
                  width: "100%",
                  backgroundColor: "rgba(0, 0, 0, 0.6)",
                  zIndex: 1,
                  position: "absolute"
                }}
              >
                <View
                  style={{
                    marginTop: Platform.OS === "ios" ? "25%" : "13%",
                    marginStart: "5%",
                    width: Platform.OS === "ios" ? "100%" : 0
                  }}
                >
                  <Text
                    style={{
                      color: "white",
                      textAlign: "center",
                      fontSize: 17,
                      height: Platform.OS === "ios" ? 25 : 0
                    }}
                  >
                    Tap here to choose the currency.
                  </Text>
                  <View style={{ flexDirection: "row", marginStart: "40%" }}>
                    <Image
                      style={{
                        width: 30,
                        height: 30,
                        transform: [{ rotate: "140deg" }]
                      }}
                      source={require("../images/arrow.png")}
                    />
                    <Image
                      style={{
                        width: 30,
                        height: 30,
                        marginStart: 10,
                        transform: [{ rotate: "40deg" }]
                      }}
                      source={require("../images/arrow.png")}
                    />
                  </View>
                </View>

                <View
                  style={{
                    height: 100,
                    marginTop: "10%",
                    marginStart: "20%"
                  }}
                >
                  <Text
                    style={{
                      width: Platform.OS === "ios" ? 240 : 180,
                      color: "white",
                      textAlign: "center",
                      fontSize: 16
                    }}
                  >
                    Fill in the amount you want to convert.
                  </Text>

                  <Image
                    style={{
                      width: 30,
                      height: 30,
                      marginStart: Platform.OS === "ios" ? "15%" : 8,
                      transform: [{ rotate: "150deg" }],
                      marginTop: Platform.OS === "ios" ? "-2%" : "0%"
                    }}
                    source={require("../images/arrow.png")}
                  />
                </View>

                <View
                  style={{
                    marginTop: Platform.OS === "ios" ? "-1.5%" : "2%",
                    marginStart: "32%"
                  }}
                >
                  <Text
                    style={{
                      width: 180,
                      color: "white",
                      textAlign: "center",
                      fontSize: 17
                    }}
                  >
                    Get your results here.
                  </Text>

                  <Image
                    style={{
                      width: 30,
                      height: 30,
                      marginStart: "25%",
                      transform: [{ rotate: "130deg" }]
                    }}
                    source={require("../images/arrow.png")}
                  />
                </View>

                <View
                  style={{
                    justifyContent: "space-between",
                    marginVertical: Dimensions.get("window").height - "10%" / 2,
                    flexGrow: 1
                  }}
                >
                  <View
                    style={{
                      marginTop: Platform.OS === "ios" ? "1%" : "5%",
                      flexDirection: "row",
                      marginStart: Platform.OS === "ios" ? "7%" : "10%"
                    }}
                  >
                    <Text
                      style={{
                        width: 280,
                        color: "rgba(0, 0, 0, 0.0)",
                        textAlign: "center",
                        fontSize: 17
                      }}
                    >
                      To interchange between the currencies.
                    </Text>

                    <View
                      style={{
                        width: 30,
                        height: 30,
                        marginStart: -90,
                        marginTop: 17,
                        transform: [{ rotate: "45deg" }]
                      }}
                    />
                  </View>

                  <View
                    style={{
                      marginStart: Platform.OS === "ios" ? "5%" : "1%",
                      marginBottom: Platform.OS === "ios" ? 10 : 0
                    }}
                  >
                    <Text
                      style={{
                        width: 250,
                        color: "white",
                        textAlign: "center",
                        fontSize: 15,
                        marginStart: Platform.OS === "ios" ? "5%" : "0%"
                      }}
                    >
                      Swap here for fiat or crypto currency modes.
                    </Text>

                    <View
                      style={{
                        flexDirection: "row"
                      }}
                    >
                      <Image
                        style={{
                          width: 30,
                          height: 30,
                          marginStart: "12%",
                          marginTop: -15,
                          transform: [{ rotate: "90deg" }]
                        }}
                        source={require("../images/arrow.png")}
                      />

                      <Image
                        style={{
                          width: 30,
                          height: 30,
                          marginStart: "38%",
                          marginTop: -15,
                          transform: [{ rotate: "48deg" }]
                        }}
                        source={require("../images/arrow.png")}
                      />
                    </View>
                  </View>
                </View>

                <View
                  style={{
                    zIndex: 1,
                    position: "absolute",
                    marginTop:
                      Platform.OS === "ios"
                        ? Dimensions.get("window").height - 220
                        : Dimensions.get("window").height - 210,
                    marginStart: Platform.OS === "ios" ? "15%" : "10%",
                    justifyContent: "space-between"
                  }}
                >
                  <View
                    style={{
                      marginTop: Platform.OS === "ios" ? "-1%" : "4%",
                      flexDirection: "row",
                      marginStart: "19%"
                    }}
                  >
                    <Text
                      style={{
                        color: "white",
                        textAlign: "center",
                        fontSize: 17
                      }}
                    >
                      To interchange between the currencies.
                    </Text>

                    <Image
                      style={{
                        width: 30,
                        height: 30,
                        marginStart: Platform.OS === "ios" ? -44 : -55,
                        marginTop: 24,
                        transform: [{ rotate: "45deg" }]
                      }}
                      source={require("../images/arrow.png")}
                    />
                  </View>
                </View>
              </View>
            )
          ) : null}
        </View>
      </TouchableWithoutFeedback>
    );
  }

  onChanged = text => {
    var text2 = text.split(".").length - 1;
    if (text2 > 1) {
      var text3 = text.split(".");
      var text4 = "";
      if (text3[0].length === 0) {
        text4 = "0";
      } else {
        text4 = text3[0];
      }
      var text5 = "." + text3[1];
      var text6 = text4 + text5;
      this.setState({
        amount: text6.replace(/[\s,-]/g, "")
      });
    } else {
      if (text2 === 1) {
        var text3 = text.split(".");
        var text4 = "";
        if (text3[0].length === 0) {
          text4 = "0." + text3[1];
        } else {
          text4 = text;
        }
        this.setState({
          amount: text4.replace(/[\s,-]/g, "")
        });
      } else {
        this.setState({
          amount: text.replace(/[\s,-]/g, "")
        });
      }
    }
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5FCFF"
  },
  titleContainer: {
    height:
      Platform.OS === "ios"
        ? Dimensions.get("window").height >= 812
          ? 89
          : 64
        : 60,
    justifyContent: "center",
    alignItems: Platform.OS === "ios" ? "center" : "flex-start",
    paddingLeft: Platform.OS === "ios" ? 0 : 15,
    paddingTop:
      Platform.OS === "ios"
        ? Dimensions.get("window").height >= 812
          ? 39
          : 19
        : 0,
    backgroundColor: "#eb4444"
  },
  title: {
    fontSize: Platform.OS === "ios" ? 17 : 22,
    color: "#ffffff",
    fontWeight: Platform.OS === "ios" ? "normal" : "normal"
  },
  currencyType: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 40
  },
  currencyTypeText: {
    fontSize: 49,
    textAlign: "center",
    textAlignVertical: "center",
    color: "#5d5d5d"
  },
  amountText: {
    height: 55,
    marginLeft: 40,
    marginRight: 40,
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 4,
    marginTop: 40,
    padding: 8,
    fontSize: 20
  },
  convertedAmountText: {
    fontSize: 45,
    textAlign: "center",
    textAlignVertical: "center",
    color: "#394f62",
    marginTop: 30
  },
  reverseIcon: {
    justifyContent: "flex-end",
    alignItems: "flex-end",
    marginTop: "8%",
    marginEnd: 20
  },
  arrowIcon: {
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 5,
    marginRight: 5
  },
  currencySelectorDialog: {
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    backgroundColor: "#eb4444",
    borderTopEndRadius: 7,
    borderTopStartRadius: 7
  },
  currencySelectorDialogTitle: {
    fontSize: 20,
    color: "white"
  },
  currencySelectorDialogList: {
    fontSize: 20,
    marginBottom: 10,
    marginTop: 10
  },
  scrollView: {
    backgroundColor: "#F5FCFF"
  },
  loading: {
    marginTop: 30
  },
  arrowIconStyle: {
    width: 25,
    height: 25,
    marginLeft: 8,
    marginRight: 8
  }
});
