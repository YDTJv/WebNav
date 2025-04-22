// 获取DOM元素
const dataList = document.getElementById('dataList');
const dataSelection = document.getElementById('dataSelection');
const refreshDataBtn = document.getElementById('refreshDataBtn');
const sendRequestBtn = document.getElementById('sendRequestBtn');
const uploadKeyBtn = document.getElementById('uploadKeyBtn');
const getEncDataBtn = document.getElementById('getEncDataBtn');
const logoutBtn = document.getElementById('logoutBtn');
const usernameSpan = document.getElementById('username');

// 检查登录状态
function checkLogin() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const userType = sessionStorage.getItem('userType');

    if (!isLoggedIn || userType !== 'receiver') {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// 如果未登录，直接返回
if (!checkLogin()) {
    throw new Error('未登录或用户类型不正确');
}

// 从sessionStorage获取服务器地址和用户信息
const serverAddress = sessionStorage.getItem('serverAddress');
const username = sessionStorage.getItem('username');

// 显示用户名
usernameSpan.textContent = username;

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
        case 'info':
            icon = 'info-circle';
            break;
    }

    popup.innerHTML = `
        <i class="fas fa-${icon} icon"></i>
        <span class="message">${message}</span>
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

// 处理数据列表
function processDataInfo(senderInfo) {
    // 创建数据ID到发送者的映射
    const dataMap = new Map();
    
    senderInfo.forEach(sender => {
        if (!Array.isArray(sender.data_info)) return; // 跳过没有 data_info 的

        sender.data_info.forEach(dataId => {
            if (!dataMap.has(dataId)) {
                dataMap.set(dataId, new Set());
            }
            dataMap.get(dataId).add(sender.username);
        });
    });

    // 清空现有列表
    dataList.innerHTML = '';
    dataSelection.innerHTML = '';

    // 按数据ID排序
    const sortedDataIds = Array.from(dataMap.keys()).sort();

    if (sortedDataIds.length === 0) {
        dataList.innerHTML = '<div class="empty-message">暂无可用数据</div>';
        return;
    }

    // 渲染数据列表和选择框
    sortedDataIds.forEach(dataId => {
        const senders = Array.from(dataMap.get(dataId));

        // 添加到数据列表
        const dataItem = document.createElement('div');
        dataItem.className = 'data-item';
        dataItem.innerHTML = `
            <div class="data-id">${dataId}</div>
            <div class="sender-list">
                ${senders.map(sender => `
                    <span class="sender-tag">${sender}</span>
                `).join('')}
            </div>
        `;
        dataList.appendChild(dataItem);

        // 添加到选择框
        const checkboxDiv = document.createElement('div');
        checkboxDiv.className = 'data-checkbox';
        checkboxDiv.innerHTML = `
            <input type="checkbox" id="data_${dataId}" value="${dataId}">
            <label for="data_${dataId}">${dataId}</label>
        `;
        dataSelection.appendChild(checkboxDiv);
    });
}

// 加载数据列表
async function loadDataList() {
    try {
        showMessage('info', '正在获取数据列表...');

        const response = await fetch(`${serverAddress}/receiver/get_data_info`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Username': username
            }
        });

        const data = await response.json();

        if (data.status === "success") {
            processDataInfo(data.sender_info);
            showMessage('success', '数据列表获取成功');
        } else {
            showMessage('error', data.message || '获取数据列表失败');
        }
    } catch (error) {
        console.error('请求出错:', error);
        showMessage('error', '服务器连接失败，请稍后重试');
    }
}

// 发送数据请求
async function sendDataRequest() {
    // 获取选中的数据ID
    const selectedIds = Array.from(dataSelection.querySelectorAll('input[type="checkbox"]:checked'))
        .map(checkbox => checkbox.value);

    if (selectedIds.length === 0) {
        showMessage('error', '请选择要请求的数据');
        return;
    }

    try {
        showMessage('info', '正在发送数据请求...');

        const response = await fetch(`${serverAddress}/receiver/send_data_id`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Username': username
            },
            body: JSON.stringify({
                username: username,
                data_id: selectedIds
            })
        });

        const data = await response.json();

        if (data.status === "success") {
            showMessage('success', '数据请求发送成功');
        } else {
            showMessage('error', data.message || '发送请求失败');
        }
    } catch (error) {
        console.error('请求出错:', error);
        showMessage('error', '服务器连接失败，请稍后重试');
    }
}

// 上传公钥
function uploadPublicKey() {
    // 创建弹窗
    const modalHtml = `
        <div class="card" id="uploadKeyModal" style="margin-top: 2rem;">
            <div class="card-header">
                <h2 class="card-title">上传公钥</h2>
                <button class="close-btn" id="closeKeyModal" style="background: none; border: none; color: var(--text-light); cursor: pointer; padding: 0.5rem;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="card-body">
                <div class="form-group">
                    <label style="display: block; margin-bottom: 0.5rem; color: var(--text-light);">请输入公钥：</label>
                    <textarea id="publicKeyInput" 
                        style="width: 100%; 
                        height: 150px; 
                        background: var(--input-bg); 
                        color: var(--text-light); 
                        border: 1px solid rgba(255, 255, 255, 0.1); 
                        border-radius: 6px; 
                        padding: 0.5rem; 
                        resize: none;
                        font-family: monospace;" 
                        placeholder="在此粘贴公钥..."></textarea>
                </div>
                <div class="form-actions" style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem;">
                    <button class="operation-btn" id="cancelUpload" 
                        style="background: rgba(255, 255, 255, 0.1);">
                        <i class="fas fa-times"></i>
                        取消
                    </button>
                    <button class="operation-btn key-btn" id="confirmUpload">
                        <i class="fas fa-key"></i>
                        上传公钥
                    </button>
                </div>
            </div>
        </div>
    `;

    // 添加弹窗到页面
    const rightSection = document.querySelector('.right-section');
    rightSection.insertAdjacentHTML('beforeend', modalHtml);

    // 获取弹窗元素
    const uploadModal = document.getElementById('uploadKeyModal');
    const closeKeyModal = document.getElementById('closeKeyModal');
    const cancelUpload = document.getElementById('cancelUpload');
    const confirmUpload = document.getElementById('confirmUpload');
    const publicKeyInput = document.getElementById('publicKeyInput');

    // 关闭弹窗函数
    const closeModal = () => {
        uploadModal.remove();
    };

    // 关闭弹窗事件
    closeKeyModal.addEventListener('click', closeModal);
    cancelUpload.addEventListener('click', closeModal);

    // 上传公钥事件
    confirmUpload.addEventListener('click', async () => {
        const publicKey = publicKeyInput.value.trim();
        
        if (!publicKey) {
            showMessage('error', '请输入公钥');
            return;
        }

        try {
            const response = await fetch(`${serverAddress}/receiver/send_public_key`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Username': username
                },
                body: JSON.stringify({
                    username: username,
                    public_key: publicKey
                })
            });

            const data = await response.json();

            if (data.status === "success") {
                showMessage('success', '公钥上传成功');
                closeModal();
            } else {
                showMessage('error', data.message || '公钥上传失败');
            }
        } catch (error) {
            showMessage('error', '服务器连接失败，请稍后重试');
        }
    });
}

// 获取数据进度
async function getDataProgress() {
    try {
        showMessage('info', '正在获取数据进度...');

        const response = await fetch(`${serverAddress}/receiver/get_enc_data?username=${username}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Username': username
            }
        });

        const data = await response.json();

        if (data.status === "success") {
            showDataProgressModal(data.all_enc_data);
        } else {
            showMessage('error', data.message || '获取数据进度失败');
        }
    } catch (error) {
        console.error('请求出错:', error);
        showMessage('error', '服务器连接失败，请稍后重试');
    }
}

