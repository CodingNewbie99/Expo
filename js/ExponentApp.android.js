/**
 * Copyright 2015-present 650 Industries. All rights reserved.
 *
 * @providesModule ExponentApp
 * @flow
 */
'use strict';

import React, { PropTypes } from 'react';
import ReactNative, {
  Dimensions,
  Image,
  Linking,
  NativeModules,
  ScrollView,
  StyleSheet,
  Keyboard,
  TouchableOpacity,
  Text,
  TextInput,
  View,
  RCTLog,
} from 'react-native';
import { connect } from 'react-redux';
import UrlHandler from 'react-native-url-handler';
import ResponsiveImage from '@exponent/react-native-responsive-image';
import TouchableNativeFeedbackSafe from '@exponent/react-native-touchable-native-feedback-safe';

import autobind from 'autobind-decorator';
import { bindActionCreators } from 'redux';

import BrowserActions from 'BrowserActions';
import ExColors from 'ExColors';
import ExLayout from 'ExLayout';
import ExUrls from 'ExUrls';
import ExperienceCollection from 'ExperienceCollection';
import FeaturedExperiences from 'FeaturedExperiences';
import NuxFirstExperienceOverlay from 'NuxFirstExperienceOverlay';

const {
  ExponentConstants,
  ExponentKernel,
} = NativeModules;

let deviceHeight = Dimensions.get('window').height;
let deviceMinusHeaderHeight = deviceHeight - ExLayout.headerHeight;
const AutoFillUrl = '';

class InputAccessoryButton extends React.Component {

  render() {
    return (
      <TouchableOpacity
        style={styles.inputAccessoryButton}
        onPress={this.props.onPress}>
        <Text style={styles.inputAccessoryButtonText}>
          {this.props.title}
        </Text>
      </TouchableOpacity>
    );
  }

}

class ExponentApp extends React.Component {
  static NUX_HAS_FINISHED_FIRST_RUN = 'nuxHasFinishedFirstRun';

  static propTypes = {
    exp: PropTypes.object,
  };

  static getDataProps(data) {
    return {
      history: data.browser.history,
    };
  }

  static getDispatchActions(dispatch) {
    return {
      browserActions: bindActionCreators(BrowserActions, dispatch),
    };
  }

  constructor(props, context) {
    super(props, context);

    FeaturedExperiences.setReferrer(this.props.exp.referrer);

    this.state = {
      keyboardHeight: 0,
      urlBarIsFocused: false,
      settingsUrl: '',
      urlSubmitButtonStyle: styles.urlBarSubmitButton,
      isShowingNux: false,
      nuxTooltipFrame: null,
    };
  }

