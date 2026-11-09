// js/chat.js
// "Ask about Mushkan" AI Chat Widget Controller

(function() {
    const chatToggle = document.getElementById('mg-chat-toggle');
    const chatPanel = document.getElementById('mg-chat-panel');
    const chatClose = document.getElementById('mg-chat-close');
    const chatMessages = document.getElementById('mg-chat-messages');
    const chatInput = document.getElementById('mg-chat-input');
    const chatSendBtn = document.getElementById('mg-chat-send');
    const chatTyping = document.getElementById('mg-chat-typing');
    const unreadDot = document.getElementById('mg-unread-dot');
    const chipsContainer = document.getElementById('mg-suggested-chips');

    let chatHistory = [];
    let isGenerating = false;

    // Open / Close Toggle
    function toggleChat(forceOpen) {
        const isOpen = forceOpen !== undefined ? forceOpen : !chatPanel.classList.contains('open');
        if (isOpen) {
            chatPanel.classList.add('open');
            chatPanel.setAttribute('aria-hidden', 'false');
            chatToggle.setAttribute('aria-expanded', 'true');
            if (unreadDot) unreadDot.style.display = 'none';
            setTimeout(() => chatInput.focus(), 150);
            scrollMessagesBottom();
        } else {
            chatPanel.classList.remove('open');
            chatPanel.setAttribute('aria-hidden', 'true');
            chatToggle.setAttribute('aria-expanded', 'false');
            chatToggle.focus();
        }
    }

    chatToggle.addEventListener('click', () => toggleChat());
    chatClose.addEventListener('click', () => toggleChat(false));

    // Prevent chat form default submit
    const chatForm = document.getElementById('mg-chat-form');
    if (chatForm) chatForm.addEventListener('submit', e => e.preventDefault());

    // Esc to Close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && chatPanel.classList.contains('open')) {
            toggleChat(false);
        }
    });

    // Auto-resize input textarea
    function adjustTextareaHeight() {
        chatInput.style.height = 'auto';
        chatInput.style.height = Math.min(chatInput.scrollHeight, 90) + 'px';
        chatSendBtn.disabled = !chatInput.value.trim() || isGenerating;
    }

    chatInput.addEventListener('input', adjustTextareaHeight);

    // Enter key to send (Shift+Enter for newline)
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!chatSendBtn.disabled) {
                sendUserMessage();
            }
        }
    });

    chatSendBtn.addEventListener('click', () => sendUserMessage());

    // Suggested question chips
    if (chipsContainer) {
        chipsContainer.addEventListener('click', (e) => {
            const chip = e.target.closest('.mg-chip');
            if (!chip) return;
            const question = chip.getAttribute('data-question') || chip.textContent.trim();
            sendUserMessage(question);
        });
    }

    // Scroll helper
    function scrollMessagesBottom() {
        requestAnimationFrame(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });
    }

    // HTML Escaping and Markdown Link Parser
    function formatAssistantResponse(rawText) {
        if (!rawText) return '';

        // Escape raw HTML entities
        let safe = rawText
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');

        // Bold (**text**)
        safe = safe.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');

        // Inline code (`code`)
        safe = safe.replace(/`([^`]+)`/g, '<code>$1</code>');

        // Markdown links: [label](url) -> safe clickable links
        safe = safe.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, function(match, label, url) {
            const cleanUrl = url.trim();
            // Allow safe protocols and local repository paths
            if (/^(https?:\/\/|mailto:|certificates\/|\/|\.\/)/i.test(cleanUrl)) {
                return '<a href="' + cleanUrl + '" target="_blank" rel="noopener noreferrer">' + label + '</a>';
            }
            return label;
        });

        // Auto-link bare URLs if not inside an href
        safe = safe.replace(/(^|[^"'\>])(https?:\/\/[^\s<]+)/g, function(match, prefix, url) {
            return prefix + '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + url + '</a>';
        });

        // Parse paragraphs and bullet lists
        const lines = safe.split('\n');
        let inList = false;
        let htmlOutput = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (/^[-*]\s+/.test(line)) {
                if (!inList) {
                    htmlOutput.push('<ul>');
                    inList = true;
                }
                htmlOutput.push('<li>' + line.replace(/^[-*]\s+/, '') + '</li>');
            } else {
                if (inList) {
                    htmlOutput.push('</ul>');
                    inList = false;
                }
                if (line.length > 0) {
                    htmlOutput.push('<p>' + line + '</p>');
                }
            }
        }
        if (inList) {
            htmlOutput.push('</ul>');
        }

        return htmlOutput.join('');
    }

    // Append message bubble
    function appendBubble(role, content, isHtml) {
        const msgEl = document.createElement('div');
        msgEl.className = 'mg-msg mg-msg-' + role;

        const bubble = document.createElement('div');
        bubble.className = 'mg-msg-bubble';

        if (isHtml) {
            bubble.innerHTML = content;
        } else {
            const p = document.createElement('p');
            p.textContent = content;
            bubble.appendChild(p);
        }

        const timeEl = document.createElement('span');
        timeEl.className = 'mg-msg-time';
        const now = new Date();
        timeEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        msgEl.appendChild(bubble);
        msgEl.appendChild(timeEl);
        chatMessages.appendChild(msgEl);
        scrollMessagesBottom();
    }

    // Send message function
    async function sendUserMessage(overrideText) {
        const text = (overrideText || chatInput.value).trim();
        if (!text || isGenerating) return;

        if (text.length > 500) {
            // showToast is defined in main.js, which loads before chat.js
            if (typeof showToast === 'function') showToast('Question exceeds 500 characters limit.');
            return;
        }

        // Add user bubble
        appendBubble('user', text, false);
        chatHistory.push({ role: 'user', text: text });

        // Reset input
        chatInput.value = '';
        adjustTextareaHeight();
        chatSendBtn.disabled = true;

        // Show typing indicator
        isGenerating = true;
        chatTyping.style.display = 'flex';
        scrollMessagesBottom();

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    history: chatHistory.slice(-10)
                })
            });

            chatTyping.style.display = 'none';

            if (!response.ok) {
                const errJson = await response.json().catch(() => ({}));
                const errMsg = errJson.error || "Thank you for your question. I'm unable to respond at the moment. Please try again shortly, or contact Mushkan directly at musugu2005@gmail.com.";
                appendBubble('assistant', '<p>' + errMsg + '</p>', true);
                return;
            }

            const data = await response.json();
            const replyText = data.reply || "Thank you for your question. I'm unable to respond at the moment. Please try again shortly, or contact Mushkan directly at musugu2005@gmail.com.";
            const formattedHtml = formatAssistantResponse(replyText);

            appendBubble('assistant', formattedHtml, true);
            chatHistory.push({ role: 'assistant', text: replyText });

        } catch (error) {
            chatTyping.style.display = 'none';
            console.error('Chat error:', error);
            appendBubble(
                'assistant',
                "<p>Thank you for your question. I'm unable to respond at the moment. Please try again shortly, or contact Mushkan directly at <a href=\"mailto:musugu2005@gmail.com\">musugu2005@gmail.com</a>.</p>",
                true
            );
        } finally {
            isGenerating = false;
            adjustTextareaHeight();
        }
    }
})();
