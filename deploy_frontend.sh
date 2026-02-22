#!/bin/bash
cd /home/universe/universe_front
git pull
npm install
npm run build
sudo chown -R universe:www-data dist/
sudo chmod -R 755 dist/
echo "Frontend deployed successfully!"
