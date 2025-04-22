// 检查是否已配置服务器地址
function checkServerConfig() {
    const serverAddress = sessionStorage.getItem('serverAddress');
    if (!serverAddress) {
        showServerConfigModal();
    }
}

// 显示服务器配置弹窗
function showServerConfigModal() {
    const modalHtml = `
        <div class="modal active" id="serverConfigModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">服务器配置</h3>
                </div>
                <div class="modal-body">
                    <form id="serverConfigForm">
                        <div class="form-group">
                            <label for="serverAddress">服务器地址：</label>
                            <input type="text" id="serverAddress" placeholder="例如：192.168.23.12:12333" required
                                style="width: 100%; background: var(--input-bg); color: var(--text-light); 
                                border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 6px; 
                                padding: 0.5rem; margin-top: 0.5rem;">
                        </div>
                        <div class="form-actions" style="margin-top: 1.5rem; display: flex; justify-content: flex-end; gap: 1rem;">
                            <button type="submit" class="submit-btn" style="background: var(--primary); color: white; 
                                padding: 0.5rem 1rem; border-radius: 6px; display: flex; align-items: center; gap: 0.5rem;">
                                <i class="fas fa-save"></i>
                                保存配置
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    // 添加弹窗样式
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }

        .modal-content {
            background: var(--card-bg);
            border-radius: 12px;
            padding: 2rem;
            width: 90%;
            max-width: 500px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .modal-header {
            margin-bottom: 1.5rem;
        }

        .modal-title {
            color: var(--text-light);
            font-size: 1.25rem;
            font-weight: 600;
        }

        .submit-btn:hover {
            background: var(--primary-dark) !important;
            transform: translateY(-1px);
        }

        .message-popup {
            position: fixed;
            top: 2rem;
            right: 2rem;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            background: white;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            display: flex;
            align-items: center;
            gap: 0.75rem;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        }

        .message-popup.success {
            background: var(--success);
            color: white;
        }

        .message-popup.error {
            background: var(--error);
            color: white;
        }

        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;

    // 添加样式和弹窗到页面
    document.head.appendChild(styleElement);
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // 获取表单元素
    const form = document.getElementById('serverConfigForm');

    // 处理表单提交
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const serverAddress = document.getElementById('serverAddress').value.trim();

        // 验证服务器地址格式
        const addressPattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?):\d+$/;
        if (!addressPattern.test(serverAddress)) {
            showMessage('error', '请输入有效的服务器地址和端口');
            return;
        }

        // 保存到 sessionStorage
        sessionStorage.setItem('serverAddress', `http://${serverAddress}`);
        
        // 显示成功消息
        showMessage('success', '服务器配置已保存');

        // 关闭弹窗
        document.getElementById('serverConfigModal').remove();
    });
}

// 显示消息提示
function showMessage(type, message) {
    // 移除现有的消息弹窗
    const existingPopup = document.querySelector('.message-popup');
    if (existingPopup) {
        existingPopup.remove();
    }

    // 创建新的消息弹窗
    const popup = document.createElement('div');
    popup.className = `message-popup ${type}`;

    // 根据类型设置图标
    let icon = '';
    switch (type) {
        case 'success':
            icon = 'check-circle';
            break;
        case 'error':
            icon = 'times-circle';
            break;
    }

    popup.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <span>${message}</span>
    `;

    // 添加到页面
    document.body.appendChild(popup);

    // 3秒后自动移除
    setTimeout(() => {
        if (popup && document.body.contains(popup)) {
            popup.remove();
        }
    }, 3000);
}

// 页面加载时检查配置
window.addEventListener('load', checkServerConfig); 