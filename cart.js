/**
 * DG Fine Jewels - Cart System
 * Handles cart state, UI rendering, and WhatsApp integration.
 */

class JewelleryCart {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('dg_cart')) || [];
        this.init();
    }

    init() {
        this.renderCartUI();
        this.updateCartBadge();
        this.attachEventListeners();
        
    }

    save() {
        localStorage.setItem('dg_cart', JSON.stringify(this.cart));
        this.updateCartBadge();
        this.renderCartItems();
    }

    addItem(product) {
        // product: { id, name, category, imageHTML }
        const existingItem = this.cart.find(item => item.id === product.id);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push({ ...product, quantity: 1 });
        }
        this.save();
        this.openCart();
        this.showAddedFeedback(product.id);
    }

    showAddedFeedback(productId) {
        // Flash the button to confirm addition
        const btns = document.querySelectorAll('.btn-cart, .cart-btn');
        btns.forEach(btn => {
            const card = btn.closest('.product-card, .card');
            if (!card) return;
            const titleEl = card.querySelector('.product-title, .card-name');
            if (!titleEl) return;
            if (btn.dataset.productId === productId || (btn.onclick && btn.onclick.toString().includes(productId))) {
                const orig = btn.textContent;
                btn.textContent = '✓ Added';
                btn.style.background = '#2e7d32';
                setTimeout(() => {
                    btn.textContent = orig;
                    btn.style.background = '';
                }, 1500);
            }
        });
    }

    removeItem(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.save();
    }

    updateQuantity(productId, delta) {
        const item = this.cart.find(item => item.id === productId);
        if (item) {
            item.quantity += delta;
            if (item.quantity <= 0) {
                this.removeItem(productId);
            } else {
                this.save();
            }
        }
    }

    getCartCount() {
        return this.cart.reduce((total, item) => total + item.quantity, 0);
    }

    updateCartBadge() {
        const badge = document.getElementById('cart-badge');
        if (badge) {
            const count = this.getCartCount();
            badge.innerText = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    renderCartUI() {
        if (!document.getElementById('cart-sidebar')) {
            const sidebar = document.createElement('div');
            sidebar.id = 'cart-sidebar';
            sidebar.className = 'cart-sidebar';
            sidebar.innerHTML = `
                <div class="cart-header">
                    <h3>Your Selection</h3>
                    <button class="close-cart" id="close-cart">&times;</button>
                </div>
                <div class="cart-items" id="cart-items-list"></div>
                <div class="cart-footer">
                    <button class="checkout-btn" id="checkout-btn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        Enquire via WhatsApp
                    </button>
                    <p class="cart-note">Your selection will be shared with our experts via WhatsApp for price & availability.</p>
                </div>
            `;
            document.body.appendChild(sidebar);

            const overlay = document.createElement('div');
            overlay.id = 'cart-overlay';
            overlay.className = 'cart-overlay';
            document.body.appendChild(overlay);
        }

        if (!document.getElementById('floating-cart-btn')) {
            const floatBtn = document.createElement('button');
            floatBtn.id = 'floating-cart-btn';
            floatBtn.className = 'floating-cart-btn';
            floatBtn.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                <span id="cart-badge" class="cart-badge">0</span>
            `;
            document.body.appendChild(floatBtn);
        }

        this.renderCartItems();
    }

    renderCartItems() {
        const list = document.getElementById('cart-items-list');
        if (!list) return;

        if (this.cart.length === 0) {
            list.innerHTML = `<div class="empty-cart-msg">Your selection is empty.<br>Browse our collections to add pieces.</div>`;
            return;
        }

        list.innerHTML = this.cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-img">${item.imageHTML || '✨'}</div>
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p class="item-id">Token No: ${item.id}</p>
                    <div class="cart-item-qty">
                        <button onclick="jewelleryCart.updateQuantity('${item.id.replace(/'/g,"\\'")}', -1)" aria-label="Decrease">&minus;</button>
                        <span>${item.quantity}</span>
                        <button onclick="jewelleryCart.updateQuantity('${item.id.replace(/'/g,"\\'")}', 1)" aria-label="Increase">&plus;</button>
                    </div>
                </div>
                <button class="remove-item" onclick="jewelleryCart.removeItem('${item.id.replace(/'/g,"\\'")}'); return false;" aria-label="Remove">&times;</button>
            </div>
        `).join('');
    }

    /**
     * Auto-wire any .btn-cart buttons that don't already have onclick handlers.
     * Reads product info directly from the card's DOM.
     */
    

attachEventListeners() {
    document.addEventListener('click', (e) => {
        if (e.target.closest('#floating-cart-btn')) this.openCart();
        if (e.target.id === 'close-cart' || e.target.id === 'cart-overlay') this.closeCart();
        if (e.target.id === 'checkout-btn') this.checkout();
    });

   
}

    attachEventListeners() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('#floating-cart-btn')) this.openCart();
            if (e.target.id === 'close-cart' || e.target.id === 'cart-overlay') this.closeCart();
            if (e.target.id === 'checkout-btn') this.checkout();
        });

        // Re-wire on DOM changes (e.g. dynamic content)
        if (typeof MutationObserver !== 'undefined') {
            const obs = new MutationObserver(() => this.wireUpCartButtons());
            obs.observe(document.body, { childList: true, subtree: true });
        }
    }

    openCart() {
        const sidebar = document.getElementById('cart-sidebar');
        const overlay = document.getElementById('cart-overlay');
        if (sidebar) sidebar.classList.add('active');
        if (overlay) overlay.classList.add('active');
    }

    closeCart() {
        const sidebar = document.getElementById('cart-sidebar');
        const overlay = document.getElementById('cart-overlay');
        if (sidebar) sidebar.classList.remove('active');
        if (overlay) overlay.classList.remove('active');
    }

    checkout() {
        if (this.cart.length === 0) return;

        let message = `Hello DG Fine Jewels! I am interested in the following selections:\n\n`;
        this.cart.forEach((item, index) => {
            message += `${index + 1}. *${item.name}*\n`;
            message += `   Token No: ${item.id}\n`;
            message += `   Quantity: ${item.quantity}\n\n`;
        });
        message += `Please share the price and availability details. Thank you!`;

        const encodedMsg = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/919820160597?text=${encodedMsg}`;
        window.open(whatsappUrl, '_blank');
    }
}

// Global instance — initialised after DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.jewelleryCart = new JewelleryCart(); });
} else {
    window.jewelleryCart = new JewelleryCart();
}
