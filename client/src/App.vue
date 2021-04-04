<template>
  <div id="app">
    <div class="left-bar">
      <div @click="getPlaylist" class="playlist">
        <i class="icon-star"></i>
      </div>
    </div>
    <div class="covers">
      <cover @albumName="updateAlbumName" v-for="(imgSrc, index) in img" :key="index" :prop-cover="imgSrc" :prop-name="imgSrc.name"></cover>
    </div>
    <div class="main">
      <h1>{{album.album}}</h1>
        <table>
          <tr>
            <th></th>
            <th>Album:</th>
            <th>Utwór:</th>
            <th>Rozmiar:</th>
          </tr>
          <item @songName="updateSongName" @songAddPlaylist="addSong" @removePlaylist="removeSong" v-for="song in album.files" :key="song.file" :prop-song="song" :prop-current-album="album.album"></item>
        </table>
    </div>
    <div class="bar">

      <div class="progress-bar">
        <div class="progress-background">
          <div class="progress-now"></div>
        </div>
      </div>

      <div class="song-informations">
        <audio id="audio" controls>
          <source :src="audioUrl"
                preload="metadata"
                id="audio_src"
                type="audio/mp3" />
        </audio>

        <div class="current-song">      
          <p>{{songName}}</p>
        </div>

        <div id="controls">
          <i class="icon-to-start" @click="previousSong(songName)"></i>
          <i class="icon-play" @click="playMusic()" id="play"></i>
          <i class="icon-to-end" @click="nextSong(songName)"></i>
        </div>

        <div class="current-time">
          <p v-if='songLength != ""'>
            {{currentTime}} / {{songLength}}
          </p>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
