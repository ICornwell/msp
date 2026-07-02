const config ={
    "testEnvironment": "node",
    "setupFilesAfterEnv": ["./js/jest.setup.js"],
    "testMatch": [
      "**/__tests__/**/*.js",
      "**/?(*.)+(spec|test).js"
    ],
    "collectCoverageFrom": [
      "./js/index.js"
    ],
    "testTimeout": 10000
  }

module.exports = config;