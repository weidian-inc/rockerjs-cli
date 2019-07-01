# rocker系列之cli
### 微店登录认证、鉴权模块

#### 安装

    npm i @rockerjs/cli -g

#### 执行
    
    rocker ./start.js -i 2  //启动示例，dev状态下会默认执行tsc -w和watch任务

    rocker log [error] 查看[错误]日志
 
@rockerjs/cli 

##### 参数说明

start [path] 入口文件相对路径

-i [number] 启动实例数,默认启动1个