import Cover from "./components/Cover.vue"
import Item from "./components/Item.vue"
export default {

  components: { Item, Cover },

  data: function () {
    return {
      album: "",
      albumName: "",
      songName: "",
      songLength: "",
      currentTime: "",
      audioUrl: "",
      img: [],
      playCounter: 0,
      playlist: "",
      barInterval: ""
    };
  },

  methods: {

    //emits

    updateAlbumName: function (val) {
      this.albumName = val
      this.choseAlbum(this.albumName)
    },

    updateSongName: function (val) {
      if (this.songName != val.file){
        this.playCounter = 0
      }

      this.songName = val.file
      this.getSong(val)
    },

    getPlaylist: async function () {

      new Promise((resolve) => {
        this.album.album = this.playlist.album
        this.albumName = this.playlist.album
        this.album.files = this.playlist.files

        if (this.album.album == this.playlist.album){
          resolve()
        }
      })
      .then(()=>{
        this.activeSong()
      })
    },

    //fetches

    getAlbum: async function () {
     
      const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this.album)
      };
      const response = await fetch("/first", requestOptions);
      const data = await response.json();
      this.album = data;
      this.albumName = this.album.album
      this.getCovers()
      // console.log(JSON.stringify(this.album,undefined,2));
    },

    choseAlbum: function(nameOfAlbum){

      function checkAdult(name) {
          return name == nameOfAlbum;
      }

      let ind = this.album.dirs.findIndex(checkAdult)
      let obj = {index: ind}

      fetch('/next', {
          method: 'POST',
          body: JSON.stringify(obj),
          headers: { 'Content-Type': 'application/json', }
      })
      .then(res => res.json())
      .then(data => this.album = data)
      .then(() =>{
        this.activeSong()
        this.matchIcon()
        // console.log(JSON.stringify(this.album.album,undefined,2));
      })
    },

    getCovers: function () {

      let imgArray = []

      for (let num of this.album.dirs){

        fetch("/"+num, { mode: 'cors' })
          .then(response => response.blob())
          .then(blob => {
            const reader = new FileReader();
            reader.addEventListener("load", function () {
                imgArray.push({
                  name: num,
                  base: reader.result
                })
            });
            reader.readAsDataURL(blob);
        })
      }
      this.img = imgArray
    },

    getSong: function (value) {

      if (this.playCounter == 0) {

        //fetch

        fetch('/updateCurrentAlbum', {
          method: 'POST',
          body: JSON.stringify({album: value.album}),
          headers: { 'Content-Type': 'application/json', }
        })
        .then(res => res.json())
        .then(data =>{

          this.albumName = data.album
          let icons = document.querySelectorAll(".play")
          for(let icon of icons){
            icon.classList.add("hide")
            icon.classList.remove("icon-pause")
            icon.classList.add("icon-play")
          }

          this.audioUrl = "http://localhost:3000/" + value.file

          document.getElementById("audio").load()
          this.activeSong()
          this.playMusic()
        })
        .then(()=>{
          this.getSongLength()
          this.getCurrentSongTime()
        })

      } else {
        this.playMusic()
      }
    },

    addSong: async function (val) {

      if (val != "empty") {
        val.album = this.albumName
      }

      const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(val)
      };

      const response = await fetch("/addToPlaylist", requestOptions)
      const data = await response.json();
      this.playlist = data
    },

    removeSong: async function (val) {

      const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(val)
      };

      const response = await fetch("/removeFromPlaylist", requestOptions)
      const data = await response.json();
      this.playlist = await data
      this.getPlaylist()
    },

    //controls

    playMusic: function() {

      if (this.songName != ""){

        let play = document.getElementById("play")

        if (this.playCounter % 2 == 0) {
          play.setAttribute("class","icon-pause")
          document.getElementById("audio").play()
        } else {
          play.setAttribute("class","icon-play")
          document.getElementById("audio").pause()
        }

        this.playCounter++
        this.matchIcon()
        this.barPosition()
        this.updateBarPosition()
        this.endSong()
      }
    },

    matchIcon: function() {

        for (let song of this.album.files){

          if (song.file == this.songName){

            let itemButton = document.querySelector(".active").children[4].children[0].children[0]
            itemButton.classList.remove("hide")

            if (this.playCounter % 2 == 0){
              itemButton.classList.remove("icon-pause")
              itemButton.classList.add("icon-play")
            } else {
              itemButton.classList.remove("icon-play")
              itemButton.classList.add("icon-pause")
            } 
          }         
        }
    },

    nextSong: function(currentSong) {

      if (this.songName != ""){ 

        let index

        for (let name of this.album.files){
          if (name.file == currentSong) {
            index = this.album.files.indexOf(name)
          }
        }

        if (index != this.album.files.length - 1) {
          let next = this.album.files[index+1]
          this.songName = next.file
          this.playCounter = 0
          this.getSong(next)
        }
      }
    },

    previousSong: function(currentSong) {

      if (this.songName != ""){ 
        let index

        for (let name of this.album.files){
          if (name.file == currentSong) {
            index = this.album.files.indexOf(name)
          }
        }

        if (index != 0) {
          let next = this.album.files[index-1]
          this.songName = next.file
          this.playCounter = 0
          this.getSong(next)
        }
      }
    },

    endSong: function() {
      document.getElementById("audio").onended = () => {
        this.nextSong(this.songName)
      }
    },

    //current song

    activeSong: function(){

      let items = document.getElementsByClassName("item")
      for (let item of items){
        item.classList.remove("active")
      }

      let index 
      for (let name of this.album.files){

        if (name.file == this.songName) {

          index = this.album.files.indexOf(name)
          let activeItem = items[index]
          activeItem.classList.add("active")
        }
      }
    },

    //time of the song

    convertTime: function (time) {

      time = Number(time)
      let m = Math.floor(time % 3600 / 60)
      let s = Math.floor(time % 3600 % 60)
      let mDisplay = m + ""
      let sDisplay = s + ""
      let sString = sDisplay.toString()
      if (sString.length < 2){
        sDisplay = "0" + s
      }

      return mDisplay +":"+ sDisplay

    },

    getSongLength: function () {

      let audio = document.getElementById("audio")
      audio.onloadeddata = () => {
        this.songLength = this.convertTime(audio.duration)
      };
    },

    getCurrentSongTime: function () {

      let audio = document.getElementById("audio")
      audio.ontimeupdate = () => {
        this.currentTime = this.convertTime(audio.currentTime)
      }
      
    },

    //Progress bar 

    barPosition: function () {

      let bar = document.querySelector('.progress-bar')
      let audio = document.getElementById("audio")
      bar.onclick = (e) => {
        let percent = e.clientX / window.innerWidth
        audio.currentTime = audio.duration * percent
      }
    },

    updateBarPosition: function () {

      let progressNow =  document.querySelector('.progress-now')
      let audio = document.getElementById("audio")

      this.barInterval = setInterval(() => {
        let proportion = audio.currentTime / audio.duration
        progressNow.style.width = window.innerWidth * proportion + "px"
      }, 1);
    }

  },

  created() {
    this.getAlbum()
    this.addSong("empty")
  },

};
</script>

