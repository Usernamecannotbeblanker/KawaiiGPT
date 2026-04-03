const messagesContainer = document.getElementById('messagesContainer');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const newChatBtn = document.getElementById('newChatBtn');
const clearBtn = document.getElementById('clearBtn');
const welcomeScreen = document.getElementById('welcomeScreen');
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.querySelector('.sidebar');
const chatTitle = document.getElementById('chatTitle');

let conversationHistory = [];
let isStreaming = false;
let currentMode = 'chat';

marked.setOptions({
    breaks: true,
    gfm: true,
    highlight: null
});

const renderer = new marked.Renderer();
renderer.code = function(code, language) {
    const lang = language || 'plaintext';
    const id = 'code-' + Math.random().toString(36).substr(2, 9);
    return `
        <div class="code-block-wrapper">
            <div class="code-block-header">
                <span class="code-lang">${lang}</span>
                <button class="copy-btn" onclick="copyCode('${id}')">Copy</button>
            </div>
            <pre><code id="${id}" class="language-${lang}">${escapeHtml(code)}</code></pre>
        </div>
    `;
};

marked.use({ renderer });

function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function copyCode(id) {
    const el = document.getElementById(id);
    const btn = el.closest('.code-block-wrapper').querySelector('.copy-btn');
    navigator.clipboard.writeText(el.innerText).then(() => {
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(() => {
            btn.textContent = 'Copy';
            btn.classList.remove('copied');
        }, 2000);
    });
}

function renderMarkdown(text) {
    const html = marked.parse(text);
    return html;
}

function highlightCodeBlocks(container) {
    container.querySelectorAll('pre code').forEach(block => {
        hljs.highlightElement(block);
    });
}

function formatTime(date) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function hideWelcome() {
    if (welcomeScreen && welcomeScreen.parentNode) {
        welcomeScreen.style.opacity = '0';
        welcomeScreen.style.transform = 'translateY(-10px)';
        welcomeScreen.style.transition = 'all 0.3s ease';
        setTimeout(() => {
            if (welcomeScreen.parentNode) {
                welcomeScreen.parentNode.removeChild(welcomeScreen);
            }
        }, 300);
    }
}

function addMessage(role, content, isStreaming = false) {
    hideWelcome();

    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${role}`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = role === 'user' ? 'U' : '✦';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';

    if (role === 'bot') {
        bubble.innerHTML = renderMarkdown(content);
        highlightCodeBlocks(bubble);
    } else {
        bubble.textContent = content;
    }

    const meta = document.createElement('div');
    meta.className = 'message-meta';
    meta.textContent = formatTime(new Date());

    contentDiv.appendChild(bubble);
    contentDiv.appendChild(meta);
    msgDiv.appendChild(avatar);
    msgDiv.appendChild(contentDiv);

    messagesContainer.appendChild(msgDiv);
    scrollToBottom();

    return { bubble, contentDiv };
}

function showTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    indicator.id = 'typingIndicator';

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = '✦';

    const dots = document.createElement('div');
    dots.className = 'typing-dots';
    dots.innerHTML = '<span></span><span></span><span></span>';

    indicator.appendChild(avatar);
    indicator.appendChild(dots);
    messagesContainer.appendChild(indicator);
    scrollToBottom();
}

function removeTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) indicator.remove();
}

function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function autoResize() {
    userInput.style.height = 'auto';
    userInput.style.height = Math.min(userInput.scrollHeight, 160) + 'px';
    sendBtn.disabled = userInput.value.trim() === '' || isStreaming;
}

function getModePrefix() {
    if (currentMode === 'code') {
        return "You are in Code Writer mode. Please provide complete, production-ready code with clear explanations. ";
    }
    return "";
}

async function sendMessage(text) {
    if (!text || isStreaming) return;

    isStreaming = true;
    sendBtn.disabled = true;
    userInput.value = '';
    autoResize();

    const userText = getModePrefix() + text;

    conversationHistory.push({ role: 'user', content: userText });
    addMessage('user', text);
    showTypingIndicator();

    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: conversationHistory })
        });

        removeTypingIndicator();

        if (!response.ok) throw new Error('Network response was not ok');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';

        const { bubble, contentDiv } = addMessage('bot', '');

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            fullText += chunk;

            bubble.innerHTML = renderMarkdown(fullText);
            highlightCodeBlocks(bubble);
            scrollToBottom();
        }

        conversationHistory.push({ role: 'assistant', content: fullText });

        if (conversationHistory.length === 2) {
            const title = text.length > 40 ? text.substring(0, 40) + '...' : text;
            chatTitle.textContent = title;
        }

    } catch (error) {
        removeTypingIndicator();
        addMessage('bot', `Sorry, I ran into an error: ${error.message}. Please try again.`);
    } finally {
        isStreaming = false;
        sendBtn.disabled = userInput.value.trim() === '';
    }
}

function clearChat() {
    conversationHistory = [];
    messagesContainer.innerHTML = '';
    chatTitle.textContent = 'KawaiiGPT';

    const welcome = document.createElement('div');
    welcome.className = 'welcome-screen';
    welcome.id = 'welcomeScreen';
    welcome.innerHTML = `
        <div class="welcome-logo">✦</div>
        <h2>Welcome to KawaiiGPT</h2>
        <p>Your AI chatbot and code writing assistant. Ask me anything or pick a quick prompt to get started!</p>
        <div class="welcome-features">
            <div class="feature-card">
                <span>💬</span>
                <h3>Smart Chat</h3>
                <p>Natural conversation with context memory</p>
            </div>
            <div class="feature-card">
                <span>💻</span>
                <h3>Code Writer</h3>
                <p>Generate clean, commented code in any language</p>
            </div>
            <div class="feature-card">
                <span>🔍</span>
                <h3>Code Review</h3>
                <p>Debug and improve your existing code</p>
            </div>
        </div>
    `;
    messagesContainer.appendChild(welcome);
}

sendBtn.addEventListener('click', () => {
    const text = userInput.value.trim();
    if (text) sendMessage(text);
});

userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const text = userInput.value.trim();
        if (text) sendMessage(text);
    }
});

userInput.addEventListener('input', autoResize);

newChatBtn.addEventListener('click', () => {
    clearChat();
    if (sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
    }
});

clearBtn.addEventListener('click', clearChat);

menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
});

document.addEventListener('click', (e) => {
    if (sidebar.classList.contains('open') &&
        !sidebar.contains(e.target) &&
        e.target !== menuToggle) {
        sidebar.classList.remove('open');
    }
});

document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentMode = btn.dataset.mode;
    });
});

document.querySelectorAll('.quick-prompt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const prompt = btn.dataset.prompt;
        userInput.value = prompt;
        autoResize();
        sendMessage(prompt);
        if (sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
        }
    });
});

userInput.focus();
