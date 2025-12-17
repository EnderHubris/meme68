#!/bin/bash

ready_build() {
    # move production files
    cp -r /var/www/project/build/* /var/www/meme68
}

# move into project ctx
cd /var/www/project/

# install dependencies
npm install .

# build production files
npm run build && ready_build