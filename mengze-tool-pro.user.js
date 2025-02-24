// ==UserScript==
// @name         MengZe Tool Pro
// @namespace    https://yzeblog.dev.tc/
// @version      0.6.1
// @description  Professional debugging toolkit with enhanced features
// @author       MengZe2
// @run-at       document-end
// @match        https://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_openInTab
// @connect      *
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    const state = {
        darkMode: GM_getValue('darkMode', false),
        networkMonitor: false,
        activeInspector: null,
        currentTheme: 'default'
    };

    let networkLogs = [];
    let networkWindow = null;
    let stopNetworkMonitoring = null;

    const floatBtn = createFloatButton();
    const controlPanel = createControlPanel();
    document.body.appendChild(floatBtn);
    document.body.appendChild(controlPanel);

    initTheme();

    function initTheme() {
        GM_addStyle(`
            .mengze-tool-panel {
                background: ${state.darkMode ? '#2d2d2d' : '#fff'} !important;
                color: ${state.darkMode ? '#fff' : '#000'} !important;
            }
            .mengze-btn {
                background: ${state.darkMode ? '#3a3a3a' : '#f5f5f5'} !important;
                color: ${state.darkMode ? '#fff' : '#000'} !important;
            }
        `);
    }

    function createFloatButton() {
        const btn = document.createElement('div');
        btn.innerHTML = '<span style="font-size:24px">泽</span>';
        Object.assign(btn.style, {
            position: 'fixed',
            right: '20px',
            bottom: '20px',
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            background: 'white',
            cursor: 'pointer',
            boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        });

        btn.addEventListener('mouseover', () => {
            btn.style.transform = 'scale(1.1)';
            btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        });

        btn.addEventListener('mouseout', () => {
            btn.style.transform = 'scale(1)';
            btn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
        });

        btn.addEventListener('click', () => {
            btn.style.transform = controlPanel.style.opacity === '0' 
                ? 'rotate(360deg) scale(1.1)'
                : 'rotate(0deg) scale(1)';
            togglePanel(controlPanel, controlPanel.style.opacity === '0');
        });

        return btn;
    }

    function createControlPanel() {
        const panel = document.createElement('div');
        panel.className = 'mengze-tool-panel';
        Object.assign(panel.style, {
            position: 'fixed',
            right: '20px',
            bottom: '80px',
            width: '200px',
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
            opacity: '0',
            transform: 'translateY(20px)',
            transition: 'opacity 0.3s, transform 0.3s',
            pointerEvents: 'none',
            zIndex: 9999,
            padding: '10px'
        });

        const features = [
            { name: '开启Debug', action: initEruda },
            { name: '查看源码', action: showSourceViewer },
            { name: '高级刷新', action: advancedReload },
            { name: '暗黑模式', action: toggleDarkMode },
            { name: '网络监控', action: toggleNetworkMonitor },
            { name: '元素检查', action: toggleElementInspector },
            { name: '脚本注入', action: showScriptInjector },
            { name: '性能分析', action: initPerformanceMonitor },
            { name: '隐藏面板', action: () => togglePanel(panel, false) }
        ];

        features.forEach(feat => {
            const btn = document.createElement('button');
            btn.className = 'mengze-btn';
            btn.textContent = feat.name;
            Object.assign(btn.style, {
                display: 'block',
                width: '100%',
                padding: '8px',
                margin: '4px 0',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: '0.3s'
            });

            btn.addEventListener('click', () => {
                feat.action();
                togglePanel(controlPanel, false);
            });

            panel.appendChild(btn);
        });

        return panel;
    }

    // 核心功能实现 ----

    function toggleDarkMode() {
        state.darkMode = !state.darkMode;
        GM_setValue('darkMode', state.darkMode);
        document.documentElement.classList.toggle('mengze-dark-mode');
        initTheme();
    }

    function toggleNetworkMonitor() {
        state.networkMonitor = !state.networkMonitor;
        if (state.networkMonitor) {
            stopNetworkMonitoring = startNetworkMonitoring();
            createNetworkMonitorWindow();
        } else {
            if (stopNetworkMonitoring) {
                stopNetworkMonitoring();
                stopNetworkMonitoring = null;
            }
            if (networkWindow && !networkWindow.closed) {
                networkWindow.close();
            }
            networkWindow = null;
            networkLogs = [];
        }
    }

    function startNetworkMonitoring() {
        const originalFetch = window.fetch;
        const originalXHR = window.XMLHttpRequest;

        window.fetch = async (...args) => {
            const start = Date.now();
            try {
                const response = await originalFetch(...args);
                logNetworkRequest({
                    url: (typeof args[0] === 'string' ? args[0] : args[0].url) || 'unknown',
                    method: (args[1]?.method || 'GET').toUpperCase(),
                    status: response.status,
                    duration: Date.now() - start,
                    type: 'fetch'
                });
                return response;
            } catch (error) {
                logNetworkRequest({
                    url: (typeof args[0] === 'string' ? args[0] : args[0].url) || 'unknown',
                    method: (args[1]?.method || 'GET').toUpperCase(),
                    status: 0,
                    duration: Date.now() - start,
                    type: 'fetch'
                });
                throw error;
            }
        };

        // 拦截XHR
        window.XMLHttpRequest = class extends originalXHR {
            constructor() {
                super();
                this._startTime = 0;
                this._method = 'GET';
                this._url = '';
            }

            open(method, url) {
                this._method = method.toUpperCase();
                this._url = url;
                super.open(method, url);
            }

            send(data) {
                this._startTime = Date.now();
                this.addEventListener('loadend', () => {
                    logNetworkRequest({
                        url: this._url,
                        method: this._method,
                        status: this.status || 0,
                        duration: Date.now() - this._startTime,
                        type: 'xhr'
                    });
                });
                super.send(data);
            }
        };

        const observer = new PerformanceObserver(list => {
            list.getEntries().forEach(entry => {
                logNetworkRequest({
                    url: entry.name,
                    method: 'GET',
                    status: entry.responseStatus || (entry.duration > 0 ? 200 : 0),
                    duration: entry.duration,
                    type: entry.initiatorType || 'resource'
                });
            });
        });

        performance.getEntriesByType('resource').forEach(entry => {
            logNetworkRequest({
                url: entry.name,
                method: 'GET',
                status: entry.responseStatus || (entry.duration > 0 ? 200 : 0),
                duration: entry.duration,
                type: entry.initiatorType || 'resource'
            });
        });

        observer.observe({ type: 'resource', buffered: true });

        return () => {
            window.fetch = originalFetch;
            window.XMLHttpRequest = originalXHR;
            observer.disconnect();
        };
    }

    function logNetworkRequest(data) {
        networkLogs.push(data);
        if (networkLogs.length > 200) networkLogs.shift();
    }

    function createNetworkMonitorWindow() {
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>网络监控 - ${document.title}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 10px; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { padding: 8px; border: 1px solid #ddd; text-align: left; }
                    tr:nth-child(even) { background-color: #f2f2f2; }
                    .status-200 { color: #28a745; }
                    .status-404 { color: #dc3545; }
                    .status-0 { color: #6c757d; }
                </style>
            </head>
            <body>
                <h2>网络请求监控 (${new Date().toLocaleString()})</h2>
                <table id="networkTable">
                    <thead><tr>
                        <th>方法</th><th>类型</th><th>状态</th><th>耗时</th><th>资源</th>
                    </tr></thead>
                    <tbody></tbody>
                </table>
                <script>
                    window.addEventListener('message', e => {
                        if (e.data.type === 'networkUpdate') {
                            const tbody = document.querySelector('#networkTable tbody');
                            tbody.innerHTML = e.data.logs.map(log => {
                                return '<tr>' +
                                    '<td>' + log.method + '</td>' +
                                    '<td>' + log.type + '</td>' +
                                    '<td class="status-' + log.status + '">' + 
                                        (log.status || 'pending') + '</td>' +
                                    '<td>' + log.duration.toFixed(1) + 'ms</td>' +
                                    '<td style="max-width:400px;overflow:hidden;text-overflow:ellipsis">' + 
                                        log.url + '</td>' +
                                '</tr>';
                            }).join('');
                        }
                    });
                </script>
            </body>
            </html>
        `;

        networkWindow = window.open(
            'about:blank',
            'networkMonitor',
            'width=800,height=600,scrollbars=yes'
        );
        networkWindow.document.write(htmlContent);
        networkWindow.document.close();


        const updateInterval = setInterval(() => {
            if (!networkWindow || networkWindow.closed) {
                clearInterval(updateInterval);
                return;
            }
            networkWindow.postMessage({
                type: 'networkUpdate',
                logs: networkLogs.slice(-50) 
            }, '*');
        }, 500);
    }

    function toggleElementInspector() {
        if(state.activeInspector) {
            disableElementInspector();
        } else {
            enableElementInspector();
        }
    }

    function enableElementInspector() {
        state.activeInspector = {
            highlight: document.createElement('div'),
            infoBox: createInfoBox()
        };

        Object.assign(state.activeInspector.highlight.style, {
            position: 'fixed',
            border: '2px solid #ff0000',
            pointerEvents: 'none',
            zIndex: 99999,
            display: 'none'
        });

        document.body.appendChild(state.activeInspector.highlight);
        document.body.appendChild(state.activeInspector.infoBox);

        document.addEventListener('mousemove', handleElementHover);
        document.addEventListener('click', handleElementSelect);
    }

    function disableElementInspector() {
        document.removeEventListener('mousemove', handleElementHover);
        document.removeEventListener('click', handleElementSelect);
        state.activeInspector.highlight.remove();
        state.activeInspector.infoBox.remove();
        state.activeInspector = null;
    }

    function handleElementHover(e) {
        const element = document.elementFromPoint(e.clientX, e.clientY);
        if(!element) return;

        const rect = element.getBoundingClientRect();
        const highlight = state.activeInspector.highlight;
        
        highlight.style.display = 'block';
        highlight.style.width = `${rect.width}px`;
        highlight.style.height = `${rect.height}px`;
        highlight.style.left = `${rect.left}px`;
        highlight.style.top = `${rect.top}px`;
        
        state.activeInspector.infoBox.innerHTML = `
            <div>标签: ${element.tagName}</div>
            <div>ID: ${element.id || 'N/A'}</div>
            <div>类名: ${element.className || 'N/A'}</div>
            <div>尺寸: ${rect.width}×${rect.height}</div>
        `;
    }

    function handleElementSelect(e) {
        e.preventDefault();
        const element = document.elementFromPoint(e.clientX, e.clientY);
        console.log('选中元素:', element);
        element.style.outline = '2px dashed #00ff00';
    }

    function createInfoBox() {
        const box = document.createElement('div');
        Object.assign(box.style, {
            position: 'fixed',
            top: '10px',
            left: '10px',
            background: 'rgba(0,0,0,0.8)',
            color: '#fff',
            padding: '8px',
            borderRadius: '4px',
            zIndex: 99999,
            fontSize: '12px'
        });
        return box;
    }

    function showScriptInjector() {
        const url = prompt('请输入要注入的脚本URL:', 'https://example.com/script.js');
        if(url) {
            const script = document.createElement('script');
            script.src = url;
            script.onload = () => alert('✅ 脚本注入成功');
            script.onerror = () => alert('❌ 脚本加载失败');
            document.head.appendChild(script);
        }
    }

    function initPerformanceMonitor() {
        const perfData = {
            timing: performance.timing,
            memory: performance.memory,
            entries: performance.getEntries()
        };
        
        const win = window.open('', '_blank');
        win.document.write(`
            <html>
            <head>
                <title>性能分析 - ${document.title}</title>
                <style>
                    pre { background: #f5f5f5; padding: 20px; }
                </style>
            </head>
            <body>
                <h2>性能分析报告</h2>
                <pre>${JSON.stringify(perfData, null, 2)}</pre>
            </body>
            </html>
        `);
    }

    // 普通版功能 ----
    function showSourceViewer() {
        const content = document.documentElement.outerHTML;
        const win = window.open('', '_blank');
        win.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>源码查看 - ${document.title}</title>
                <style>
                    ${getCodeViewerStyle()}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="toolbar">
                        <button onclick="toggleViewMode()">切换视图</button>
                        <button onclick="copyCode()">复制代码</button>
                    </div>
                    <pre id="codeContent">${escapeHtml(content)}</pre>
                </div>
                <script>
                    let isOriginal = false;
                    function toggleViewMode() {
                        isOriginal = !isOriginal;
                        fetchOriginalSource().then(text => {
                            document.getElementById('codeContent').innerHTML = 
                                isOriginal ? text : \`${escapeHtml(content)}\`;
                        });
                    }
                    function copyCode() {
                        navigator.clipboard.writeText(document.getElementById('codeContent').textContent);
                    }
                    function fetchOriginalSource() {
                        return fetch(window.opener.location.href)
                            .then(r => r.text())
                            .then(t => t.replace(/</g, '&lt;').replace(/>/g, '&gt;'));
                    }
                </script>
            </body>
            </html>
        `);
    }

    function initEruda() {
        if (!window.eruda) {
            const script = document.createElement('script');
            script.src = 'https://gcore.jsdelivr.net/npm/eruda@3.4.1/eruda.min.js';
            script.onload = () => {
                eruda.init();
                eruda.show();
            };
            document.body.appendChild(script);
        } else {
            eruda.show();
        }
    }

    function advancedReload() {
        const timestamp = Date.now();
        location.href = location.origin + location.pathname + `?forceReload=${timestamp}`;
    }

    // 工具函数 ----
    function togglePanel(panel, show) {
        panel.style.opacity = show ? '1' : '0';
        panel.style.transform = show ? 'translateY(0)' : 'translateY(20px)';
        panel.style.pointerEvents = show ? 'auto' : 'none';
    }

    function escapeHtml(html) {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML
            .replace(/ /g, '&nbsp;')
            .replace(/\n/g, '<br>')
            .replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
    }

    function getCodeViewerStyle() {
        return `
            :root {
                --bg-color: #1e1e1e;
                --text-color: #dcdcdc;
                --accent-color: #569cd6;
            }
            body {
                margin: 0;
                background: var(--bg-color);
                color: var(--text-color);
                font-family: Consolas, monospace;
            }
            .container {
                max-width: 1200px;
                margin: 20px auto;
                padding: 20px;
            }
            .toolbar {
                margin-bottom: 15px;
                display: flex;
                gap: 10px;
            }
            button {
                padding: 8px 16px;
                background: #3e3e42;
                border: 1px solid #565656;
                color: white;
                cursor: pointer;
                border-radius: 4px;
                transition: 0.3s;
            }
            button:hover {
                background: var(--accent-color);
                border-color: var(--accent-color);
            }
            pre {
                padding: 20px;
                background: #252526;
                border-radius: 8px;
                overflow-x: auto;
                line-height: 1.5;
                tab-size: 4;
            }
            pre::selection {
                background: #264f78;
            }
        `;
    }

    // 全局事件监听
    document.addEventListener('click', (e) => {
        if (!floatBtn.contains(e.target) && !controlPanel.contains(e.target)) {
            togglePanel(controlPanel, false);
        }
    });

    document.addEventListener('keydown', (e) => {
        if(e.ctrlKey && e.key === 'm') {
            floatBtn.click();
        }
    });

})();