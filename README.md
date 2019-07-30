# 简介

#### Rockerjs-cli是为rockerjs-mvc框架量身打造的一个进程管理工具，可以用来创建应用模板，启动和管理nodejs进程，同时也集成查看日志、开发模式下的动态编译config配置

> rockerjs-mvc 默认使用typescript，rockerjs-cli在开发模式下动态编辑config配置成app.config.d.ts，有助于提升开发体验


### 安装

    $ npm i @rockerjs/cli -g

### 使用方法

#### 1.创建应用模板

    r init demo

#### 2.进入应用目录，安装依赖

    cd ./demo
    npm i

#### 3.启动应用进程

    r start index.js

##### 开发环境默认启动了tsc -w

##### 参数说明

start [path] 入口文件相对路径

-i [number] 启动实例数,默认启动1个



#### 4.查看日志

    r log

    r log err  //查看错误日志

#### 5.开发编译配置

    r dev


@rockerjs/cli https://github.com/weidian-inc/rockerjs-cli
