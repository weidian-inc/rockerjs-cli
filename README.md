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

    r start [path]

##### 参数说明

start [path] 入口文件相对路径或者.json配置文件

-i [number] 启动实例数,默认启动1个


#### 4.查看日志

    r log [name]

##### 参数说明

[name] 应用名，如果为空则输出所有应用的日志

#### 5.开发编译配置

监听config配置并编译成app.config.d.ts

    r dev

#### 6.查看所有运行的应用程序

    r list

#### 7.关闭应用程序

    r kill [name]

##### 参数说明

[name] 应用名，如果为空则输出所有应用的日志

@rockerjs/cli https://github.com/weidian-inc/rockerjs-cli
