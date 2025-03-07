// ==UserScript==
// @name         MengZe Tool Pro
// @namespace    https://mengze.vip/
// @version      0.7.2Beta
// @description  Professional debugging toolkit with enhanced features
// @author       MengZe2
// @run-at       document-end
// @match        https://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_openInTab
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// @connect      *
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    const state = {
        darkMode: GM_getValue('darkMode', false),
        networkMonitor: false,
        activeInspector: null,
        currentTheme: GM_getValue('theme', 'default'),
        interceptRequests: GM_getValue('interceptRequests', false),
        shortcutKey: GM_getValue('shortcutKey', 'Ctrl+M'),
        errorMonitor: true
    };

    let networkLogs = [];
    let networkWindow = null;
    let stopNetworkMonitoring = null;
    let originalFetch = window.fetch;
    let originalXHR = window.XMLHttpRequest;

    const floatBtn = createFloatButton();
    const controlPanel = createControlPanel();
    document.body.appendChild(floatBtn);
    document.body.appendChild(controlPanel);

    initTheme();
    registerShortcut();
    initErrorMonitoring();

    function initTheme() {
        const themes = {
            default: { bg: '#fff', text: '#000', btn: '#f5f5f5' },
            dark: { bg: '#2d2d2d', text: '#fff', btn: '#3a3a3a' },
            blue: { bg: '#1a365f', text: '#fff', btn: '#2a4a7f' }
        };

        GM_addStyle(`
            .mengze-tool-panel {
                background: ${themes[state.currentTheme].bg} !important;
                color: ${themes[state.currentTheme].text} !important;
                min-width: 220px;
                max-height: 80vh;
                overflow-y: auto;
            }
            .mengze-btn {
                background: ${themes[state.currentTheme].btn} !important;
                color: ${themes[state.currentTheme].text} !important;
                border: 1px solid ${themes[state.currentTheme].text}20 !important;
            }
            .mengze-btn:hover {
                filter: brightness(1.2);
            }
        `);
    }

    function createFloatButton() {
        const btn = document.createElement('div');
        btn.innerHTML = '<span style="font-size:24px">🛠️</span>';
        Object.assign(btn.style, {
            position: 'fixed',
            right: '20px',
            bottom: '20px',
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            background: 'linear-gradient(145deg, #6a5acd, #836fff)',
            cursor: 'pointer',
            boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        });

        btn.addEventListener('mouseover', () => {
            btn.style.transform = 'scale(1.1) rotate(15deg)';
            btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
        });

        btn.addEventListener('mouseout', () => {
            btn.style.transform = 'scale(1) rotate(0deg)';
            btn.style.boxShadow = '0 2px 5px rgba(0,0,0,0.3)';
        });

        btn.addEventListener('click', () => {
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
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        opacity: '0',
        transform: 'translateY(20px)',
        transition: 'opacity 0.3s, transform 0.3s',
        pointerEvents: 'none',
        zIndex: 9999,
        padding: '10px'
    });

    const featureGroups = [
        {
            title: '调试工具',
            features: [
                { name: '开启Debug', action: initEruda },
                { name: '高级刷新', action: advancedReload },
                { name: '存储管理', action: showStorageManager },
                { name: 'Cookie管理', action: showCookieManager },
                { name: '查看源码', action: showSourceViewer }
            ]
        },
        {
            title: '监控工具',
            features: [
                { name: '请求拦截', action: toggleRequestInterceptor },
                { name: '元素截图(Beta)', action: initElementScreenshot },
                { name: '性能分析', action: initPerformanceMonitor },
                { name: '网络监控', action: toggleNetworkMonitor },
                { name: '元素检查', action: toggleElementInspector },
                { name: '脚本注入', action: showScriptInjector }
            ]
        },
        {
            title: '其它',
            features: [
                { name: '主题切换', action: switchTheme },
                { name: '隐藏面板', action: () => togglePanel(panel, false) }
            ]
        }
    ];

    featureGroups.forEach(group => {
        const section = document.createElement('div');
        section.innerHTML = `<h4 style="margin:10px 0 5px;color:#666">${group.title}</h4>`;
        
        group.features.forEach(feat => {
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
            
            section.appendChild(btn);
        });
        
        panel.appendChild(section);
    });

    return panel;
}

    // 核心功能实现 ----
    function toggleDarkMode() {
        state.darkMode = !state.darkMode;
        GM_setValue('darkMode', state.darkMode);
        initTheme();
    }

    function switchTheme() {
        const themes = ['default', 'dark', 'blue'];
        const currentIndex = themes.indexOf(state.currentTheme);
        state.currentTheme = themes[(currentIndex + 1) % themes.length];
        GM_setValue('theme', state.currentTheme);
        initTheme();
    }

    function showStorageManager() {
        const win = window.open('', '_blank');
        win.document.write(`
            <html><head><title>存储管理 - ${document.title}</title>
            <style>
                table { width: 100%; border-collapse: collapse; margin: 10px 0 }
                th, td { padding: 8px; border: 1px solid #ddd; }
                .actions { display: flex; gap: 5px; }
                button { padding: 5px 10px; cursor: pointer; }
            </style></head>
            <body>
                <h3>LocalStorage 管理</h3>
                <table id="localStorageTable">
                    <thead><tr><th>键</th><th>值</th><th>操作</th></tr></thead>
                    <tbody></tbody>
                </table>
                <button onclick="addNewItem('local')">新增</button>

                <h3>SessionStorage 管理</h3>
                <table id="sessionStorageTable">
                    <thead><tr><th>键</th><th>值</th><th>操作</th></tr></thead>
                    <tbody></tbody>
                </table>
                <button onclick="addNewItem('session')">新增</button>

                <script>
                    function updateStorageView() {
                        updateTable('local', window.opener.localStorage);
                        updateTable('session', window.opener.sessionStorage);
                    }

                    function updateTable(type, storage) {
                        const tbody = document.querySelector(\`#\${type}StorageTable tbody\`);
                        tbody.innerHTML = Object.keys(storage).map(key => {
                            return \`<tr>
                                <td>\${key}</td>
                                <td><input value="\${storage[key]}" 
                                     onchange="updateItem('\${type}', '\${key}', this.value)"></td>
                                <td class="actions">
                                    <button onclick="deleteItem('\${type}', '\${key}')">删除</button>
                                </td>
                            </tr>\`;
                        }).join('');
                    }

                    function addNewItem(type) {
                        const key = prompt('请输入键名：');
                        if (key) {
                            const value = prompt('请输入键值：');
                            window.opener[type + 'Storage'].setItem(key, value);
                            updateStorageView();
                        }
                    }

                    function updateItem(type, key, value) {
                        window.opener[type + 'Storage'].setItem(key, value);
                    }

                    function deleteItem(type, key) {
                        window.opener[type + 'Storage'].removeItem(key);
                        updateStorageView();
                    }

                    updateStorageView();
                    setInterval(updateStorageView, 1000);
                </script>
            </body></html>
        `);
    }

    function showCookieManager() {
        const cookies = document.cookie.split(';').reduce((acc, cookie) => {
            const [name, ...rest] = cookie.split('=');
            acc[name.trim()] = rest.join('=');
            return acc;
        }, {});

        const win = window.open('', '_blank');
        win.document.write(`
            <html><head><title>Cookie管理 - ${document.title}</title>
            <style>
                table { width: 100%; border-collapse: collapse; }
                input { width: 95%; padding: 5px; }
                td { padding: 8px; }
            </style></head>
            <body>
                <h3>当前Cookies (${document.domain})</h3>
                <table>
                    <thead><tr><th>名称</th><th>值</th></tr></thead>
                    <tbody>
                        ${Object.entries(cookies).map(([name, value]) => `
                            <tr>
                                <td>${name}</td>
                                <td><input value="${value}" 
                                     onchange="updateCookie('${name}', this.value)"></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                <script>
                    function updateCookie(name, value) {
                        document.cookie = \`\${name}=\${value}; path=/; domain=${document.domain}\`;
                    }
                </script>
            </body></html>
        `);
    }

    function toggleRequestInterceptor() {
        state.interceptRequests = !state.interceptRequests;
        GM_setValue('interceptRequests', state.interceptRequests);

        if (state.interceptRequests) {
            window.fetch = async (...args) => {
                const url = typeof args[0] === 'string' ? args[0] : args[0].url;
                const shouldBlock = confirm(`拦截fetch请求：\nURL: ${url} \n允许此请求？`);
                if (!shouldBlock) return new Response(null, { status: 403 });
                return originalFetch(...args);
            };

            window.XMLHttpRequest = class extends originalXHR {
                open(method, url) {
                    const shouldBlock = confirm(`拦截XHR请求：\n方法: ${method} \nURL: ${url}`);
                    if (shouldBlock) super.open(method, url);
                    else this.abort();
                }
            };
        } else {
            window.fetch = originalFetch;
            window.XMLHttpRequest = originalXHR;
        }
    }

    function registerShortcut() {
        document.addEventListener('keydown', (e) => {
            const keys = state.shortcutKey.split('+');
            const ctrlMatch = keys.includes('Ctrl') && e.ctrlKey;
            const shiftMatch = keys.includes('Shift') && e.shiftKey;
            const keyMatch = keys.some(k => k.length === 1 && 
                k.toUpperCase() === e.key.toUpperCase());

            if (ctrlMatch && shiftMatch && keyMatch) {
                floatBtn.click();
            }
        });
    }

    function initErrorMonitoring() {
        window.addEventListener('error', (e) => {
            if (state.errorMonitor) {
                showNotification(`脚本错误：\${e.message}`, 'error');
            }
        });
    }

    function showNotification(message, type = 'info') {
        const notify = document.createElement('div');
        notify.textContent = message;
        Object.assign(notify.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px',
            background: type === 'error' ? '#dc3545' : '#007bff',
            color: 'white',
            borderRadius: '5px',
            zIndex: 100000,
            animation: 'slideIn 0.3s ease-out'
        });

        GM_addStyle(`
            @keyframes slideIn {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
            }
        `);

        document.body.appendChild(notify);
        setTimeout(() => {
            notify.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => notify.remove(), 300);
        }, 2700);
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
            <style>
            body { font-family: Arial, sans-serif; margin: 10px; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { padding: 8px; border: 1px solid #ddd; text-align: left; }
                    tr:nth-child(even) { background-color: #f2f2f2; }
                    .status-200 { color: #28a745; }
                    .status-404 { color: #dc3545; }
                    .status-0 { color: #6c757d; }
                .filter-bar {
                    margin: 10px 0;
                    display: flex;
                    gap: 10px;
                }
                .status-filter {
                    display: flex;
                    gap: 5px;
                }
            </style>
        </head>
        <body>
        <h2>网络请求监控 (${new Date().toLocaleString()})</h2>
            <div class="filter-bar">
                <input type="text" id="search" placeholder="搜索URL...">
                <div class="status-filter">
                    <label><input type="checkbox" value="2xx"> 2xx</label>
                    <label><input type="checkbox" value="4xx"> 4xx</label>
                    <label><input type="checkbox" value="5xx"> 5xx</label>
                </div>
            </div>
            
                <table id="networkTable">
                    <thead><tr>
                        <th>方法</th><th>类型</th><th>状态</th><th>耗时</th><th>资源</th>
                    </tr></thead>
                    <tbody></tbody>
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
                    
                function filterTable() {
                    const searchTerm = document.getElementById('search').value.toLowerCase();
                    const statusFilters = [...document.querySelectorAll('.status-filter input:checked')]
                        .map(c => c.value);
                    
                    filteredLogs = originalLogs.filter(log => {
                        const matchesSearch = log.url.toLowerCase().includes(searchTerm);
                        const matchesStatus = statusFilters.length === 0 || 
                            statusFilters.some(f => {
                                if(f === '2xx') return log.status >= 200 && log.status < 300;
                                if(f === '4xx') return log.status >= 400 && log.status < 500;
                                if(f === '5xx') return log.status >= 500;
                                return false;
                            });
                        return matchesSearch && matchesStatus;
                    });
                    
                    renderTable(filteredLogs);
                }
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
        console.info('选中元素:', element);
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
    
function initElementScreenshot() {
    if (typeof html2canvas !== 'function') {
        const script = document.createElement('script');
        script.src = 'https://cdn.mengze.vip/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
        script.integrity = 'sha512-s/XK4vYVXTGeUSv4bRPOuxSDmDlTedEpMEcAQk0t/FMd9V6ftXaciS0B4qI9aHEOtGDZVB8uB43gddBw8KPsA==';
        script.crossOrigin = 'anonymous';
        script.referrerPolicy = 'no-referrer';
        
        const loadToast = showNotification('正在加载截图库...', 'loading', 3000);
        
        script.onload = () => {
            loadToast.remove();
            setupScreenshotUI();
        };
        script.onerror = () => {
            loadToast.remove();
            showNotification('截图库加载失败，请检查网络', 'error');
        };
        
        document.head.appendChild(script);
    } else {
        setupScreenshotUI();
    }

    function setupScreenshotUI() {
        const overlay = document.createElement('div');
        Object.assign(overlay.style, {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.7)',
            zIndex: 100000,
            cursor: 'crosshair'
        });

        const guideBox = document.createElement('div');
        Object.assign(guideBox.style, {
            position: 'absolute',
            border: '2px dashed #ff0000',
            pointerEvents: 'none',
            display: 'none',
            boxShadow: '0 0 10px rgba(255,255,255,0.5)'
        });

        const statusBar = document.createElement('div');
        Object.assign(statusBar.style, {
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            color: '#fff',
            background: 'rgba(0,0,0,0.8)',
            padding: '8px 16px',
            borderRadius: '4px',
            fontSize: '14px'
        });
        statusBar.textContent = '点击选择要截图的元素 | ESC取消';

        overlay.appendChild(guideBox);
        overlay.appendChild(statusBar);
        document.body.appendChild(overlay);

        const keyHandler = (e) => {
            if (e.key === 'Escape') {
                cleanup();
            }
        };
        document.addEventListener('keydown', keyHandler);

        const moveHandler = (e) => {
            const element = document.elementFromPoint(e.clientX, e.clientY);
            if (element) {
                const rect = element.getBoundingClientRect();
                guideBox.style.display = 'block';
                guideBox.style.width = `${rect.width}px`;
                guideBox.style.height = `${rect.height}px`;
                guideBox.style.left = `${rect.left}px`;
                guideBox.style.top = `${rect.top}px`;
            }
        };
        overlay.addEventListener('mousemove', moveHandler);

        const clickHandler = async (e) => {
            const element = document.elementFromPoint(e.clientX, e.clientY);
            if (element) {
                try {
                    statusBar.textContent = '正在生成截图...';
                    statusBar.style.color = '#4CAF50';
                    
                    const canvas = await html2canvas(element, {
                        useCORS: true,
                        logging: false,
                        scale: window.devicePixelRatio
                    });
                    
                    const preview = document.createElement('div');
                    Object.assign(preview.style, {
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: '#fff',
                        padding: '10px',
                        borderRadius: '8px',
                        zIndex: 100001,
                        boxShadow: '0 0 20px rgba(0,0,0,0.3)'
                    });

                    const img = new Image();
                    img.src = canvas.toDataURL('image/png');
                    img.style.maxWidth = '80vw';
                    img.style.maxHeight = '80vh';
                    img.style.borderRadius = '4px';

                    const btnGroup = document.createElement('div');
                    btnGroup.style.marginTop = '10px';
                    btnGroup.style.textAlign = 'center';

                    const downloadBtn = createActionButton('下载', '#4CAF50', () => {
                        const a = document.createElement('a');
                        a.download = `screenshot-${Date.now()}.png`;
                        a.href = img.src;
                        a.click();
                    });

                    const closeBtn = createActionButton('关闭', '#f44336', () => {
                        preview.remove();
                        cleanup();
                    });

                    btnGroup.append(downloadBtn, closeBtn);
                    preview.append(img, btnGroup);
                    document.body.appendChild(preview);

                } catch (err) {
                    showNotification(`截图失败: ${err.message}`, 'error');
                    cleanup();
                }
            }
        };
        overlay.addEventListener('click', clickHandler);

        function cleanup() {
            document.removeEventListener('keydown', keyHandler);
            overlay.removeEventListener('mousemove', moveHandler);
            overlay.removeEventListener('click', clickHandler);
            overlay.remove();
        }
    }

    function createActionButton(text, color, handler) {
        const btn = document.createElement('button');
        btn.textContent = text;
        Object.assign(btn.style, {
            padding: '8px 16px',
            margin: '0 5px',
            border: 'none',
            borderRadius: '4px',
            background: color,
            color: 'white',
            cursor: 'pointer',
            transition: 'opacity 0.2s'
        });
        btn.addEventListener('click', handler);
        btn.addEventListener('mouseover', () => btn.style.opacity = '0.8');
        btn.addEventListener('mouseout', () => btn.style.opacity = '1');
        return btn;
    }
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

})();