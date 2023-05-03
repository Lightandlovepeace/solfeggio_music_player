import React, { createContext } from "react";
import { Text, View, Alert } from "react-native";
import * as MediaLibrary from "expo-media-library";
import { DataProvider } from "recyclerlistview";
import { Audio } from "expo-av";
import { playNext } from "../misc/AudioController";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const AudioContext = createContext();
export class AudioProvider extends Component {
  constructor(props) {
    super(props);
    this.state = {
      audioFiles: [],
      playList: [],
      addToPlayList: null,
      permissionError: false,
      dataProvider: new DataProvider((r1, r2) => r1 !== r2),
      playbackObj: null,
      soundObj: null,
      currentAudio: {},
      isPlaying: false,
      isPlayListRunning: false,
      activePlayList: [],
      currentAudioIndex: null,
      playbackPosition: null,
      playbackDuration: null,
      rate: 3,
      //keyWordState: '', //set a state for the keyWord inside search-bar 
    };
    // this.totalAudioCount = 0;
    // this.setKeyword = this.setKeyword.bind(this); //bind the function to the this context of the outside class
  }

  // setKeyword() {
  //   this.setState({
  //     keyWordState: global.keyword
  //   });
  // }

  permissionAlert = () => {
    Alert.alert("Permission Required", "This app needs to read audio files", [
      { text: "I am ready", onPress: () => this.getPermission() },
      {
        text: "cancel",
        onPress: () => this.permissionAlert(),
      },
    ]);
  };

  getAudioFiles = async () => {
    const { dataProvider, audioFiles } = this.state;
    let media = await MediaLibrary.getAssetsAsync({
      mediaType: "audio",
    });
    media = await MediaLibrary.getAssetsAsync({
      mediaType: "audio",
      first: media.totalCount,
    });

    //the search method here:
    try {
      const mediaArray = media.assets;
      console.log("keyword from witin AudioProvider: " + global.keyword);
      var searchMediaArray = mediaArray.filter((post) =>
        post.filename.toLowerCase().includes(global.keyword.toLowerCase())
      );
      //console.log(searchMediaArray);
    } catch (error) {
      console.log(
        `error inside AudioProvider->getAudioFiles filter function : ${error}`
      );
    }

    //  const mediaArray = [media.assets];
    //  console.log('beginnn')
    //   console.log(media.assets);
    //     const searchMediaArray = mediaArray.filter((post) =>
    //       post.filename.toLowerCase().includes(global.searchTerm.toLowerCase())
    //     );
    //media = searchMedia;

    this.totalAudioCount = media.totalCount;

    this.setState({
      ...this.state,
      dataProvider: dataProvider.cloneWithRows([
        ...audioFiles,
        ...searchMediaArray,
      ]),
      audioFiles: [...audioFiles, ...searchMediaArray],
    });
  };

  loadPreviousAudio = async () => {
    let previousAudio = await AsyncStorage.getItem("previousAudio");
    let currentAudio;
    let currentAudioIndex;

    if (previousAudio === null) {
      currentAudio = this.state.audioFiles[0];
      currentAudioIndex = 0;
    } else {
      previousAudio = JSON.parse(previousAudio);
      currentAudio = previousAudio.audio;
      currentAudioIndex = previousAudio.index;
    }
    this.setState({ ...this.state, currentAudio, currentAudioIndex });
  };

  getPermission = async () => {
    //    {
    //    "canAskAgain": true,
    //    "expires": "never",
    //    "granted": false,
    //    "status": "undetermined",
    //    }
    const permission = await MediaLibrary.getPermissionsAsync();
    if (permission.granted) {
      this.getAudioFiles();
    }
    if (!permission.canAskAgain && !permission.granted) {
      this.setState({ ...this.state, permissionError: true });
    }

    if (!permission.granted && permission.canAskAgain) {
      const { status, canAskAgain } =
        await MediaLibrary.requestPermissionsAsync();
      if (status === "denied" && canAskAgain) {
        this.permissionAlert();
      }

      if (status === "granted") {
        this.getAudioFiles();
      }

      if (status === "denied" && !canAskAgain) {
        this.setState({ ...this.state, permissionError: true });
      }
    }
  };

