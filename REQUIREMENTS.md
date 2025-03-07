# 使用D3.js开发一个web component的折线图组件

## 业务需求
1. 不显示纵向网格线和纵向坐标轴
2. 横向网格线和坐标轴显示为虚线，可自定义颜色
3. 横向网格线在左侧显示刻度值
4. 横向坐标轴只在关键刻度点显示刻度值
5. 横向坐标轴的刻度线不显示
6. 折线可以定义颜色，并且折线下方有阴影，**阴影由浓转淡再消失**
7. 折线的关键点可以定义特殊样式
8. 折线的绘制有从左往右的绘制动画

## 名词解释
- 纵向网格线：x轴的网格线
- 横向网格线：y轴的网格线
- 纵向坐标轴：Y轴的坐标轴，即竖着的坐标轴
- 横向坐标轴：X轴的坐标轴，即横着的坐标轴
- 刻度值：坐标轴上的数字
- 刻度线：坐标轴上指向刻度值的线
- 刻度点：坐标轴上的点，例如横向坐标轴有【1，2，3，4，5】，那么刻度点就是【1，2，3，4，5】
- 关键刻度点：刻度点中的一部分，例如横向坐标轴有【1，2，3，4，5】，那么关键刻度点可以设置为【3】，那么在3这个刻度点会显示刻度值
- 关键刻度点显示内容：关键刻度点显示的内容，例如可以设置为"关键点"
- 折线图的关键点：要在折线图上显示的点，例如：X轴的刻度点为【1，2，3，4，5】，Y轴的刻度点为【10，20，30，40，50】，那么折线图的关键点可以设置为(2,20)，那么折线图的(2,20)这个点会显示折线图的关键点，注意：关键点并不一定在折线上

## 技术需求
1. 使用D3.js v7.9.0版本，D3的API文档为：https://d3js.org/what-is-d3，D3的script脚本地址使用CDN的形式，url为：https://cdn.jsdelivr.net/npm/d3@7
2. 纵向的网格线和纵向的坐标轴不显示，固定写死，不需要进行配置
3. 横向的网格线和坐标轴固定显示为虚线，不需要配置；但是横向的网格线可以自定义颜色
4. 横向的网格线在左侧需要显示刻度值，刻度值为数字，对于大数字需要显示为50K、100K等形式；默认不显示小数，直接取整，但是可以配置显示几位小数；
5. 横向坐标轴只在关键刻度点显示刻度值，例如横向坐标轴有[1,2,3,4,5]个刻度点，**那么可以设置3为关键刻度点，并且可以设置关键刻度点显示的内容，例如显示为"关键点"**
6. 横向网格线左侧的刻度值(A)和横向坐标轴的刻度值(B)可以配置文本颜色和字体大小，这两个配置项统一，不需要给A和B单独的配置
7. 横向坐标轴的刻度线不显示，固定写死，不需要进行配置
8. 折线可以配置颜色；折线下方有阴影，阴影由浓转淡再消失，可以配置是否显示阴影；
9. 折线的关键点由外部传入dom元素，外部进行渲染，例如外部可以传入，render字段，render字段的值为: `<div style="border: 2px solid #3498db;border-radius: 50%;width: 30px;height: 30px;overflow: hidden;"><img src="https://opensocial.co/img/whatever.webp" style="width:100%;height:100%;" /></div>`;但是内部承载render的父元素，不要限制内部的宽高
10. 如果设置的关键在超出了折线图，则不进行渲染。例如：X轴的刻度点为【1，2，3，4，5】，Y轴的刻度点为【10，20，30，40，50】，而设置的关键点是(2,100)，那么就超出了这个坐标轴上的显示范围，则不进行显示
11. 折线图的绘制动画，即从左往右的绘制动画，可以配置动画开启与否；同时需要可以配置动画时长
12. 渲染使用canvas + SVG混合的渲染方式，使用Canvas绘制折线图主体，使用SVG绘制其他元素，例如网格线、坐标轴等，例如折线的关键点是传入的dom元素，那么需要在SVG中渲染这个dom元素就比在canvas中处理要方便的中，总的来说需要发挥canvas和svg各自的优势
13. 由于折线图的渲染使用canvas + SVG混合的渲染方式，所以需要确保Canvas和SVG使用相同的坐标系统，在缩放或调整大小时同步更新
14. 由于折线图的数据点比较多，所以需要在内部实现数据抽稀算法以提高性能，抽稀算法使用Ramer-Douglas-Peucker算法
15. web Component内的元素，即Shadow DOM的宽高为100%，即它的宽高由外部决定，它本身是能撑多大就撑多大
16. 折线图的大小需要自适应，即由于它父元素的宽高变化，它自身也会随着变化,自适应由webComponent组件内部自行处理
17. 横向网格线左侧的刻度值需要配置是否显示小数，可以配置显示几位小数
18. 不需要特别考虑浏览器兼容性
19. 项目结构为单文件组件，使用rollup对这个文件进行打包压缩
20. 提供一个演示页面，用于展示折线图的使用方法
21. 演示页面可以使用http-server进行启动，http-server已经全局安装了
22. 包管理工具使用pnpm
23. 使用typescript进行开发
24. 添加单元测试

