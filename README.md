# MengZe Tool Pro - 面向移动端的专业网页调试工具套件

![Tampermonkey Version](https://img.shields.io/badge/Tampermonkey-v4.19+-blue) ![License](https://img.shields.io/badge/License-MIT-green) ![Version](https://img.shields.io/badge/Version-0.7.0-orange)

**MengZe Tool Pro** 是一款面向Web开发者的专业级网页调试工具套件，集成了多种实用功能，帮助开发者提升调试效率。通过浮动控制面板提供快速访问功能，支持暗黑模式，并包含丰富的调试工具。

## ✨ 核心功能

### 🛠️ 调试工具
- **Eruda调试器集成**：一键唤醒移动端调试神器
- **源码查看器**：支持原始/渲染源码对比查看
- **元素检查器**：实时元素高亮与属性查看
- **脚本注入器**：动态加载外部JS资源

### 📊 性能监控
- **网络请求拦截**：实时监控XHR/Fetch请求
- **性能分析报告**：完整性能指标数据导出
- **内存监控**（实验性）：实时内存使用统计

### 🎨 界面功能
- **智能浮动面板**：360°旋转动画按钮
- **暗黑模式**：自动保存主题偏好
- **快捷键支持**：Ctrl+M 快速唤出面板
- **响应式布局**：自适应不同屏幕尺寸

### ⚡ 实用工具
- **高级刷新**：带缓存清理的强制刷新
- **DOM修改追踪**：元素修改高亮标记
- **CSS调试工具**：实时样式预览
- **请求拦截**（Beta）：支持修改请求参数

## 🚀 安装方法

1. 安装用户脚本管理器扩展：
   - [Tampermonkey](https://www.tampermonkey.net/) (推荐)
   - [Violentmonkey](https://violentmonkey.github.io/)

2. [点击此处安装脚本](https://mengze.vip/install)  

3. 刷新任意网页即可看到右下角浮动按钮

## 🕹️ 使用说明

1. **基本操作**：
   - 点击右下角「泽」字按钮打开控制面板
   - 使用 `Ctrl + M` 快速切换面板显隐
   - 鼠标悬停按钮可触发缩放动画

2. **功能指南**：
   - **网络监控**：在新窗口显示实时请求瀑布流
   - **元素检查**：鼠标悬停显示元素元数据，点击锁定元素
   - **脚本注入**：支持加载CDN或本地脚本文件
   - **性能分析**：生成包含Timing API数据的详细报告

## ⚙️ 技术特性

- **智能存储**：使用`GM_setValue`持久化用户设置
- **安全沙箱**：通过`@connect *`处理跨域请求
- **性能优化**：网络日志采用环形缓冲区设计
- **主题引擎**：CSS变量驱动的动态主题系统

## 📝 注意事项

- 首次使用网络监控可能需要允许弹出窗口
- 元素检查器在复杂CSS布局中可能有定位偏差
- 部分功能需要现代浏览器支持（Chrome 90+/Firefox 88+）
- 暗黑模式切换后需要手动刷新样式敏感页面

## 🤝 参与贡献

欢迎通过以下方式参与项目：
1. 提交Issue报告问题
2. Fork仓库进行功能开发
3. 提交Pull Request改进代码
4. 参与文档翻译工作

遵循[MIT开源协议](LICENSE)，请保留作者信息及许可声明。

---

**开发者提示**：在控制台输入 `window.__MENGZE_TOOL__` 可访问调试API

[![mm_reward_qrcode_1743497808845.png](https://cdn.mengze.vip/gh/YShenZe/Blog-Static-Resource@main/images/mm_reward_qrcode_1743497808845.png)](https://cdn.mengze.vip/gh/YShenZe/Blog-Static-Resource@main/images/mm_reward_qrcode_1743497808845.png)
