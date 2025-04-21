// 获取DOM元素
const addDataBtn = document.getElementById('addDataBtn');
const addDataModal = document.getElementById('addDataModal');
const closeModal = document.getElementById('closeModal');
const cancelAdd = document.getElementById('cancelAdd');
const addDataForm = document.getElementById('addDataForm');
const dataList = document.getElementById('dataList');
const logoutBtn = document.getElementById('logoutBtn');
const usernameSpan = document.getElementById('username');
const getPublicKeysBtn = document.getElementById('getPublicKeysBtn');
const publicKeyList = document.getElementById('publicKeyList');
const selectedData = document.getElementById('selectedData');
const selectedReceiver = document.getElementById('selectedReceiver');
const encryptBtn = document.getElementById('encryptBtn');
const sendBtn = document.getElementById('sendBtn');
const checkRequestsBtn = document.getElementById('checkRequestsBtn');
const requestDisplay = document.getElementById('requestDisplay');
const uploadDataBtn = document.getElementById('uploadDataBtn');
const loadDataBtn = document.getElementById('loadDataBtn');
const saveDataBtn = document.getElementById('saveDataBtn');
const loadFileInput = document.getElementById('loadFileInput');
const saveFileInput = document.getElementById('saveFileInput');
const encPackageInput = document.getElementById('encPackageInput');

// 内存中存储数据
let memoryData = [];

// 添加全局变量
let lastPublicKeyUpdateTime = null;

