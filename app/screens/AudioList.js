import React, { Component, useState } from "react";
import { View, StyleSheet, Text, Dimensions, TextInput, Button } from "react-native";
import AudioProvider, { AudioContext } from "../context/AudioProvider";

import { DataProvider, LayoutProvider } from "recyclerlistview";
import { RecyclerListView } from "recyclerlistview";
import AudioListItem from "../components/AudioListItem";
import OptionModal from "../components/OptionModal";
import { selectAudio } from "../misc/AudioController";
//import { PlayRate } from "./Settings";
import "./Settings";

//console.log(global.PlayRate);

global.keyword = "";

export class AudioList extends Component {
  static contextType = AudioContext;
  //set state for keyword grabbing
  stateKeyword = { sampleState: "" };

  constructor(props) {
    super(props);
    this.state = {
      optionModalVisible: false,
      //keyWordState: "", //set a state for the keyWord inside search-bar
    };
    this.currentItem = {};
    this.totalAudioCount = 0;
    //this.setKeyword = this.setKeyword.bind(this); //bind the function to the this context of the outside class
  }
  //https://stackoverflow.com/questions/38689648/react-how-to-pass-state-to-another-component
  // setKeyword() {
  //   this.setState({
  //     keyWordState: global.keyword,
  //   });
  // }

  dataProvider = new DataProvider((r1, r2) => {
    return r1 !== r2;
  });

  layoutProvider = new LayoutProvider(
    (i) => "audio",
    (type, dim) => {
      dim.width = Dimensions.get("window").width;
      dim.height = 69;
    }
  );

  // onPlaybackStatusUpdate = async (playbackStatus) => {
  //   console.log("hier");
  //   if (playbackStatus.isLoaded && playbackStatus.isPlaying) {
  //     this.context.updateState(this.context, {
  //       playbackPosition: playbackStatus.positionMillis,
  //       playbackDuration: playbackStatus.durationMillis,
  //     });
  //   }
  //
  //   if (playbackStatus.didJustFinish) {
  //      const nextAudioIndex = this.context.currentAudioIndex + 1;
  //     if (nextAudioIndex >= this.context.totalAudioCount) {
  //        this.context.playbackObj.unloadAsync();
  //        return this.context.updateState(this.context, {
  //          soundObj: null,
  //          currentAudio: this.context.audioFiles[0],
  //          isPlaying: false,
  //          currentAudioIndex: 0,
  //          playbackPosition: null,
  //          playbackDuration: null,
  //        });
  //      }
  //      const audio = this.context.audioFiles[nextAudioIndex];
  //      const status = await playNext(this.context.playbackObj, audio.uri);
  //      this.context.updateState(this.context, {
  //        soundObj: status,
  //        currentAudio: audio,
  //       isPlaying: true,
  //        currentAudioIndex: nextAudioIndex,
  //      });
  //    }
  //  };

  handleAudioPress = async (audio) => {
    await selectAudio(audio, this.context);
  };

  componentDidMount() {
    //this.context.loadPreviousAudio() (not needed to load previous audio here)
  }

  rowRenderer = (type, item, index, extendedState) => {
    return (
      <AudioListItem
        title={item.filename}
        isPlaying={extendedState.isPlaying}
        activeListItem={this.context.currentAudioIndex === index}
        duration={item.duration}
        onAudioPress={() => this.handleAudioPress(item)}
        onOptionPress={() => {
          this.currentItem = item;
          this.setState({ ...this.state, optionModalVisible: true });
        }}
      />
    );
  };

  navigateToPlaylist = () => {
    //
    console.log("navigate");
    this.context.updateState(this.context, {
      addToPlayList: this.currentItem,
    });
    this.props.navigation.navigate("Playlist");
  };

  // addToQueue = () => {

  // }

  render() {
    //setting up the 'hook'-setState:
    const { stateKeyword } = this;
    const setState = (stateKeyword) => this.setState(stateKeyword);
    if (global.Hz === undefined) {
      global.Hz = 440;
    }
    return (
      <>
        <View style={styles.viewStyle}>
          <Text style={{ fontWeight: "bold", fontSize: 24 }}>
            {global.Hz} Hz mode
          </Text>
        </View>
        {/* <TextInput
          value={stateKeyword}
          onChangeText={(value) => {
            setState({ sampleState: value });
            global.keyword = value;
            console.log(global.keyword);
          }}
          style={{
            backgroundColor: "#fff",
            padding: 10,
            margin: 10,
            borderRadius: 5,
          }}
        /> */}
        <AudioContext.Consumer>
          {({ dataProvider, isPlaying }) => {
            if (!dataProvider._data.length) return null;
            return (
              <View style={{ minHeight: 1, minWidth: 1, flex: 1 }}>
                {dataProvider && dataProvider.getSize() > 0 && (
                  <RecyclerListView
                    dataProvider={dataProvider}
                    layoutProvider={this.layoutProvider}
                    rowRenderer={this.rowRenderer}
                    extendedState={{ isPlaying }}
                  />
                )}
                <OptionModal
                  // onPlayPress={() => console.log("play")}
                  // onPlaylistPress={() => {
                  //   this.context.updateState(this.context, {
                  //     addToPlayList: this.currentItem,
                  //   });
                  //   this.props.navigation.navigate("Playlist");
                  // }}
                  options={[
                    {
                      title: "Add to playlist",
                      onPress: this.navigateToPlaylist,
                    } /* , {title: 'Add to qeue', onPress: console.log("yes")}*/,
                  ]}
                  currentItem={this.currentItem}
                  onClose={() =>
                    this.setState({ ...this.state, optionModalVisible: false })
                  }
                  visible={this.state.optionModalVisible}
                />
              </View>
            );
          }}
        </AudioContext.Consumer>
      </>
    );
  }
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  viewStyle: {
    alignItems: "center",
    paddingLeft: 20,
    paddingBottom: 10,
  },
});

export default AudioList;
