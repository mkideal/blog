---
layout: post
date: 2018-08-20 22:20:15 +0800
categories: snippet
tags: [gitlab, docker]
title: "gitlab docker script"
notoc: true
---

下面的脚本使用 [gitlab][gitlab] 的 [docker][docker] 镜像构建私有 [gitlab][gitlab] 服务（假设自己的域名为 `expamle.com`）

```sh
#!/bin/bash

function main() {
	local _repo=gitlab/gitlab-ee:latest
	local _name=gitlab
	local _hostname=examle.com

	if [ ! "$(sudo docker ps -q -f name=${_name})" ]; then
		if [ "$(sudo docker ps -aq -f status=exited -f name=${_name})" ]; then
			echo "start docker container ${_name}"
			sudo docker start ${_name}
		else
			echo "run docker container ${_name}"
			sudo docker run --detach \
			    --hostname $_hostname \
			    --env GITLAB_OMNIBUS_CONFIG="external_url 'https://$_hostname/'; gitlab_rails['lfs_enabled'] = true;" \
			    --publish 4430:443 --publish 8000:80 --publish 2222:22 \
			    --name $_name \
			    --restart always \
			    --volume /home/dev/data/gitlab/config:/etc/gitlab \
			    --volume /home/dev/data/gitlab/logs:/var/log/gitlab \
			    --volume /home/dev/data/gitlab/data:/var/opt/gitlab \
			    --env GITLAB_HTTPS=true \
			    $_repo
		fi
	else
		echo "docker container $_name already started!"
	fi
}

main $@
```

然后在 [nginx][nginx] 中配置转发（这里假定 `nginx` 和 `gitlab` 的 `docker` 容器在同一个机器上，所以使用 `127.0.0.1` 的目标地址，如果 `nginx` 在别的机器上，那么 `127.0.0.1` 就需要改成 `gitlab` 的 `docker` 镜像所在及其的地址）

```nginx
server {
    server_name exmale.com;
    location / {
		proxy_pass         https://127.0.0.1:4430;

		proxy_redirect             off;
		proxy_set_header           Host             $host;
		proxy_set_header           X-Real-IP        $remote_addr;
		proxy_set_header           X-Forwarded-For  $proxy_add_x_forwarded_for;
		client_max_body_size       10m;
		client_body_buffer_size    128k;
		proxy_connect_timeout      90;
		proxy_send_timeout         90;
		proxy_read_timeout         90;
		proxy_buffer_size          4k;
		proxy_buffers              64 32k;
		proxy_busy_buffers_size    64k;
		proxy_temp_file_write_size 64k;
    }
}
```

最后参照网站 [https://certbot.eff.org/](https://certbot.eff.org/) 给 `nginx` 配置 `https`

[gitlab]: https://about.gitlab.com/ "GitLab"
[docker]: https://www.docker.com/ "Docker"
[nginx]: https://www.nginx.com/ "Nginx"