// 显示数据进度弹窗
function showDataProgressModal(allEncData) {
    // 创建弹窗HTML
    const modalHtml = `
        <div class="card" id="dataProgressModal" style="margin-top: 2rem;">
            <div class="card-header">
                <h2 class="card-title">数据进度</h2>
                <button class="close-btn" id="closeProgressModal" style="background: none; border: none; color: var(--text-light); cursor: pointer; padding: 0.5rem;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="card-body">
                <div class="data-progress-list">
                    ${Object.entries(allEncData).map(([dataId, dataList]) => `
                        <div class="data-progress-item">
                            <input type="radio" name="dataId" id="data_${dataId}" value="${dataId}" 
                                ${dataList.length > 0 ? '' : 'disabled'}>
                            <label for="data_${dataId}">
                                ${dataId}
                                <span class="status-tag ${dataList.length > 0 ? 'ready' : 'pending'}">
                                    ${dataList.length > 0 ? '加密文件准备就绪' : '加密文件尚未收集完成'}
                                </span>
                            </label>
                        </div>
                    `).join('')}
                </div>
                <div class="form-actions" style="display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem;">
                    <button class="operation-btn download-btn" id="downloadEncData" disabled>
                        <i class="fas fa-download"></i>
                        获取加密数据包
                    </button>
                </div>
            </div>
        </div>
    `;

    // 移除已存在的弹窗
    const existingModal = document.getElementById('dataProgressModal');
    if (existingModal) {
        existingModal.remove();
    }

    // 添加弹窗到右侧区域
    const rightSection = document.querySelector('.right-section');
    rightSection.insertAdjacentHTML('beforeend', modalHtml);

    // 获取弹窗元素
    const progressModal = document.getElementById('dataProgressModal');
    const closeProgressModal = document.getElementById('closeProgressModal');
    const downloadEncData = document.getElementById('downloadEncData');
    const dataIdRadios = progressModal.querySelectorAll('input[type="radio"]');

    // 关闭弹窗函数
    const closeModal = () => {
        progressModal.remove();
    };

    // 关闭弹窗事件
    closeProgressModal.addEventListener('click', closeModal);

    // 监听单选按钮变化
    dataIdRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            downloadEncData.disabled = !radio.checked;
        });
    });

    // 下载加密数据包
    downloadEncData.addEventListener('click', () => {
        const selectedDataId = progressModal.querySelector('input[type="radio"]:checked')?.value;
        if (!selectedDataId) return;

        const dataList = allEncData[selectedDataId];
        if (dataList.length === 0) return;

        // 将数据列表转换为Base64字符串
        const jsonString = JSON.stringify(dataList);
        const utf8Bytes = new TextEncoder().encode(jsonString);
        const base64String = btoa(String.fromCharCode(...utf8Bytes));

        // 创建并下载文件
        const blob = new Blob([base64String], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `encrypted_data_${selectedDataId}_${new Date().getTime()}.bin`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showMessage('success', '加密数据包下载成功');
        closeModal();
    });
}

// 退出登录
logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('userType');
    sessionStorage.removeItem('isLoggedIn');
    window.location.href = 'login.html';
});

// 事件监听器
refreshDataBtn.addEventListener('click', loadDataList);
sendRequestBtn.addEventListener('click', sendDataRequest);
uploadKeyBtn.addEventListener('click', uploadPublicKey);
getEncDataBtn.addEventListener('click', getDataProgress);

// 页面加载时初始化
window.addEventListener('load', () => {
    if (checkLogin()) {
        loadDataList();
    }
});