// 检查登录状态
function checkLogin() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userType = localStorage.getItem('userType');

    if (!isLoggedIn || userType !== 'sender') {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// 如果未登录，直接返回
if (!checkLogin()) {
    throw new Error('未登录或用户类型不正确');
}

// 从localStorage获取服务器地址和用户信息
const serverAddress = localStorage.getItem('serverAddress');
const username = localStorage.getItem('username');

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
        <i class="fas fa-times close"></i>
    `;

    // 添加到页面
    document.body.appendChild(popup);

    // 点击关闭按钮移除弹窗
    const closeBtn = popup.querySelector('.close');
    closeBtn.addEventListener('click', () => popup.remove());

    // 3秒后自动移除
    setTimeout(() => {
        if (popup && document.body.contains(popup)) {
            popup.remove();
        }
    }, 3000);
}

// 更新按钮状态
function updateButtonStates() {
    const hasDataSelected = selectedData.value !== '';
    const hasReceiverSelected = selectedReceiver.value !== '';
    
    encryptBtn.disabled = !(hasDataSelected && hasReceiverSelected);
    sendBtn.disabled = !(hasDataSelected && hasReceiverSelected);
}

// 将数字转换为15位十六进制字符串（前补零）
function numberToHex(number) {
    const hex = Number(number).toString(16).toUpperCase();
    return '0'.repeat(15 - hex.length) + hex;
}

// 将十六进制字符串转换回数字
function hexToNumber(hex) {
    return parseInt(hex, 16);
}

// 渲染数据列表
function renderDataList() {
    dataList.innerHTML = '';
    selectedData.innerHTML = '<option value="">请选择数据</option>';

    memoryData.forEach((item, index) => {
        // 添加到数据列表
        const dataItem = document.createElement('div');
        dataItem.className = 'data-item';
        dataItem.innerHTML = `
            <div class="data-info">
                <div class="data-name">${item.data_id}</div>
                <div class="data-value hidden" style="font-size: 19px;">${item.data_value}</div>
            </div>
            <div class="data-actions-group">
                <button class="toggle-btn" onclick="toggleDataValue(${index})">
                    <i class="fas fa-eye-slash"></i>
                </button>
            </div>
        `;
        dataList.appendChild(dataItem);

        // 添加到选择框
        const option = document.createElement('option');
        option.value = item.data_id;
        option.textContent = item.data_id;
        selectedData.appendChild(option);
    });
}

// 切换数据值显示/隐藏
window.toggleDataValue = function(index) {
    const dataItem = dataList.children[index];
    const dataValue = dataItem.querySelector('.data-value');
    const toggleBtn = dataItem.querySelector('.toggle-btn i');
    
    if (dataValue.classList.contains('hidden')) {
        dataValue.classList.remove('hidden');
        toggleBtn.className = 'fas fa-eye';
    } else {
        dataValue.classList.add('hidden');
        toggleBtn.className = 'fas fa-eye-slash';
    }
};

// 添加数据到内存
function addDataToMemory(name, value) {
    const hexValue = numberToHex(value);
    memoryData.push({
        data_id: name,
        data_value: hexValue
    });
    renderDataList();
}

// 获取公钥列表
async function loadPublicKeys() {
    try {
        showMessage('info', '正在获取公钥列表...');
        
        const response = await fetch(`${serverAddress}/sender/get_public_key`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Username': username
            }
        });

        const data = await response.json();

        if (data.status === "success") {
            // 更新时间戳
            lastPublicKeyUpdateTime = Date.now();
            
            // 清空现有列表
            publicKeyList.innerHTML = '';
            selectedReceiver.innerHTML = '<option value="">请选择接收方</option>';

            if (data.data.length === 0) {
                // 没有公钥时显示提示
                publicKeyList.innerHTML = '<div class="no-public-key">暂无公钥</div>';
            } else {
                // 添加公钥项
                data.data.forEach(item => {
                    // 添加到公钥列表
                    const keyItem = document.createElement('div');
                    keyItem.className = 'public-key-item';
                    keyItem.innerHTML = `
                        <div class="receiver-name">${item.username}</div>
                        <div class="public-key">${item.public_key ? item.public_key : '暂无公钥'}</div>
                    `;
                    publicKeyList.appendChild(keyItem);

                    // 添加到选择框
                    const option = document.createElement('option');
                    option.value = item.username;
                    option.textContent = item.username;
                    selectedReceiver.appendChild(option);
                });
            }

            showMessage('success', '公钥列表获取成功');
        } else {
            showMessage('error', data.message || '获取公钥失败');
        }

    } catch (error) {
        console.error('请求出错:', error);
        showMessage('error', '服务器连接失败，请稍后重试');
    }
}

// 检查公钥是否需要更新
function checkPublicKeyUpdateNeeded() {
    if (!lastPublicKeyUpdateTime) {
        return true;
    }
    // 检查是否超过30分钟
    const thirtyMinutes = 30 * 60 * 1000;
    return (Date.now() - lastPublicKeyUpdateTime) > thirtyMinutes;
}

// Base64编码函数
function encodeBase64(obj) {
    return btoa(JSON.stringify(obj));
}

// Base64解码函数
function decodeBase64(str) {
    try {
        return JSON.parse(atob(str));
    } catch (e) {
        throw new Error('无效的Base64编码或JSON格式');
    }
}

// 生成数据请求包
async function generateEncryptionPackage() {
    const dataName = selectedData.value;
    const receiverName = selectedReceiver.value;

    if (!dataName || !receiverName) {
        showMessage('error', '请选择数据和接收方');
        return;
    }

    // 检查公钥是否需要更新
    if (checkPublicKeyUpdateNeeded()) {
        const shouldUpdate = confirm('公钥列表已超过30分钟未更新，建议刷新公钥列表以确保数据最新。是否现在更新？');
        if (shouldUpdate) {
            await loadPublicKeys();
        }
    }

    try {
        // 从公钥列表中获取接收方公钥
        const receiverKeyItem = Array.from(publicKeyList.getElementsByClassName('public-key-item'))
            .find(item => item.querySelector('.receiver-name').textContent === receiverName);

        if (!receiverKeyItem) {
            showMessage('error', '未找到接收方公钥');
            return;
        }

        const receiverPublicKey = receiverKeyItem.querySelector('.public-key').textContent;
        if (receiverPublicKey === '暂无公钥') {
            showMessage('error', '接收方暂无公钥');
            return;
        }

        // 获取要发送的数据
        const dataToSend = memoryData.find(item => item.data_id === dataName);
        if (!dataToSend) {
            showMessage('error', '未找到选中的数据');
            return;
        }

        // 构造数据包
        const packageData = {
            public_key: receiverPublicKey,
            data_id: dataName,
            data_value: dataToSend.data_value
        };

        // Base64编码
        const encodedData = encodeBase64(packageData);

        // 创建结果展示弹窗
        const modalHtml = `
            <div class="modal active" id="resultModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 class="modal-title">数据请求包</h3>
                        <button class="close-btn" id="closeResultModal">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>Base64编码结果：</label>
                            <textarea id="resultText" readonly style="width: 100%; height: 150px; background: var(--input-bg); color: var(--text-light); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 6px; padding: 0.5rem; resize: none;">${encodedData}</textarea>
                        </div>
                        <div class="form-actions">
                            <button class="submit-btn" id="copyResult">
                                <i class="fas fa-copy"></i>
                                复制结果
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // 添加弹窗到页面
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // 获取弹窗元素
        const resultModal = document.getElementById('resultModal');
        const closeResultModal = document.getElementById('closeResultModal');
        const copyResult = document.getElementById('copyResult');
        const resultText = document.getElementById('resultText');

        // 关闭弹窗事件
        closeResultModal.addEventListener('click', () => {
            resultModal.remove();
        });

        // 复制结果事件
        copyResult.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(encodedData);
                showMessage('success', '已复制到剪贴板');
            } catch (err) {
                showMessage('error', '复制失败，请手动复制');
            }
        });

        showMessage('success', '数据请求包生成成功');
    } catch (error) {
        console.error('生成数据包出错:', error);
        showMessage('error', '生成数据包失败，请稍后重试');
    }
}

