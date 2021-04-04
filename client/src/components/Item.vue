<template>
<tr class="item">
  <td v-if='propCurrentAlbum != "Playlist"' class="add" @click="emitAddPlaylist(propSong)">
    <i class="icon-plus"></i>
  </td>
  <td v-else class="remove" @click="emitRemovePlaylist(propSong)">
    <i class="icon-minus"></i>
  </td>

  <td class="album">{{propSong.album}}</td>
  <td class="song">{{propSong.file}}</td>
  <td class="size">{{getSize()}}MB</td>
  <td id="play-song" @click="emitOnPlay(propSong)">
    <div id="play-button">
      <i class="icon-play play"></i>
    </div>
  </td>
</tr>
</template>

<script>
export default {

    props: {
        propSong: {
            type: Object,
        },

        propCurrentAlbum: {
          type: String,
        }
    },

    data: function () {
      return {
        hover: ""
      };
    },

  methods: {
    getSize: function(){
      let mb = this.propSong.size / (1024*1024)
      mb = Math.round(mb * 100) / 100
      return mb
    },

    emitOnPlay: function (val) {
      this.$emit('songName', val);
    },

    emitAddPlaylist: function (val) {
      this.$emit('songAddPlaylist', val);
    },
    
    emitRemovePlaylist: function (val) {
      this.$emit('removePlaylist', val);
    },
    
  },

};
</script>

<style scoped>

tr {
  width: 100%;
  z-index: 2;
  background-color: transparent;
  transition: 0.2s;
}

tr:hover {
  background-color: rgba(0, 0, 0, 0.1);
}

td {
  z-index: 1;
  font-size: 14px;
  height: 50px;
  padding: 0;
  text-align: center;
  cursor: default;
  background-color: transparent;
  border-top: 1px solid #bababa;
}

td:nth-of-type(1){
    width: 50px;
    text-align: center;
    transition: 0.2s;
}

td.add i {
  pointer-events: none;
}

td:nth-of-type(1):hover {
  cursor: pointer;
  background-color: rgba(0, 0, 0, 0.1);
}

td:nth-of-type(2){
  width: 30%;
}

td:nth-of-type(3){
  width: auto;
}

td:nth-of-type(4){
  width: 30%;
}

td:nth-of-type(5){
  width: 50px;
}

td#play-song {
  height: 50px;
  width: 50px;
  transition: 0.2s;
}

td#play-song:hover {
  background-color: rgba(0, 0, 0, 0.1);
  cursor: pointer;
}

i.icon-play {
  display: none;
}

tr:hover i.icon-play {
  display: inline;
  pointer-events: none;
}

div#play-button {
  width: 50px;
  height: 50px;
  line-height: 50px;
}

.active {
  background-color: #437070;
  color: white;
}

@media (max-width: 960px) {

  td {
    font-size: 10px;
  }

}

@media (max-width: 768px) { 

td#play-song {
  height: 30px;
  width: 30px;
}

div#play-button {
  width: 30px;
  height: 30px;
  line-height: 30px;
}

td:nth-of-type(1){
    width: 30px;
}

i.icon-play {
  display: inline;
}

td {
  height: 30px;
}

tr:hover {
  background-color: #437070;
  color: white;
}

}

@media (max-width: 460px) and (min-width: 320px) {

  td {
    font-size: 8px;
  }

}


</style>