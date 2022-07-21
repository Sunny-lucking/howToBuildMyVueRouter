# 手写vue-router核心原理
@[toc]
## 一、核心原理
### 1.什么是前端路由？
在 Web 前端单页应用 SPA(Single Page Application)中，路由描述的是 URL 与 UI 之间的映射关系，这种映射是单向的，即 URL 变化引起 UI 更新（无需刷新页面）。
### 2.如何实现前端路由？
要实现前端路由，需要解决两个核心：

1. 如何改变 URL 却不引起页面刷新？

2. 如何检测 URL 变化了？

下面分别使用 hash 和 history 两种实现方式回答上面的两个核心问题。
##### hash 实现

hash 是 URL 中 hash (#) 及后面的那部分，常用作锚点在页面内进行导航，**改变 URL 中的 hash 部分不会引起页面刷新**


通过 hashchange 事件监听 URL 的变化，改变 URL 的方式只有这几种：
1. 通过浏览器前进后退改变 URL
2. 通过`<a>`标签改变 URL
3. 通过window.location改变URL
  
##### history 实现

history 提供了 pushState 和 replaceState 两个方法，**这两个方法改变 URL 的 path 部分不会引起页面刷新**

history 提供类似 hashchange 事件的 popstate 事件，但 popstate 事件有些不同：
1. 通过浏览器前进后退改变 URL 时会触发 popstate 事件
2. 通过pushState/replaceState或`<a>`标签改变 URL 不会触发 popstate 事件。
3. 好在我们可以拦截 pushState/replaceState的调用和`<a>`标签的点击事件来检测 URL 变化
4. 通过js 调用history的back，go，forward方法课触发该事件

所以监听 URL 变化可以实现，只是没有 hashchange 那么方便。

## 二、原生js实现前端路由
### 1.基于 hash 实现
html
```html
<!DOCTYPE html>
<html lang="en">
<body>
<ul>
    <ul>
        <!-- 定义路由 -->
        <li><a href="#/home">home</a></li>
        <li><a href="#/about">about</a></li>

        <!-- 渲染路由对应的 UI -->
        <div id="routeView"></div>
    </ul>
</ul>
</body>
<script>
    let routerView = routeView
    window.addEventListener('hashchange', ()=>{
        let hash = location.hash;
        routerView.innerHTML = hash
    })
    window.addEventListener('DOMContentLoaded', ()=>{
        if(!location.hash){//如果不存在hash值，那么重定向到#/
            location.hash="/"
        }else{//如果存在hash值，那就渲染对应UI
            let hash = location.hash;
            routerView.innerHTML = hash
        }
    })
</script>
</html>


```

解释下上面代码，其实很简单：
1. 我们通过a标签的href属性来改变URL的hash值（当然，你触发浏览器的前进后退按钮也可以，或者在控制台输入window.location赋值来改变hash）
2. 我们监听**hashchange**事件。一旦事件触发，就改变**routerView**的内容，若是在vue中，这改变的应当是**router-view**这个组件的内容
3. 为何又监听了load事件？这时应为页面第一次加载完不会触发 hashchange，因而用load事件来监听hash值，再将视图渲染成对应的内容。
### 2.基于 history 实现

```html
<!DOCTYPE html>
<html lang="en">
<body>
<ul>
    <ul>
        <li><a href='/home'>home</a></li>
        <li><a href='/about'>about</a></li>

        <div id="routeView"></div>
    </ul>
</ul>
</body>
<script>
    let routerView = routeView
    window.addEventListener('DOMContentLoaded', onLoad)
    window.addEventListener('popstate', ()=>{
        routerView.innerHTML = location.pathname
    })
    function onLoad () {
        routerView.innerHTML = location.pathname
        var linkList = document.querySelectorAll('a[href]')
        linkList.forEach(el => el.addEventListener('click', function (e) {
            e.preventDefault()
            history.pushState(null, '', el.getAttribute('href'))
            routerView.innerHTML = location.pathname
        }))
    }

</script>
</html>
```

解释下上面代码，其实也差不多：
1. 我们通过a标签的href属性来改变URL的path值（当然，你触发浏览器的前进后退按钮也可以，或者在控制台输入history.go,back,forward赋值来触发popState事件）。这里需要注意的就是，当改变path值时，默认会触发页面的跳转，所以需要拦截` <a>` 标签点击事件默认行为， 点击时使用 pushState 修改 URL并更新手动 UI，从而实现点击链接更新 URL 和 UI 的效果。
2. 我们监听**popState**事件。一旦事件触发，就改变**routerView**的内容。
3. load事件则是一样的

有个问题：hash模式，也可以用`history.go,back,forward`来触发hashchange事件吗？

A：也是可以的。因为不管什么模式，浏览器为保存记录都会有一个栈。

## 三、基于Vue实现VueRouter

我们先利用vue-cli建一个项目




![](https://imgconvert.csdnimg.cn/aHR0cHM6Ly9pbWdrci5jbi1iai51ZmlsZW9zLmNvbS9mMzdkODNlYi0xNGM3LTQ1ODctOTcyYi1iYmQzYzM3MjE5NDEucG5n?x-oss-process=image/format,png)



删除一些不必要的组建后项目目录暂时如下：
  


![](https://imgconvert.csdnimg.cn/aHR0cHM6Ly9pbWdrci5jbi1iai51ZmlsZW9zLmNvbS8zMWNmMmFlMy02MjNmLTQzNzgtOTkwYS0yM2Q0YzU2YmQyODcucG5n?x-oss-process=image/format,png)


>已经把项目放到 **github**：https://github.com/Sunny-lucking/howToBuildMyVueRouter  可以卑微地要个star吗。**有什么不理解或者什么建议，欢迎下方评论**

我们主要看下App.vue,About.vue,Home.vue,router/index.js

代码如下:
  
App.vue
```
<template>
  <div id="app">
    <div id="nav">
      <router-link to="/home">Home</router-link> |
      <router-link to="/about">About</router-link>
    </div>
    <router-view/>
  </div>
</template>
```

router/index.js

```js
import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import About from "../views/About.vue"
Vue.use(VueRouter)
  const routes = [
  {
    path: '/home',
    name: 'Home',
    component: Home
  },
  {
    path: '/about',
    name: 'About',
    component: About
  }
]
const router = new VueRouter({
  mode:"history",
  routes
})
export default router

```
Home.vue

```html
<template>
  <div class="home">
    <h1>这是Home组件</h1>
  </div>
</template>
```
About.vue

```html
<template>
  <div class="about">
    <h1>这是about组件</h1>
  </div>
</template>
```


现在我们启动一下项目。看看项目初始化有没有成功。



![](https://imgconvert.csdnimg.cn/aHR0cHM6Ly9pbWdrci5jbi1iai51ZmlsZW9zLmNvbS9kNWVmYWI2Yi1lYWQ5LTRiMzMtOWYzYy02Y2QxZjY1ZjEzNjYucG5n?x-oss-process=image/format,png)



ok，没毛病，初始化成功。

现在我们决定创建自己的VueRouter，于是创建myVueRouter.js文件

目前目录如下



![](https://imgconvert.csdnimg.cn/aHR0cHM6Ly9pbWdrci5jbi1iai51ZmlsZW9zLmNvbS85MmJlOTk0MC1iNzk5LTQ1ZGItOGJmMC1jOWNjYTRkNTY3YTUucG5n?x-oss-process=image/format,png)


再将VueRouter引入 改成我们的myVueRouter.js

```js
//router/index.js
import Vue from 'vue'
import VueRouter from './myVueRouter' //修改代码
import Home from '../views/Home.vue'
import About from "../views/About.vue"
Vue.use(VueRouter)
  const routes = [
  {
    path: '/home',
    name: 'Home',
    component: Home
  },
  {
    path: '/about',
    name: 'About',
    component: About
  }
];
const router = new VueRouter({
  mode:"history",
  routes
})
export default router

```

## 四、剖析VueRouter本质
  

先抛出个问题，Vue项目中是怎么引入VueRouter。

1. 安装VueRouter，再通过`import VueRouter from 'vue-router'`引入
2. 先 `const router = new VueRouter({...})`,再把router作为参数的一个属性值，`new Vue({router})`
3. 通过Vue.use(VueRouter) 使得每个组件都可以拥有store实例

从这个引入过程我们可以发现什么？
1. 我们是通过new VueRouter({...})获得一个router实例，也就是说，我们引入的VueRouter其实是一个类。

所以我们可以初步假设

```js
class VueRouter{
    
}

```
2. 我们还使用了Vue.use(),而Vue.use的一个原则就是执行对象的install这个方法

所以，我们可以再一步 假设VueRouter有有install这个方法。

```js
class VueRouter{

}
VueRouter.install = function () {
    
}
```

到这里，你能大概地将VueRouter写出来吗？

很简单，就是将上面的VueRouter导出，如下就是myVueRouter.js

```js
//myVueRouter.js
class VueRouter{

}
VueRouter.install = function () {
    
}

export default VueRouter
```




## 五、分析Vue.use
Vue.use(plugin);

（1）参数


```
{ Object | Function } plugin
```


（2）用法

安装Vue.js插件。如果插件是一个对象，必须提供install方法。如果插件是一个函数，它会被作为install方法。调用install方法时，会将Vue作为参数传入。install方法被同一个插件多次调用时，插件也只会被安装一次。

关于如何上开发Vue插件，请看这篇文章，非常简单，不用两分钟就看完：[如何开发 Vue 插件？](https://mp.weixin.qq.com/s?__biz=MzU5NDM5MDg1Mw==&mid=2247483874&idx=1&sn=ac6c9cf2629068dec3e5da8aa3e29364&chksm=fe00bbc8c97732dea7be43e903a794229876d8ab6c9381f2388ba22886fba7776b7b34b7af86&token=1885963052&lang=zh_CN#rd)

（3）作用

注册插件，此时只需要调用install方法并将Vue作为参数传入即可。但在细节上有两部分逻辑要处理：

1、插件的类型，可以是install方法，也可以是一个包含install方法的对象。

2、插件只能被安装一次，保证插件列表中不能有重复的插件。

（4）实现



```js
Vue.use = function(plugin){
	const installedPlugins = (this._installedPlugins || (this._installedPlugins = []));
	if(installedPlugins.indexOf(plugin)>-1){
		return this;
	}
	<!-- 其他参数 -->
	const args = toArray(arguments,1);
	args.unshift(this);
	if(typeof plugin.install === 'function'){
		plugin.install.apply(plugin,args);
	}else if(typeof plugin === 'function'){
		plugin.apply(null,plugin,args);
	}
	installedPlugins.push(plugin);
	return this;
}
```
1、在Vue.js上新增了use方法，并接收一个参数plugin。

2、首先判断插件是不是已经别注册过，如果被注册过，则直接终止方法执行，此时只需要使用indexOf方法即可。

3、toArray方法我们在就是将类数组转成真正的数组。使用toArray方法得到arguments。除了第一个参数之外，剩余的所有参数将得到的列表赋值给args，然后将Vue添加到args列表的最前面。这样做的目的是保证install方法被执行时第一个参数是Vue，其余参数是注册插件时传入的参数。

4、由于plugin参数支持对象和函数类型，所以通过判断plugin.install和plugin哪个是函数，即可知用户使用哪种方式祖册的插件，然后执行用户编写的插件并将args作为参数传入。

5、最后，将插件添加到installedPlugins中，保证相同的插件不会反复被注册。(~~**让我想起了曾经面试官问我为什么插件不会被重新加载！！！哭唧唧，现在总算明白了**)

第三点讲到，我们把Vue作为install的第一个参数，所以我们可以把Vue保存起来

```js
//myVueRouter.js
let Vue = null;
class VueRouter{

}
VueRouter.install = function (v) {
    Vue = v;
};

export default VueRouter
```

然后再通过传进来的Vue创建两个组件router-link和router-view

```js
//myVueRouter.js
let Vue = null;
class VueRouter{

}
VueRouter.install = function (v) {
    Vue = v;
    console.log(v);

    //新增代码
    Vue.component('router-link',{
        render(h){
            return h('a',{},'首页')
        }
    })
    Vue.component('router-view',{
        render(h){
            return h('h1',{},'首页视图')
        }
    })
};

export default VueRouter
```

我们执行下项目，如果没报错，说明我们的假设没毛病。


![](https://imgconvert.csdnimg.cn/aHR0cHM6Ly9pbWdrci5jbi1iai51ZmlsZW9zLmNvbS81ZjFmMWUzYS1iM2NiLTRiZmQtYmIzYS1iYWZhN2YxMDY2YzcucG5n?x-oss-process=image/format,png)

天啊，没报错。没毛病！


## 六、完善install方法
install 一般是给每个vue实例添加东西的 

在这里就是**给每个组件添加`$route`和`$router`**。

**`$route`和`$router`有什么区别？**

>A：`$router`是VueRouter的实例对象，`$route`是当前路由对象，也就是说`$route`是`$router`的一个属性
注意每个组件添加的`$route`是是同一个，`$router`也是同一个，所有组件共享的。

这是什么意思呢？？？

来看mian.js


```js
import Vue from 'vue'
import App from './App.vue'
import router from './router'

Vue.config.productionTip = false

new Vue({
  router,
  render: function (h) { return h(App) }
}).$mount('#app')
```

我们可以发现这里只是将router ，也就是./router导出的store实例，作为Vue 参数的一部分。

但是这里就是有一个问题咯，这里的Vue 是根组件啊。也就是说目前只有根组件有这个router值，而其他组件是还没有的，所以我们需要让其他组件也拥有这个router。

因此，install方法我们可以这样完善


```
//myVueRouter.js
let Vue = null;
class VueRouter{

}
VueRouter.install = function (v) {
    Vue = v;
    // 新增代码
    Vue.mixin({
        beforeCreate(){
            if (this.$options && this.$options.router){ // 如果是根组件
                this._root = this; //把当前实例挂载到_root上
                this._router = this.$options.router;
            }else { //如果是子组件
                this._root= this.$parent && this.$parent._root
            }
            Object.defineProperty(this,'$router',{
                get(){
                    return this._root._router
                }
            })
        }
    })

    Vue.component('router-link',{
        render(h){
            return h('a',{},'首页')
        }
    })
    Vue.component('router-view',{
        render(h){
            return h('h1',{},'首页视图')
        }
    })
};

export default VueRouter

```

解释下代码：
1. 参数Vue，我们在第四小节分析Vue.use的时候，再执行install的时候，将Vue作为参数传进去。
2. mixin的作用是将mixin的内容混合到Vue的初始参数options中。相信使用vue的同学应该使用过mixin了。
3. 为什么是beforeCreate而不是created呢？因为如果是在created操作的话，$options已经初始化好了。
4. 如果判断当前组件是根组件的话，就将我们传入的router和_root挂在到根组件实例上。
5. 如果判断当前组件是子组件的话，就将我们_root根组件挂载到子组件。注意是**引用的复制**，因此每个组件都拥有了同一个_root根组件挂载在它身上。

这里有个问题，为什么判断当前组件是子组件，就可以直接从父组件拿到_root根组件呢？这让我想起了曾经一个面试官问我的问题：**父组件和子组件的执行顺序**？

>A：父beforeCreate-> 父created -> 父beforeMounte  -> 子beforeCreate ->子create ->子beforeMount ->子 mounted -> 父mounted

可以得到，在执行子组件的beforeCreate的时候，父组件已经执行完beforeCreate了，那理所当然父组件已经有_root了。

然后我们通过

```
Object.defineProperty(this,'$router',{
  get(){
      return this._root._router
  }
})
```
将`$router`挂载到组件实例上。

其实这种思想也是一种代理的思想，我们获取组件的`$router`，其实返回的是根组件的`_root._router`

到这里还install还没写完，可能你也发现了，`$route`还没实现，现在还实现不了，没有完善VueRouter的话，没办法获得当前路径

## 七、完善VueRouter类
我们先看看我们new VueRouter类时传进了什么东东

```js
//router/index.js
import Vue from 'vue'
import VueRouter from './myVueRouter'
import Home from '../views/Home.vue'
import About from "../views/About.vue"
Vue.use(VueRouter)
  const routes = [
  {
    path: '/home',
    name: 'Home',
    component: Home
  },
  {
    path: '/about',
    name: 'About',
    component: About
  }
];
const router = new VueRouter({
  mode:"history",
  routes
})
export default router
```
可见，传入了一个为数组的路由表routes，还有一个代表 当前是什么模式的mode。因此我们可以先这样实现VueRouter

```js
class VueRouter{
    constructor(options) {
        this.mode = options.mode || "hash"
        this.routes = options.routes || [] //你传递的这个路由是一个数组表
    }
}

```
先接收了这两个参数。

但是我们直接处理routes是十分不方便的，所以我们先要转换成`key：value`的格式


```js
//myVueRouter.js
let Vue = null;
class VueRouter{
    constructor(options) {
        this.mode = options.mode || "hash"
        this.routes = options.routes || [] //你传递的这个路由是一个数组表
        this.routesMap = this.createMap(this.routes)
        console.log(this.routesMap);
    }
    createMap(routes){
        return routes.reduce((pre,current)=>{
            pre[current.path] = current.component
            return pre;
        },{})
    }
}
```
通过createMap我们将

```
const routes = [
  {
    path: '/home',
    name: 'Home',
    component: Home
  },
  {
    path: '/about',
    name: 'About',
    component: About
  }
```
转换成

![](https://imgconvert.csdnimg.cn/aHR0cHM6Ly9pbWdrci5jbi1iai51ZmlsZW9zLmNvbS80MmQ0N2EzMy01ZTU0LTRiNzQtOTJkYi1hNGRkNzc3NGY0MzQucG5n?x-oss-process=image/format,png)

路由中需要存放当前的路径，来表示当前的路径状态
为了方便管理，可以用一个对象来表示


```js
//myVueRouter.js
let Vue = null;
新增代码
class HistoryRoute {
    constructor(){
        this.current = null
    }
}
class VueRouter{
    constructor(options) {
        this.mode = options.mode || "hash"
        this.routes = options.routes || [] //你传递的这个路由是一个数组表
        this.routesMap = this.createMap(this.routes)
        新增代码
        this.history = new HistoryRoute();
        
    }

    createMap(routes){
        return routes.reduce((pre,current)=>{
            pre[current.path] = current.component
            return pre;
        },{})
    }

}
```
但是我们现在发现这个current也就是 当前路径还是null，所以我们需要进行初始化。

初始化的时候判断是是hash模式还是 history模式。，然后将当前路径的值保存到current里


```js
//myVueRouter.js
let Vue = null;
class HistoryRoute {
    constructor(){
        this.current = null
    }
}
class VueRouter{
    constructor(options) {
        this.mode = options.mode || "hash"
        this.routes = options.routes || [] //你传递的这个路由是一个数组表
        this.routesMap = this.createMap(this.routes)
        this.history = new HistoryRoute();
        新增代码
        this.init()

    }
    新增代码
    init(){
        if (this.mode === "hash"){
            // 先判断用户打开时有没有hash值，没有的话跳转到#/
            location.hash? '':location.hash = "/";
            window.addEventListener("load",()=>{
                this.history.current = location.hash.slice(1)
            })
            window.addEventListener("hashchange",()=>{
                this.history.current = location.hash.slice(1)
            })
        } else{
            location.pathname? '':location.pathname = "/";
            window.addEventListener('load',()=>{
                this.history.current = location.pathname
            })
            window.addEventListener("popstate",()=>{
                this.history.current = location.pathname
            })
        }
    }

    createMap(routes){
        return routes.reduce((pre,current)=>{
            pre[current.path] = current.component
            return pre;
        },{})
    }

}
```

监听事件跟上面原生js实现的时候一致。



## 八、完善$route
前面那我们讲到，要先实现VueRouter的history.current的时候，才能获得当前的路径，而现在已经实现了，那么就可以着手实现`$route`了。

很简单，跟实现`$router`一样


```js
VueRouter.install = function (v) {
    Vue = v;
    Vue.mixin({
        beforeCreate(){
            if (this.$options && this.$options.router){ // 如果是根组件
                this._root = this; //把当前实例挂载到_root上
                this._router = this.$options.router;
            }else { //如果是子组件
                this._root= this.$parent && this.$parent._root
            }
            Object.defineProperty(this,'$router',{
                get(){
                    return this._root._router
                }
            });
             新增代码
            Object.defineProperty(this,'$route',{
                get(){
                    return this._root._router.history.current
                }
            })
        }
    })
    Vue.component('router-link',{
        render(h){
            return h('a',{},'首页')
        }
    })
    Vue.component('router-view',{
        render(h){
            return h('h1',{},'首页视图')
        }
    })
};
```

## 九、完善router-view组件

现在我们已经保存了当前路径，也就是说现在我们可以获得当前路径，然后再根据当前路径从路由表中获取对应的组件进行渲染


```js
Vue.component('router-view',{
    render(h){
        let current = this._self._root._router.history.current
        let routeMap = this._self._root._router.routesMap;
        return h(routeMap[current])
    }
})
```
解释一下：

render函数里的this指向的是一个Proxy代理对象，代理Vue组件，而我们前面讲到每个组件都有一个_root属性指向根组件，根组件上有_router这个路由实例。
所以我们可以从router实例上获得路由表，也可以获得当前路径。
然后再把获得的组件放到h()里进行渲染。

现在已经实现了router-view组件的渲染，但是有一个问题，就是你改变路径，视图是没有重新渲染的，所以需要将_router.history进行响应式化。


```
Vue.mixin({
    beforeCreate(){
        if (this.$options && this.$options.router){ // 如果是根组件
            this._root = this; //把当前实例挂载到_root上
            this._router = this.$options.router;
            新增代码
            Vue.util.defineReactive(this,"xxx",this._router.history)
        }else { //如果是子组件
            this._root= this.$parent && this.$parent._root
        }
        Object.defineProperty(this,'$router',{
            get(){
                return this._root._router
            }
        });
        Object.defineProperty(this,'$route',{
            get(){
                return this._root._router.history.current
            }
        })
    }
})
```
我们利用了Vue提供的API：defineReactive，使得this._router.history对象得到监听。

因此当我们第一次渲染**router-view**这个组件的时候，会获取到`this._router.history`这个对象，从而就会被监听到获取`this._router.history`。就会把**router-view**组件的依赖**wacther**收集到`this._router.history`对应的收集器**dep**中，因此`this._router.history`每次改变的时候。`this._router.history`对应的收集器**dep**就会通知**router-view**的组件依赖的**wacther**执行**update()**，从而使得`router-view`重新渲染（**其实这就是vue响应式的内部原理**）


好了，现在我们来测试一下，通过改变url上的值，能不能触发router-view的重新渲染

![](https://imgconvert.csdnimg.cn/aHR0cHM6Ly9pbWdrci5jbi1iai51ZmlsZW9zLmNvbS82NjYzZThjNC1hMDEzLTRkMGItYmI5Ni0zNjg2NWUwZmQzZmQucG5n?x-oss-process=image/format,png)

path改成home


![](https://imgconvert.csdnimg.cn/aHR0cHM6Ly9pbWdrci5jbi1iai51ZmlsZW9zLmNvbS9lY2M2Y2FkZS1hNGQ3LTQyM2YtODM4YS1mNWQ3YTBjMzExYjQucG5n?x-oss-process=image/format,png)

可见成功实现了当前路径的监听。。



## 十、完善router-link组件

我们先看下router-link是怎么使用的。


```js
<router-link to="/home">Home</router-link> 
<router-link to="/about">About</router-link>
```
也就是说父组件间to这个路径传进去，子组件接收就好
因此我们可以这样实现


```js
Vue.component('router-link',{
    props:{
        to:String
    },
    render(h){
        let mode = this._self._root._router.mode;
        let to = mode === "hash"?"#"+this.to:this.to
        return h('a',{attrs:{href:to}},this.$slots.default)
    }
})
```
我们把router-link渲染成a标签，当然这时最简单的做法。
通过点击a标签就可以实现url上路径的切换。从而实现视图的重新渲染

ok，到这里完成此次的项目了。

看下VueRouter的完整代码吧

```js
//myVueRouter.js
let Vue = null;
class HistoryRoute {
    constructor(){
        this.current = null
    }
}
class VueRouter{
    constructor(options) {
        this.mode = options.mode || "hash"
        this.routes = options.routes || [] //你传递的这个路由是一个数组表
        this.routesMap = this.createMap(this.routes)
        this.history = new HistoryRoute();
        this.init()

    }
    init(){
        if (this.mode === "hash"){
            // 先判断用户打开时有没有hash值，没有的话跳转到#/
            location.hash? '':location.hash = "/";
            window.addEventListener("load",()=>{
                this.history.current = location.hash.slice(1)
            })
            window.addEventListener("hashchange",()=>{
                this.history.current = location.hash.slice(1)
            })
        } else{
            location.pathname? '':location.pathname = "/";
            window.addEventListener('load',()=>{
                this.history.current = location.pathname
            })
            window.addEventListener("popstate",()=>{
                this.history.current = location.pathname
            })
        }
    }

    createMap(routes){
        return routes.reduce((pre,current)=>{
            pre[current.path] = current.component
            return pre;
        },{})
    }

}
VueRouter.install = function (v) {
    Vue = v;
    Vue.mixin({
        beforeCreate(){
            if (this.$options && this.$options.router){ // 如果是根组件
                this._root = this; //把当前实例挂载到_root上
                this._router = this.$options.router;
                Vue.util.defineReactive(this,"xxx",this._router.history)
            }else { //如果是子组件
                this._root= this.$parent && this.$parent._root
            }
            Object.defineProperty(this,'$router',{
                get(){
                    return this._root._router
                }
            });
            Object.defineProperty(this,'$route',{
                get(){
                    return this._root._router.history.current
                }
            })
        }
    })
    Vue.component('router-link',{
        props:{
            to:String
        },
        render(h){
            let mode = this._self._root._router.mode;
            let to = mode === "hash"?"#"+this.to:this.to
            return h('a',{attrs:{href:to}},this.$slots.default)
        }
    })
    Vue.component('router-view',{
        render(h){
            let current = this._self._root._router.history.current
            let routeMap = this._self._root._router.routesMap;
            return h(routeMap[current])
        }
    })
};

export default VueRouter
```



现在测试下成功没

![](https://imgconvert.csdnimg.cn/aHR0cHM6Ly9pbWdrci5jbi1iai51ZmlsZW9zLmNvbS80NWRlY2U5MC00MmMyLTRjODktYjhmZC0yZDJiODBmMzAyZDAucG5n?x-oss-process=image/format,png)
|

![](https://imgconvert.csdnimg.cn/aHR0cHM6Ly9pbWdrci5jbi1iai51ZmlsZW9zLmNvbS9lYWRiYWNlNC01NTJlLTQ5OGMtOGI5Yy03NDhkYmMyODA3NTkucG5n?x-oss-process=image/format,png)
点击确实视图切换了，成功。

完美收官！！！！

有什么不理解或者什么建议，欢迎下方评论

感谢您也恭喜您看到这里，我可以卑微的求个star吗！！！

>github：https://github.com/Sunny-lucking/howToBuildMyVueRouter

>参考文献：文章前面一、二节原理部分 摘自：https://blog.csdn.net/qq867263657/article/details/90903491
