const registerForm = document.getElementById('registerForm');

// 从sessionStorage获取服务器地址
if (!sessionStorage.getItem('serverAddress')) {
    sessionStorage.setItem('serverAddress', 'http://10.24.37.3:5001');
}
const serverAddress = sessionStorage.getItem('serverAddress');

// 计算SHA256哈希
async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
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

registerForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const userType = document.getElementById('userType').value;

    // 输入验证
    if (!username || !password || !confirmPassword) {
        showMessage('error', '所有字段都必须填写');
        return;
    }

    if (password !== confirmPassword) {
        showMessage('error', '两次输入的密码不一致');
        return;
    }

    if (password.length < 6) {
        showMessage('error', '密码长度至少为6位');
        return;
    }

    try {
        // 计算密码的SHA256哈希
        const passwordHash = await sha256(password);

        showMessage('info', '正在注册...');

        const response = await fetch(`${serverAddress}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                password: passwordHash,
                userType
            })
        });

        const data = await response.json();

        if (data.message === "注册成功") {
            showMessage('success', '注册成功！正在跳转到登录页面...');
            // 延迟跳转，让用户看到成功消息
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        } else {
            showMessage('error', data.message || '注册失败，请稍后重试');
        }
    } catch (error) {
        console.error('请求出错:', error);
        showMessage('error', '服务器连接失败，请稍后重试');
    }
}); 