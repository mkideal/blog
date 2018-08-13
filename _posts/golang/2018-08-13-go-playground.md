---
layout: post
date: 2018-08-13 16:18:16 +0800
categories: golang
tags: [go, playground]
title: "还在愁 play.golang.org 不能用？赶快建立自己的 playground"
---

## 摘要

[play.golang.org][play-golang-org] 是一个用于在线执行 `go` 语言程序的网站，但是由于一些网络原因导致内地开发者无法使用这个服务。本文介绍 2 种方法搭建自己的 `go-playground`。

---

## 方法一: 准备一台自己可以访问的 _香港_ 机器

首先需要准备一台机器，这台机器可以被内地访问，同时也可以访问到 [play.golang.org][play-golang-org]。比如买国内的云厂商提供的香港机房的机器。买好机器后，安装 [nginx][nginx]，然后在 `nginx` 的配置文件目录 `/etc/nginx/conf.d/` 中新增一个配置文件 `go-playground.conf`，文件内容如下

```
server {
	listen 80; # 端口可以换成其他的

	# 可以配置一个域名，修改 www.examle.com 然后取消下面这行的注释
	#server_name www.examle.com;

	location / {
		proxy_pass         https://play.golang.org;
		
		proxy_redirect     off;
		proxy_set_header   Host             play.golang.org;
		proxy_set_header   X-Real-IP        $remote_addr;
		proxy_set_header   X-Forwarded-For  $proxy_add_x_forwarded_for;
	}
}
```

然后启动 `nginx`，或重启 `nginx`，或执行 `nginx -s reload` 或 `sudo nginx -s reload`

现在可以通过 `http://IP` 访问自己的 `playground` 网站了。**注意**: 如果 `server_name` 配置了自己的域名，则需要使用域名来访问。

---

## 方法二: 准备一台自己可以访问的 _任意_ 机器

这里准备的机器不再要求可以访问到 [play.golang.org][play-golang-org] 了，只要自己能访问就行。比如可以购买国内云厂商提供的内地机房的机器。

### 安装 docker

购买好机器以后需要先安装 [docker][docker]，安装方法请参照 [docker][docker] 官网说明，这里就不细讲这个了。

### 构建 docker 镜像

`clone` 代码（需要先安装 [git][git]）并构建 [docker][docker] 镜像

```
git clone https://github.com/golang/playground
cd playground
sudo docker build -t playground .
```

构建 [docker][docker] 镜像比较耗时，也和机器的网络速度有关，请耐心等待。

### 启动 docker 容器

[docker][docker] 镜像构建完成后，在机器上创建一个脚本文件 `start-palyground.sh`，内容如下

```sh
#!/bin/bash

function main() {
	local _repo=playground
	local _name=playground

	if [ ! "$(sudo docker ps -q -f name=${_name})" ]; then
		if [ "$(sudo docker ps -aq -f status=exited -f name=${_name})" ]; then
			echo "start docker container ${_name}"
			sudo docker start ${_name}
		else
			echo "run docker container ${_name}"
			sudo docker run --name $_name --rm -d \
				-p 8080:8080 \
				$_repo
		fi
	else
		echo "docker container playground already started!"
	fi
}

main $@
```

然后执行脚本

```sh
chmod +x start-playground.sh
./start-playground.sh
```

如果到这一步成功了，请检查一下 `8080` 端口是否正常监听

```sh
netstat -ln | grep 8080
```

**注意**: 如果不想使用 `8080` 端口，比如想用 `8000` 端口，则将脚本中的 `-p 8080:8080` 改为 `-p 8000:8080`

### 配置 nginx

[docker][docker] 容器启动成功后需要安装并配置 [nginx][nginx]，和方法一的配置文件稍有不同

```
server {
	listen 80; # 端口可以换成其他的

	# 可以配置一个域名，修改 www.examle.com 然后取消下面这行的注释
	#server_name www.examle.com;

	location / {
		proxy_pass         http://127.0.0.1:8080;
		
		proxy_redirect     off;
		proxy_set_header   Host             $host;
		proxy_set_header   X-Real-IP        $remote_addr;
		proxy_set_header   X-Forwarded-For  $proxy_add_x_forwarded_for;
	}
}
```

配好 `nginx` 之后，剩下的和方法一相同了。

---

## 总结

本文介绍了 2 种方法构建自己的 `go-playground` 平台。其中方法一仅仅只是做了一下代理，实际上还是用的 [play.golang.org][play-golang-org] 的服务；而方法二则是自己运行了一个 `playground` 的服务。

本文作者使用方法一构建了一个 `go-playground`，地址为 [https://play.gopherd.com](https://play.gopherd.com/)（请使用浏览器打开）。

[go]: https://golang.org/ "Golang"
[nginx]: https://www.nginx.com/ "Nginx"
[docker]: https://www.docker.com/ "Docker"
[git]: https://git-scm.com/ "Git"
[play-golang-org]: https://play.golang.org/ "play.golang.org"