  async componentDidMount() {
    this._keyboardDidShowSubscription = Keyboard.addListener('keyboardDidShow', (e) => {
      this.setState({keyboardHeight: e.endCoordinates.height});
    });

    this._keyboardDidHideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      this.setState({keyboardHeight: 0});
      TextInput.State.blurTextInput(TextInput.State.currentlyFocusedField());
    });

    let isFirstRunFinished = this.props.exp.nuxHasFinishedFirstRun;
    if (!isFirstRunFinished) {
      requestAnimationFrame(() => {
        this.setState({
          isShowingNux: true,
        }, () => {
          requestAnimationFrame(this._scrollPastUrlBar);
        });
      });
    }

    requestAnimationFrame(this._scrollPastUrlBar);
  }

  _scrollPastUrlBar = () => {
    this._scrollView.scrollTo({ y: ExLayout.navigationBarHeight + 4, x: 0, animated: false });
  }

  componentWillUnmount() {
    this._keyboardDidShowSubscription.remove();
    this._keyboardDidHideSubscription.remove();
  }

  render() {
    return (
      <View style={styles.container} ref={component => this._rootView = component}>
        {this._renderTitleBar()}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContentContainer}
          showsVerticalScrollIndicator={false}
          ref={view => { this._scrollView = view; }}
          keyboardShouldPersistTaps>
          {this._renderNuxSpacer()}
          {this._renderRecentSection()}
          {this._renderFeaturedSection()}
          {this._renderOverlay()}
          {this._renderURLBar()}
        </ScrollView>
        {this._renderNux()}
        {this._renderInputAccessory()}
      </View>
    );
  }

  _renderInputAccessory = () => {
    if (this.state.keyboardHeight === 0 || !this.state.urlBarIsFocused) {
      return;
    }

    return (
      <View style={[styles.inputAccessory, {bottom: this.state.keyboardHeight}]}>
        <InputAccessoryButton
          title="exp.host/@"
          onPress={this._addExpHostToTitle}
        />

        <InputAccessoryButton
          title=".exp.direct:80"
          onPress={this._addExpDirectToTitle}
        />
      </View>
    );
  }

  _addExpHostToTitle = () => {
    const text = 'exp.host/@';

    if (!this.state.settingsUrl) {
      this.setState({settingsUrl: text});
    } else {
      this.setState({settingsUrl: text + this.state.settingsUrl});
    }
  }

  _addExpDirectToTitle = () => {
    const text = '.exp.direct:80';
    if (!this.state.settingsUrl) {
      this.setState({settingsUrl: text});
    } else {
      this.setState({settingsUrl: this.state.settingsUrl + text});
    }
  }

  _renderOverlay() {
    if (this.state.urlBarIsFocused) {
      return (
        <View style={[StyleSheet.absoluteFill, {backgroundColor: 'rgba(0,0,0,0.5)'}]} />
      );
    }
  }

  _renderTitleBar() {
    return (
      <View style={styles.titleBar}>
        <ResponsiveImage
          sources={{
            2: { uri: 'https://s3.amazonaws.com/exp-us-standard/ios-home-header-logo@2x.png' },
            3: { uri: 'https://s3.amazonaws.com/exp-us-standard/ios-home-header-logo@3x.png' },
          }}
          style={styles.titleBarLogo}
        />
        <View>
          <ResponsiveImage
            sources={{
              2: { uri: 'https://s3.amazonaws.com/exp-us-standard/ios-home-header-wordmark@2x.png' },
              3: { uri: 'https://s3.amazonaws.com/exp-us-standard/ios-home-header-wordmark@3x.png' },
            }}
            style={styles.titleBarWordmark}
          />
        </View>
      </View>
    );
  }

  _handleFocus = () => {
    if (!this.state.settingsUrl) {
      this.setState({settingsUrl: AutoFillUrl, urlBarIsFocused: true});
      requestAnimationFrame(() => {
        this._scrollView.scrollTo({ y: 0, x: 0, animated: true });
      });
    } else {
      this.setState({urlBarIsFocused: true});
    }
  }

  _handleBlur = () => {
    if (this.state.settingsUrl === AutoFillUrl) {
      this.setState({settingsUrl: '', urlBarIsFocused: false});
    } else {
      this.setState({urlBarIsFocused: false});
    }
  }

  _renderURLBar() {
    let clearButton;
    let { urlBarIsFocused, settingsUrl } = this.state;

    if (urlBarIsFocused) {
      let isEmpty = settingsUrl === AutoFillUrl;
      clearButton = (
        <TouchableNativeFeedbackSafe
          testID="clear_button"
          hitSlop={{left: 10, top: 10, right: 10, bottom: 10}}
          style={[styles.urlBarClearButtonContainer, isEmpty ? {opacity: 0.5} : {}]}
          onPress={this._onClearUrlBar}>
          <Text style={styles.urlBarClearButtonText}>
            X
          </Text>
        </TouchableNativeFeedbackSafe>
      );
    }

    return (
      <View style={[styles.urlBarContainer, urlBarIsFocused ? {opacity: 1} : {opacity: 0.5}]}>
        <TextInput
          testID="url_bar"
          value={settingsUrl}
          onChangeText={text => this._updateUrlBarState(text)}
          onSubmitEditing={this._onSubmitUrlBar}
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
          enablesReturnKeyAutomatically
          returnKeyType="go"
          onFocus={this._handleFocus}
          onBlur={this._handleBlur}
          placeholder={`Enter an experience URL`}
          placeholderTextColor="#888"
          underlineColorAndroid="transparent"
          style={styles.urlBarTextInput}
        />
        {clearButton}
      </View>
    );
  }

  _onClearUrlBar = () => {
    this.setState({settingsUrl: AutoFillUrl});
  }

  _renderNuxSpacer() {
    // if we're showing the nux, render some space
    // underneath the nux featured experiences row.
    if (!this.state.isShowingNux) {
      return;
    }
    return (
      <View ref={this._measureNux} style={styles.nuxSpacer} />
    );
  }

  _renderRecentSection() {
    if (this.props.history.size === 0) {
      return null;
    }

    let actionLabel = 'Clear';
    let experiences = (this.props.history) ? this.props.history.toArray() : [];

    return (
      <ExperienceCollection
        experiences={experiences}
        headingLabel="Recent"
        headingStyle={{marginTop: 0}}
        actionLabel={actionLabel}
        onPressItem={(experience) => this._onPressLink(experience.url)}
        onPressHeading={this._onPressRecentHeading}
      />
    );
  }

  _renderFeaturedSection() {
    return (
      <ExperienceCollection
        experiences={this._getFeaturedExperiences()}
        headingLabel="Featured"
        headingStyle={{marginBottom: 0}}
        onPressItem={(experience) => this._onPressLink(experience.url)}
      />
    );
  }

  _renderNux() {
    if (!this.state.isShowingNux) {
      return null;
    }
    return (
      <NuxFirstExperienceOverlay
        referrer={this.props.exp.referrer}
        firstExperienceFrame={this.state.nuxTooltipFrame}
        onPressExperience={this._onPressNuxIcon}
      />
    );
  }

  @autobind
  async _onPressNuxIcon(experience) {
    this.setState(() => ({
        isShowingNux: false,
    }));

    this._onPressLink(experience.url);
  }

  _measureNux = (view) => {
    // needed to correctly position the nux tooltip.
    if (view) {
      requestAnimationFrame(() => {
        view.measureLayout(
          ReactNative.findNodeHandle(this._rootView), (x, y, width, height) => {
            // account for initial scroll position with URL bar.
            y -= ExLayout.navigationBarHeight;
            this.setState((state) => ({
              nuxTooltipFrame: { x, y, width, height },
            }));
        });
      });
    }
  }

  _onPressLink = (url) => {
    Linking.openURL(url);
  }

  _onPressRecentHeading = () => {
    this.props.browserActions.clearHistoryAsync();
  }

  async _onPressCreateShortcut(url, manifest, bundleUrl) {
    await ExponentKernel.createShortcutAsync(url, manifest, bundleUrl);
  }

  _onSubmitUrlBar = () => {
    let { settingsUrl } = this.state;
    if (settingsUrl.toLowerCase() === 'dev menu') {
      ExponentKernel.addDevMenu();
    } else if (settingsUrl.length > 0) {
      let expUrl = ExUrls.normalizeUrl(settingsUrl);
      Linking.openURL(expUrl);
    }
  }

  _updateUrlBarState = (text) => {
    this.setState({
      settingsUrl: text,
    });
  }

  _getFeaturedExperiences() {
    return FeaturedExperiences.getFeatured();
  }
}