<style>

body {
  margin: 0;
  padding: 0;
  font-family: 'Lato', sans-serif;
}

*{
  box-sizing: border-box;
}

div#app {
  display: grid;
  grid-template-columns: 50px 200px auto;
  grid-template-rows: auto 120px;
}

div.left-bar {
  width: 50px;
  height: calc(100vh - 120px);
  grid-column-start: 1;
  grid-column-end: 2;
  grid-row-start: 1;
  grid-row-end: 2;
  background-color: #cccccc;
}

div.playlist {
  width: 50px;
  height: 50px;
  padding-top: 11px;
  padding-right: 1px;
  background-color: #262626;
  text-align: center;
  font-size: 26px;
  color: #eeeeee;
  transition: 0.3s;
}

div.playlist:hover {
  cursor: pointer;
  background-color: #111111;
  color: #cccccc;
}

div.playlist i {
  display: block;
}

div.covers{
  grid-column-start: 2;
  grid-column-end: 3;
  grid-row-start: 1;
  grid-row-end: 2;
  width: 200px;
  height: calc(100vh - 120px);
  background-color: #999999;
  display: block;
  overflow: scroll;
  overflow-x: hidden;
}

div.main{
  grid-column-start: 3;
  grid-column-end: 4;
  grid-row-start: 1;
  grid-row-end: 2;
  width: 100%;
  height: calc(100vh - 120px);
  background-color: #dddddd;
  text-align: center;
  overflow-y: scroll;
}

h1 {
  display: block;
  width: 100%;
  background-color: #222222;
  padding: 20px;
  margin: 0 0 30px 0;
  color: #dddddd;
  letter-spacing: 1px;
  word-spacing: 5px;
}

div.bar {
  grid-column-start: 1;
  grid-column-end: 4;
  grid-row-start: 2;
  grid-row-end: 3;
  width: 100%;
  height: 120px;
  background-color: #222222;
  display: flex;
  flex-direction: column;
}

div.song-informations {
  display: flex;
  justify-content: space-around;
  align-items: center;
  flex-direction: row;
}

div.progress-bar {
  position: relative; 
  width: 100%;
  height: 10px;
}

div.progress-background {
  position: absolute;
  bottom: 0;
  left: 0; 
  width: 100%;
  height: 10px;
  background-color: white;
  transition: 0.3s;
}

div.progress-background:hover {
  height: 25px;
}

div.progress-now {
  width: 0px;
  height: 100%;
  background-color: #437070;
}

div.current-song {
  text-align: center;
  width: 200px;
  font-size: 16px;
  color: white;
  letter-spacing: 0.5px;
  word-spacing: 3px;
}

div.current-time {
  text-align: center;
  width: 200px;
  font-size: 16px;
  color: white;
  letter-spacing: 0.5px;
  word-spacing: 3px;
}

table {
  margin: auto;
  width: 100%;
  border-collapse: collapse;
}

div.bar div#controls {
  width: 250px;
  height: 100px; 
  top: calc(50% - 100px / 2);
  left: calc(50% - 300px / 2);
  display: flex;
  align-items: center;
  justify-content: center;
}

div.bar div#controls i {
  display: block;
  font-size: 36px;
  color: white;
  transition: 0.2s;
}

div.bar div#controls i#play {
  margin: 0 50px;
}

div.bar div#controls i:hover {
  color: #aaaaaa;
}

.hide {
  display: none;
}

audio {
  display: none;
}

@media (max-width: 768px) { 

div#app {
  display: grid;
  grid-template-columns: 25px 100px auto;
  grid-template-rows: auto 120px;
}

div.left-bar {
  width: 25px;
}

div.playlist {
  width: 25px;
  height: 25px;
  padding-top: 1px;
  padding-left: 1px;
  font-size: 16px;
}

div.current-song {
  width: 100px;
  font-size: 8px;
}

div.current-time {
  width: 100px;
  font-size: 8px;
}

div.bar div#controls {
  width: 150px;
  height: 100px; 
}

div.bar div#controls i {
  font-size: 20px;
}

div.bar div#controls i#play {
  margin: 0 25px;
}

h1 {
  font-size: 18px
}
  
}
</style>
