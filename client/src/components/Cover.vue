<template>
    <div class="cover" :id="propName" @click="emit(propName)">
        <img :src="propCover.base" />
        <div class="hover"></div>
    </div>
</template>

<script>

export default {

    props: {
        propCover: {
            type: Object,
        },

        propName: {
            type: String
        },
    },

  data: function () {
    return {};
  },

  
  methods: {
    emit: function (val) {
        this.$emit('albumName', val);
    }
  },
  
};
</script>

<style scoped>

div.cover {
    position: relative;
    width: 184px;
    height: 184px;
}

div.hover {
    position: absolute;
    background-color: rgba(0, 0, 0, 0.0);
    width: 100%;
    height: 100%;
    transition: 0.3s;
}

div.hover:hover {
    background-color: rgba(0, 0, 0, 0.2);
}

div.cover:hover {
    cursor: pointer;
}

img {
    position: absolute;
    width: 184px;
    height: 184px;
}

@media (max-width: 768px) { 

div.cover {
    width: 100px;
    height: 100px;
}

img {
    width: 100px;
    height: 100px;
}

}

</style>