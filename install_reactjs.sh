#!/bin/bash
mkdir -p conf/ dist/htdocs/api/classes src/js src/css src/scss
touch INSTALL TODO CHANGELOG UPGRADE
npm init
npm install -D npm-run-all
#npm install -g html-minifier
touch conf/html-minifier.conf
npm install -D @babel/core @babel/cli @babel/preset-env @babel/preset-react
touch .babelrc
npm install -D webpack webpack-cli style-loader css-loader sass-loader node-sass babel-loader mini-css-extract-plugin 
npm install react react-dom react-query react-router-dom
npm install -D lodash-webpack-plugin babel-plugin-lodash
npm install lodash
npm install bootstrap react-bootstrap
#npm install @fortawesome/react-fontawesome @fortawesome/fontawesome-svg-core @fortawesome/free-regular-svg-icons @fortawesome/react-fontawesome @fortawesome/free-solid-svg-icons
