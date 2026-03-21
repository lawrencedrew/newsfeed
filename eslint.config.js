const js = require("@eslint/js");

module.exports = [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "commonjs",
            globals: {
                console: "readonly",
                process: "readonly",
                module: "readonly",
                require: "readonly",
                setTimeout: "readonly",
                setInterval: "readonly",
                Buffer: "readonly",
                __dirname: "readonly",
                __filename: "readonly",
                URL: "readonly",
                Date: "readonly",
                Promise: "readonly",
                JSON: "readonly",
                fetch: "readonly"
            }
        },
        rules: {
            "no-unused-vars": "warn",
            "no-console": "off",
            "no-empty": "warn"
        }
    },
    {
        files: ["app/tui/**/*.js"],
        languageOptions: {
            globals: {
                document: "readonly",
                window: "readonly",
                EventSource: "readonly",
                fetch: "readonly",
                console: "readonly",
                setTimeout: "readonly",
                setInterval: "readonly"
            }
        }
    }
];