// 发送签名加密包
function sendEncryptionPackage() {
    // 创建弹窗
    const modalHtml = `
        <div class="modal active" id="sendPackageModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h3 class="modal-title">发送签名加密包</h3>
                    <button class="close-btn" id="closeSendModal">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>请输入Base64编码的加密数据：</label>
                        <textarea id="packageInput" style="width: 100%; height: 150px; background: var(--input-bg); color: var(--text-light); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 6px; padding: 0.5rem; resize: none;" placeholder="在此粘贴Base64编码数据..."></textarea>
                    </div>
                    <div class="form-actions">
                        <button class="cancel-btn" id="cancelSend">取消</button>
                        <button class="submit-btn" id="confirmSend">
                            <i class="fas fa-paper-plane"></i>
                            发送数据
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // 添加弹窗到页面
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // 获取弹窗元素
    const sendModal = document.getElementById('sendPackageModal');
    const closeSendModal = document.getElementById('closeSendModal');
    const cancelSend = document.getElementById('cancelSend');
    const confirmSend = document.getElementById('confirmSend');
    const packageInput = document.getElementById('packageInput');

    // 关闭弹窗函数
    const closeModal = () => {
        sendModal.remove();
    };

    // 关闭弹窗事件
    closeSendModal.addEventListener('click', closeModal);
    cancelSend.addEventListener('click', closeModal);

    // 发送数据事件
    confirmSend.addEventListener('click', async () => {
        const base64Content = packageInput.value.trim();
        
        if (!base64Content) {
            showMessage('error', '请输入Base64编码数据');
            return;
        }

        try {
            // 验证Base64格式
            const packageData = decodeBase64(base64Content);

            // 发送到服务器
            const response = await fetch(`${serverAddress}/sender/send_enc_data`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Username': username
                },
                body: JSON.stringify({
                    sender: username,
                    encrypted_data: base64Content
                })
            });

            const data = await response.json();

            if (data.status === "success") {
                showMessage('success', '加密包发送成功');
                closeModal();
            } else {
                showMessage('error', data.message || '发送失败');
            }
        } catch (error) {
            showMessage('error', '无效的数据包格式');
        }
    });
}

// 检查数据请求
async function checkRequests() {
    try {
        showMessage('info', '正在获取数据请求...');

        const response = await fetch(`${serverAddress}/sender/get_data_id`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Username': username
            }
        });

        const data = await response.json();

        if (data.status === "success") {
            if (data.data && Object.keys(data.data).length > 0) {
                // 将字典转换为数组进行展示
                requestDisplay.innerHTML = Object.entries(data.data).map(([username, data_id]) => `
                    <div class="request-item">
                        <div class="request-content">
                            <div class="request-header">
                                <div class="request-user">
                                    <i class="fas fa-user"></i>
                                    ${username}
                                </div>
                                <div class="request-id">
                                    ${data_id}
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('');
                showMessage('success', '获取请求成功');
            } else {
                showMessage('success', '暂无数据请求');
                requestDisplay.innerHTML = `
                    <div class="empty-message">
                        <i class="fas fa-inbox"></i>
                        暂无数据请求
                    </div>
                `;
            }
        } else {
            showMessage('error', data.message || '获取请求失败');
        }
    } catch (error) {
        console.error('请求出错:', error);
        showMessage('error', '服务器连接失败，请稍后重试');
    }
}

