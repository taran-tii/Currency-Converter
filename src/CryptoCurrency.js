import React, { Component } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  ActivityIndicator,
  View,
  Image,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  FlatList,
  TouchableHighlight,
  TouchableOpacity,
  SafeAreaView,
  Dimensions
} from "react-native";
import physicalCurrencyData from "../data/physicalCurrencyData.json";
import cryptoCurrencyData from "../data/cryptoCurrencyData.json";
import Icon from "react-native-vector-icons/MaterialIcons";
import { NavigationEvents } from "react-navigation";
import PopupDialog, {
  SlideAnimation,
  DialogTitle
} from "react-native-popup-dialog";

type Props = {};

const Realm = require("realm");

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

export default class CryptoCurrency extends Component<Props> {
  static navigationOptions = {
    tabBarLabel: " ",
    tabBarIcon: ({ tintColor }) => (
      <Image
        source={require("../images/ic_crypto_currency.png")}
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

    this.state = {
      amount: "",
      fromCurrency: "BTC",
      toCurrency: "USD",
      error: null,
      data: null,
      convertedAmount: "0.000000",
      exchangeRate: "0.00",

      isLoading: false,
      currentCurrency: cryptoCurrencyData
    };

    fromTextPress = false;
    isFromCurrencySelected = true;
    isReverse = false;
    currentOS = Platform.OS
  }

  componentWillMount() {
    this.makeRemoteRequest();
  }

  _onWillFocus = () => {
    Realm.open({ schema: [currencyConverter] })
      .then(realm => {
        let data = NaN;
        realm.write(() => {
          data = realm.objects("Currency_Converter")[0];
        });

        if (data !== NaN) {
          var hourDiff =
            new Date().getTime() - new Date(data.lastBitCoinExchange).getTime();
          var minDiff = hourDiff / 60 / 1000; //in minutes
          console.log(minDiff);
        }

        if (minDiff > 5.0) {
          this.makeRemoteRequest();
        } else {
          this.setState({ exchangeRate: data.bitcoinExchange });
          console.log("Ex: " + this.state.exchangeRate);
        }
      })
      .catch(error => {
        console.log(error);
      });
  };

  showSlideAnimationDialog = () => {
    isFromCurrencySelected
      ? this.setState({ currentCurrency: cryptoCurrencyData })
      : this.setState({ currentCurrency: physicalCurrencyData });
    this.slideAnimationDialog.show();
  };

  _onWillBlur = () => {
    this.setState({
      amount: "",
      convertedAmount: "0.000000",
      fromCurrency: "BTC",
      toCurrency: "USD",
      error: null,
      data: null,
      exchangeRate: "0.00",

      isLoading: false
    });
    isReverse = false;
  };

  makeRemoteRequest = () => {
    setTimeout(() => {
      const url = `https://www.alphavantage.co/query?function=DIGITAL_CURRENCY_INTRADAY&symbol=${
        this.state.fromCurrency
      }&market=${this.state.toCurrency}&apikey=YR63NOZQNXKVCJH8`;
      console.log(url);
      this.setState({ isLoading: true });
      fetch(url)
        .then(res => res.json())
        .then(res => {
          console.log(res);
          fetchKey = res["Meta Data"]["7. Last Refreshed"];
          code = res["Meta Data"]["4. Market Code"];
          this.setState({
            exchangeRate:
              res["Time Series (Digital Currency Intraday)"][fetchKey][
                "1a. price (" + code + ")"
              ],
            error: res.error || null,
            isLoading: false
          });
          this.calculateAmount();

          if (this.state.fromCurrency === "BTC") {
            console.log("Inside if");
            Realm.open({ schema: [currencyConverter] })
              .then(realm => {
                realm.write(() => {
                  let data = realm.objects("Currency_Converter")[0];
                  data.bitcoinExchange = this.state.exchangeRate;
                  data.lastBitCoinExchange = new Date().toString();
                });
              })
              .catch(error => {
                console.log(error);
              });
          }
        })
        .catch(error => {
          this.setState({
            error: error,
            isLoading: false
          });
          console.log("My Error: " + error.toString());
          let message = "Something went wrong please try again !!";

          if (
            error.toString() ===
            "TypeError: Cannot read property '7. Last Refreshed' of undefined"
          ) {
            message = "Currently price is not available !!";
            this.setState({ exchangeRate: "0.000000" });
            if (isReverse) {
              this.setState({ toCurrency: "BTC" });
            } else {
              this.setState({ fromCurrency: "BTC" });
            }

            Realm.open({ schema: [currencyConverter] })
              .then(realm => {
                realm.write(() => {
                  let data = realm.objects("Currency_Converter")[0];
                  data.bitcoinExchange = this.state.exchangeRate;
                });
              })
              .catch(error => {
                console.log(error);
              });
          } else {
            message = "Something went wrong please try again !!";
          }
          this.showAlert(message);
        });
    }, 1000);
  };

  showAlert = message => {
    Alert.alert(
      "Alert",
      message,
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
        var totalAmount = amt / exchangeRate;
        console.log("Rev: " + isReverse + " Tot: " + totalAmount);
        this.setState({ convertedAmount: parseFloat(totalAmount).toFixed(6) });
      } else {
        var totalAmount = parseFloat(amt * exchangeRate).toFixed(6);
        console.log("Rev: " + isReverse + " Tot: " + totalAmount);
        this.setState({ convertedAmount: parseFloat(totalAmount).toFixed(6) });
      }
    } else {
      this.setState({ convertedAmount: "0.000000" });
    }
  };

