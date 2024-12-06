FROM nginx:1.18-alpine

# COPY  "cn/build" "/usr/share/nginx/html/build-cn"
COPY  "hk/build" "/usr/share/nginx/html/build-hk"
COPY  ".ci/default.conf" "/etc/nginx/conf.d/default.conf"