  onPlaybackStatusUpdate = async (playbackStatus) => {
    //console.log(global.PlayRate);
    if (playbackStatus.isLoaded && playbackStatus.isPlaying) {
      this.updateState(this, {
        playbackPosition: playbackStatus.positionMillis,
        playbackDuration: playbackStatus.durationMillis,
      });
    }

    if (playbackStatus.isLoaded && !playbackStatus.isPlaying) {
      storeAudioForNextOpening(
        this.state.currentAudio,
        this.state.currentAudioIndex,
        playbackStatus.positionMillis
      );
    }

    if (playbackStatus.didJustFinish) {
      if (this.state.isPlayListRunning) {
        let audio;
        const indexOnPlayList = this.state.activePlayList.audios.findIndex(
          ({ id }) => id === this.state.currentAudio.id
        );
        const nextIndex = indexOnPlayList + 1;
        audio = this.state.activePlayList.audios[nextIndex];

        if (!audio) audio = this.state.activePlayList.audios[0];

        const indexOnAllList = this.state.audioFiles.findIndex(
          ({ id }) => id === audio.id
        );

        const status = await playNext(this.state.playbackObj, audio.uri);
        return this.updateState(this, {
          soundObj: status,
          isPlaying: true,
          currentAudio: audio,
          currentAudioIndex: indexOnAllList,
        });
      }
      const nextAudioIndex = this.state.currentAudioIndex + 1;
      if (nextAudioIndex >= this.totalAudioCount) {
        this.state.playbackObj.unloadAsync();
        this.updateState(this, {
          soundObj: null,
          currentAudio: this.state.audioFiles[0],
          isPlaying: false,
          currentAudioIndex: 0,
          playbackPosition: null,
          playbackDuration: null,
        });
        return await storeAudioForNextOpening(this.state.audioFiles[0], 0);
      }

      //otherwise, select the next audio
      const audio = this.state.audioFiles[nextAudioIndex];

      const status = await playNext(this.state.playbackObj, audio.uri);
      this.updateState(this, {
        soundObj: status,
        currentAudio: audio,
        isPlaying: true,
        currentAudioIndex: nextAudioIndex,
      });
      await storeAudioForNextOpening(audio, nextAudioIndex);
    }
  };

  componentDidMount() {
    this.getPermission();
    if (this.state.playbackObj === null) {
      this.setState({ ...this.state, playbackObj: new Audio.Sound() });
    }
  }

  updateState = (prevState, newState = {}) => {
    this.setState({ ...prevState, ...newState });
  };

  render() {
    // const sumeone = this.props.optionModalVisible;
    // console.log(sumeone);
    const {
      audioFiles,
      dataProvider,
      playList,
      addToPlayList,
      permissionError,
      playbackObj,
      soundObj,
      currentAudio,
      isPlaying,
      currentAudioIndex,
      playbackPosition,
      playbackDuration,
      rate,
      isPlayListRunning,
      activePlayList,
    } = this.state;
    if (permissionError)
      return (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text>It looks like you haven't accepted the permission</Text>
        </View>
      );
    return (
      <AudioContext.Provider
        value={{
          audioFiles,
          dataProvider,
          playList,
          addToPlayList,
          playbackObj,
          soundObj,
          currentAudio,
          isPlaying,
          currentAudioIndex,
          totalAudioCount: this.totalAudioCount,
          playbackPosition,
          playbackDuration,
          isPlayListRunning,
          activePlayList,
          rate,
          updateState: this.updateState,
          loadPreviousAudio: this.loadPreviousAudio,
          onPlaybackStatusUpdate: this.onPlaybackStatusUpdate,
        }}
      >
        {this.props.children}
      </AudioContext.Provider>
    );
  }
}

import { Component } from "react";
import { storeAudioForNextOpening } from "../misc/helper";

export default AudioProvider;