export default connect(
  data => ExponentApp.getDataProps(data),
  dispatch => ExponentApp.getDispatchActions(dispatch),
)(ExponentApp);

let styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleBar: {
    elevation: 3,
    paddingTop: ExponentConstants.statusBarHeight + 15,
    paddingBottom: 15,
    paddingLeft: 15,
    flexDirection: 'row',
    backgroundColor: ExColors.exponentBlue,
  },
  titleBarLogo: {
    width: 19.5,
    height: 17,
    marginTop: 4,
    marginRight: 12,
  },
  titleBarWordmark: {
    width: 92,
    height: 20,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContentContainer: {
    backgroundColor: '#fff',
    paddingTop: 60,
  },
  urlBarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    elevation: 2,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: '#fff',
  },
  urlBarTextInput: {
    paddingLeft: 15,
    paddingRight: 55,
    fontSize: 16,
    flex: 1,
    height: 58,
    backgroundColor: '#fff',
  },
  urlBarClearButtonContainer: {
    position: 'absolute',
    right: 15,
    top: 20,
    height: 20,
    width: 20,
    backgroundColor: '#504747',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  urlBarClearButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  urlBarSubmitButton: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    height: 40,
    flex: 1,
    overflow: 'hidden',
    borderRadius: 20,
    backgroundColor: '#bbbbbb',
  },
  urlBarSubmitButtonEnabled: {
    backgroundColor: ExColors.navy,
  },
  urlClearSubmitButtonText: {
    color: 'white',
  },
  nuxSpacer: {
    height: 140,
  },
  inputAccessory: {
    flexDirection: 'row',
    backgroundColor: '#eee',
    padding: 10,
    position: 'absolute',
    left: 0,
    right: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.2)',
  },
  inputAccessoryButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  inputAccessoryButtonText: {
    color: 'rgba(0,0,0,0.7)',
    fontSize: 15,
  },
});
