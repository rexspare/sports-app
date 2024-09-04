yarn build
rm ./deploy.zip
zip ./deploy.zip -r * .[^.]* -x "tmp/*" -x "log/*" -x "logs/*" -x ".env" -x "src/*" -x "node_modules/*"
eb deploy --verbose