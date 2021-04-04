module.exports = {
    publicPath: process.env.NODE_ENV === 'production'
        ? '/hello-world/'
        : '/',
    devServer: {
        proxy: 'http://localhost:3000'
    },
}