  handelReverseIconPress = () => {
    this.calculateAmount();
    this.setState({
      fromCurrency: this.state.toCurrency
    });

    this.setState({
      toCurrency: this.state.fromCurrency
    });
  };

  handelUpdateButtonPress = item => {
    if (fromTextPress) {
      this.setState({
        fromCurrency: item.currency_code
      });
    } else {
      this.setState({
        toCurrency: item.currency_code
      });
    }

    this.makeRemoteRequest();
    this.slideAnimationDialog.dismiss();
  };

  render() {
    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} disabled={false}>
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
                data={this.state.currentCurrency}
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
                extraData={this.state.currentCurrency}
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

         <ScrollView style={{ backgroundColor: "#F5FCFF" }}>
            <View>
              <View style={styles.currencyType}>
                <TouchableOpacity
                  onPress={() => {
                    fromTextPress = true;
                    isReverse
                      ? (isFromCurrencySelected = false)
                      : (isFromCurrencySelected = true);
                    this.showSlideAnimationDialog();
                  }}
                >
                  <Text style={styles.currencyTypeText}>
                    {this.state.fromCurrency}
                  </Text>
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
                    isReverse
                      ? (isFromCurrencySelected = true)
                      : (isFromCurrencySelected = false);
                    this.showSlideAnimationDialog();
                  }}
                >
                  <Text style={styles.currencyTypeText}>
                    {this.state.toCurrency}
                  </Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.amountText}
                placeholder="Enter Amount"
                placeholderTextColor="#878383"
                onChangeText={text => {
                  //this.setState({ amount: text });
                  this.onChanged(text);
                }}
                onSubmitEditing={() => this.calculateAmount()}
                returnKeyType='done'
                value={this.state.amount}
                keyboardType="numeric"
              />

              {this.state.isLoading ? (
                <View style={styles.loading}>
                  <ActivityIndicator size="large" color="#878383" />
                </View>
              ) : (
                <Text style={styles.convertedAmountText}>
                  {this.state.convertedAmount} {this.state.toCurrency}
                </Text>
              )}
            </View>
         </ScrollView>

          <View style={styles.reverseIcon}>
            <TouchableOpacity
              onPress={() => {
                this.setState({ convertedAmount: "0.000000" });
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
    height: Platform.OS === "ios" ? Dimensions.get('window').height >= 812 ? 89 : 64 : 60,
    justifyContent: "center",
    alignItems: Platform.OS === "ios" ? "center" : "flex-start",
    paddingLeft: Platform.OS === "ios" ? 0 : 15,
    paddingTop: Platform.OS === "ios" ? Dimensions.get('window').height >= 812 ? 39 : 19 : 0,
    backgroundColor: "#eb4444"
  },
  title: {
    fontSize: Platform.OS === "ios" ? 17 : 22,
    color: "#ffffff",
    fontWeight: Platform.OS === "ios" ? 'normal' : 'normal'
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
