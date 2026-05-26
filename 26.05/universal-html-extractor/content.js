(function () {
    // 阻止在一些极小的非网页区域（如空白统计像素）重复生成
    if (window.innerWidth < 100 || window.innerHeight < 100) return;

    // 声明一个全局唯一的 ID 标识，防止重复注入
    const UNIQUE_ID = 'universal-html-dumper-root';
    if (document.getElementById(UNIQUE_ID)) return;

    // 创建悬浮触发按钮
    const triggerBtn = document.createElement('div');
    triggerBtn.id = UNIQUE_ID;
    triggerBtn.innerText = '⚙️ 抓取HTML';
    triggerBtn.style.cssText = `
        position: fixed !important;
        bottom: 20px !important;
        right: 20px !important;
        width: 90px !important;
        height: 35px !important;
        background: #ff4757 !important;
        color: white !important;
        font-family: Arial, sans-serif !important;
        font-size: 12px !important;
        font-weight: bold !important;
        text-align: center !important;
        line-height: 35px !important;
        border-radius: 20px !important;
        cursor: pointer !important;
        z-index: 2147483647 !important; /* 确保在最顶层 */
        box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
        transition: all 0.2s ease !important;
        user-select: none !important;
    `;

    // 鼠标悬停动画
    triggerBtn.onmouseover = () => triggerBtn.style.transform = 'scale(1.05)';
    triggerBtn.onmouseout = () => triggerBtn.style.transform = 'scale(1)';

    // 点击按钮，弹出面板
    triggerBtn.onclick = function (e) {
        e.stopPropagation();
        openExtractorPanel();
    };

    document.body.appendChild(triggerBtn);

    function openExtractorPanel() {
        const PANEL_ID = 'universal-extractor-panel';
        if (document.getElementById(PANEL_ID)) return;

        // 获取当前的真实渲染 HTML
        let currentHTML = document.documentElement.outerHTML;
        let frameType = window.top === window.self ? "【主页面外壳】" : `【Iframe内部框架: ${window.location.host}】`;

        const panel = document.createElement('div');
        panel.id = PANEL_ID;
        panel.style.cssText = `
            position: fixed !important;
            bottom: 70px !important;
            right: 20px !important;
            width: 480px !important;
            height: 550px !important;
            background: #1e1e1e !important;
            color: #f4f4f4 !important;
            border: 3px solid #ff4757 !important;
            border-radius: 8px !important;
            padding: 15px !important;
            z-index: 2147483647 !important;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5) !important;
            font-family: Consolas, monospace !important;
            display: flex !important;
            flex-direction: column !important;
            box-sizing: border-box !important;
        `;

        panel.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom:1px solid #333; padding-bottom:5px;">
                <span style="color:#ff4757; font-weight:bold; font-size:14px;">🛸 真实 DOM 提取控制台</span>
                <span style="font-size:11px; color:#aaa;">${frameType}</span>
            </div>
            
            <div style="margin-bottom: 10px; display:flex; gap:5px;">
                <button id="btn-uni-dl" style="background:#2ed573; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-weight:bold; font-size:12px;">📥 下载当前框架 HTML</button>
                <button id="btn-uni-copy" style="background:#1e90ff; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:12px;">📋 复制全部</button>
                <button id="btn-uni-close" style="background:#57606f; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-size:12px; margin-left:auto;">关闭</button>
            </div>
            
            <p style="margin:0 0 5px 0; font-size:11px; color:#ffa502;">💡 提示：如果目标元素在嵌套的座位图或弹窗内，请直接点击该弹窗内部的红色齿轮按钮。</p>
            
            <textarea id="txt-uni-content" readonly style="flex:1 !important; width:100% !important; background:#2f3542 !important; color:#7bed9f !important; border:1px solid #57606f !important; font-family:monospace !important; font-size:11px !important; padding:8px !important; box-sizing:border-box !important; resize:none !important; white-space: pre !important; overflow: auto !important;"></textarea>
        `;

        document.body.appendChild(panel);

        const textarea = panel.querySelector('#txt-uni-content');
        textarea.value = currentHTML;

        // 事件：下载
        panel.querySelector('#btn-uni-dl').onclick = function () {
            const blob = new Blob([textarea.value], { type: 'text/html;charset=utf-8' });
            const a = document.createElement('a');
            const safeHost = window.location.host.replace(/[\.:]/g, '_');
            a.href = URL.createObjectURL(blob);
            a.download = `extracted_${safeHost}_dom.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        };

        // 事件：复制
        panel.querySelector('#btn-uni-copy').onclick = function () {
            textarea.select();
            document.execCommand('copy');
            alert('📋 代码已成功复制到剪贴板！');
        };

        // 事件：关闭
        panel.querySelector('#btn-uni-close').onclick = function () {
            panel.remove();
        };
    }
})();