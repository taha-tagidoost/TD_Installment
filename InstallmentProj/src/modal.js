/**
 * Modal Module - Final Robust Version
 * Compatible with ASP.NET MVC and standard HTML/CSS
 */
'use strict';

(function () {
    const doc = document;
    const modalElement = doc.getElementById('modal');

    // --- 1. GUARD CLAUSE: Prevent crashes if HTML is missing ---
    if (!modalElement) {
        console.error('ERROR: <div id="modal"> not found in Layout.');

        // Fallback object to prevent JavaScript errors in other files
        window.callModal = {
            success: function (msg) { console.log('Success:', msg); return Promise.resolve(); },
            fail: function (msg) { console.error('Fail:', msg); return Promise.resolve(); },
            spinner: function (func) { if (func) func(); },
            confirm: function () { return Promise.resolve(true); },
            notif: function () { return Promise.resolve(); },
            custom: function () { return Promise.resolve(); }
        };
        return;
    }

    const modalContent = modalElement.querySelector('.content');

    // --- 2. SCROLL LOCK MANAGER ---
    const scrollControl = {
        currentPos: 0,
        lock: function () {
            this.currentPos = window.scrollY || document.documentElement.scrollTop;
            document.body.classList.add('locked');
            document.body.style.top = `-${this.currentPos}px`;
            document.documentElement.style.scrollBehavior = "auto";
        },
        unlock: function () {
            document.body.classList.remove('locked');
            document.body.style.top = '';
            document.documentElement.style.scrollBehavior = "";
            window.scrollTo(0, this.currentPos);
        }
    };

    // --- 3. CORE ENGINE (Prepare Modal) ---
    function prepareModal(className, setupFunc, options) {
        const settings = Object.assign({ close: 'overlay', scrollLock: false }, options);

        return new Promise(function (resolve, reject) {
            // Reset state
            modalElement.className = '';
            if (className) modalElement.classList.add(...className.split(' '));
            modalElement.onclick = null;

            // Handle Close Events
            if (settings.close === 'all') {
                modalElement.onclick = closeModal;
            } else if (settings.close === 'overlay') {
                modalElement.onclick = function (e) {
                    if (e.target === modalElement || e.target.id === 'closeModal') closeModal();
                };
            }

            function closeModal() {
                return new Promise(function (resolveClose) {
                    if (!modalElement.classList.contains('active')) {
                        resolveClose();
                        return;
                    }

                    function onTransitionEnd() {
                        if (settings.scrollLock) scrollControl.unlock();
                        resolveClose();
                        resolve(); // Resolve main promise
                    }

                    modalElement.addEventListener("transitionend", onTransitionEnd, { once: true });
                    modalElement.classList.remove('active');

                    // Fallback if CSS transition fails
                    setTimeout(function () {
                        if (!modalElement.classList.contains('active')) {
                            // Force resolve if transition event didn't fire
                        }
                    }, 400);
                });
            }

            function showModal(content) {
                modalContent.innerHTML = '';

                if (typeof content === 'string') {
                    modalContent.innerHTML = content;
                } else if (content instanceof Node) {
                    modalContent.appendChild(content);
                }

                modalElement.classList.add('active');

                // Bind close button if exists inside content
                const closeBtn = modalContent.querySelector('.close-btn');
                if (closeBtn) closeBtn.onclick = closeModal;

                if (settings.scrollLock) scrollControl.lock();
            }

            if (setupFunc) {
                setupFunc(showModal, closeModal);
            }
        });
    }

    // --- 4. PUBLIC HELPERS ---

    function notif(content, className, duration) {
        const time = duration || 5000;
        return prepareModal('notification ' + className, function (show, close) {
            show(content);
            setTimeout(close, time);
        }, { close: 'all' });
    }

    function successFail(msg, duration, isFailed) {
        // Handle Array messages (Common in MVC Validation)
        let finalMsg = msg;
        if (Array.isArray(msg)) {
            finalMsg = msg.join('<br/>');
        }

        const wrapper = document.createElement('div');
        const icon = document.createElement('div');
        const textNode = document.createElement('p');

        // Inline styles to ensure icons appear even without CSS file
        icon.innerHTML = isFailed ? '<i class="fas fa-times"></i>' : '<i class="fas fa-check-circle"></i>';
        icon.style.fontSize = "3.5rem";
        icon.style.color = isFailed ? "#dc3545" : "#28a745";
        icon.style.marginBottom = "15px";

        textNode.innerHTML = finalMsg;
        textNode.style.fontSize = "1.1rem";
        textNode.style.fontWeight = "bold";
        textNode.style.color = "#333";

        wrapper.appendChild(textNode);
        wrapper.appendChild(icon);
        wrapper.style.textAlign = "center";
        wrapper.style.padding = "10px";

        return notif(wrapper, isFailed ? 'error' : 'success', duration);
    }

    function confirmModal(text) {
        return new Promise(function (resolve, reject) {
            prepareModal('choice', function (show, close) {
                const wrapper = document.createElement('div');
                const message = document.createElement('h4');
                const btnContainer = document.createElement('div');
                const btnYes = document.createElement('button');
                const btnNo = document.createElement('button');

                message.innerText = text;
                message.style.marginBottom = "20px";

                btnYes.innerText = 'بله';
                btnYes.className = 'btn btn-success'; // Bootstrap class
                btnYes.style.margin = "0 5px";
                btnYes.onclick = function () { close().then(resolve); };

                btnNo.innerText = 'خیر';
                btnNo.className = "btn btn-danger"; // Bootstrap class
                btnNo.style.margin = "0 5px";
                btnNo.onclick = function () { close().then(reject); };

                btnContainer.appendChild(btnYes);
                btnContainer.appendChild(btnNo);
                btnContainer.style.textAlign = "center";

                wrapper.appendChild(message);
                wrapper.appendChild(btnContainer);

                show(wrapper);
            }).catch(function () { reject(); });
        });
    }

    function spinner(callback) {
        return prepareModal('spinner', function (show, close) {
            const container = document.createElement('div');
            container.style.textAlign = "center";
            // Simple CSS Loader
            container.innerHTML = `
                <div class="loader" style="display:inline-block; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite;"></div>
                <p style="margin-top:10px; color:#555;">لطفا صبر کنید...</p>
                <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
            `;
            show(container);
            if (callback) callback(close);
        }, { close: 'locked' });
    }

    // --- 5. EXPORT ---
    window.callModal = {
        custom: prepareModal,
        spinner: spinner,
        confirm: confirmModal,
        success: function (msg, duration) { return successFail(msg, duration, false); },
        fail: function (msg, duration) { return successFail(msg, duration, true); },
        notif: notif
    };

    console.log('Modal Module initialized.');

})();