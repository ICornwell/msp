// Load the compiled Rust library as a Node.js native module
const path = require('path');
const addon = require(path.join(__dirname, '../rs/target/release/fp_js.node'));

module.exports = addon;