## API和数据结构设计
1. web component的名称为：d3-line-chart，它的实例称为chart
2. chart需要对外提供setConfig方法，用于设置折线图的配置，setConfig的使用如下
    ```javascript
    chart.setConfig({
      lineColor: '#3498db', // 配置折线的颜色
      showShadow: true, // 配置是否显示阴影
      gridColor: '#ff0000', // 配置网格线的颜色
      enableAnimation: true, // 配置是否启用动画
      animationDuration: 1000, // 配置动画时长
      axisTextColor: '#f00', // 配置坐标轴文本颜色
      axisTextSize: '14px', // 配置坐标轴文本字体大小
      gridNumberDecimal: 2, // 配置网格线左侧的刻度值显示几位小数
    });
    ```
3. chart需要对外提供setEnableAnimation方法，用于设置是否启用动画，它接收两个参数，第一个参数表示是否启用动画，第二个参数表示动画的时长，第二个参数可选，默认为1秒钟，setEnableAnimation的使用如下
    ```javascript
    chart.setEnableAnimation(true, 1000); // 启用动画，动画时长为1秒
    chart.setEnableAnimation(false); // 禁用动画
    ```
4. chart需要对外提供setData方法，用于设置折线图的数据，setData的使用如下
    ```javascript
    chart.setData([
      { x: 0, y: 10 },
      { x: 1, y: 15 },
      { x: 2, y: 8 },
      // ...
    ]);
    ```
5. chart需要对外提供setKeyPoints方法，用于设置折线图的关键点，setKeyPoints的使用如下
    ```javascript
    chart.setKeyPoints([
      { x: 1, y: 15, render: `<div style="border: 2px solid #3498db;border-radius: 50%;width: 30px;height: 30px;overflow: hidden;"><img src="https://opensocial.co/img/whatever.webp" style="width:100%;height:100%;" /></div>` },
      { x: 3, y: 20, render: `<div style="border: 2px solid #3498db;border-radius: 50%;width: 30px;height: 30px;overflow: hidden;"><img src="https://opensocial.co/img/whatever.webp" style="width:100%;height:100%;" /></div>` },
      // ...
    ]);
    ```
6. chart需要对外提供setKeyTicks方法，用于设置折线图的关键刻度点，setKeyTicks的使用如下
    ```javascript
    chart.setKeyTicks([
      { x: 0, label: '开始' },
      { x: 10, label: '10%' },
      { x: 25, label: '25%' },
      { x: 50, label: '中点' }
    ]);
    ```
7. chart需要对外提供getConfig、getEnableAnimation、getData、getKeyPoints、getKeyTicks、getAnimationDuration、getGridColor、getLineColor、getShowShadow、getAxisTextColor、getAxisTextSize等方法，用于获取折线图的配置