// 打开添加数据弹窗
addDataBtn.addEventListener('click', () => {
    addDataModal.classList.add('active');
});

// 关闭添加数据弹窗
function closeAddModal() {
    addDataModal.classList.remove('active');
    addDataForm.reset();
}

closeModal.addEventListener('click', closeAddModal);
cancelAdd.addEventListener('click', closeAddModal);

// 提交添加数据表单
addDataForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const dataName = document.getElementById('dataName').value.trim();
    const dataValue = document.getElementById('dataValue').value;

    if (!dataName || !dataValue) {
        showMessage('error', '请填写完整信息');
        return;
    }

    // 检查是否为有效数字
    if (isNaN(dataValue) || dataValue < 0) {
        showMessage('error', '请输入有效的非负数字');
        return;
    }

    // 检查是否存在重复数据名称
    if (memoryData.some(item => item.data_id === dataName)) {
        showMessage('error', '数据名称已存在');
        return;
    }

    addDataToMemory(dataName, dataValue);
    showMessage('success', '数据添加成功');
    closeAddModal();
});

// 获取公钥按钮
getPublicKeysBtn.addEventListener('click', loadPublicKeys);

// 事件监听器
selectedData.addEventListener('change', updateButtonStates);
selectedReceiver.addEventListener('change', updateButtonStates);
encryptBtn.addEventListener('click', generateEncryptionPackage);
sendBtn.addEventListener('click', sendEncryptionPackage);
checkRequestsBtn.addEventListener('click', checkRequests);

// 退出登录
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('username');
    localStorage.removeItem('userType');
    localStorage.removeItem('isLoggedIn');
    window.location.href = 'login.html';
});

// 页面加载时初始化
window.addEventListener('load', () => {
    if (checkLogin()) {
        loadPublicKeys();
    }
});

// 上传数据
async function uploadData() {
    try {
        if (memoryData.length === 0) {
            showMessage('error', '没有可上传的数据');
            return;
        }

        showMessage('info', '正在上传数据...');

        const response = await fetch(`${serverAddress}/sender/upload_data_info`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Username': username
            },
            body: JSON.stringify({
                data_info: memoryData.map(item => item.data_id),
                username: username
            })
        });

        const data = await response.json();

        if (data.status === "success") {
            showMessage('success', '数据上传成功');
        } else {
            showMessage('error', data.message || '上传数据失败');
        }
    } catch (error) {
        console.error('请求出错:', error);
        showMessage('error', '服务器连接失败，请稍后重试');
    }
}

// 加载数据
function loadData() {
    loadFileInput.click();
}

// 处理文件加载
loadFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const jsonData = JSON.parse(event.target.result);
                
                // 验证JSON格式
                if (!Array.isArray(jsonData)) {
                    throw new Error('文件格式错误：必须是JSON数组');
                }

                // 验证每个数据项
                const isValid = jsonData.every(item => {
                    if (!item.data_id || !item.data_value) return false;
                    // 验证十六进制格式
                    const hexPattern = /^[0-9A-F]{15}$/;
                    return hexPattern.test(item.data_value);
                });

                if (!isValid) {
                    throw new Error('文件格式错误：数据值必须是15位十六进制字符串');
                }

                // 更新内存数据
                memoryData = jsonData;
                renderDataList();
                showMessage('success', '数据加载成功');
            } catch (error) {
                showMessage('error', error.message || '文件格式错误');
            }
        };
        reader.readAsText(file);
    } catch (error) {
        showMessage('error', '文件读取失败');
    }
});

// 保存数据
function saveData() {
    if (memoryData.length === 0) {
        showMessage('error', '没有可保存的数据');
        return;
    }

    // 创建JSON字符串
    const jsonStr = JSON.stringify(memoryData, null, 2);
    
    // 创建Blob对象
    const blob = new Blob([jsonStr], { type: 'application/json' });
    
    // 创建下载链接
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data_${new Date().toISOString().slice(0,10)}.json`;
    
    // 触发下载
    document.body.appendChild(a);
    a.click();
    
    // 清理
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showMessage('success', '数据保存成功');
}

// 添加事件监听器
uploadDataBtn.addEventListener('click', uploadData);
loadDataBtn.addEventListener('click', loadData);
saveDataBtn.addEventListener('click', saveData); 