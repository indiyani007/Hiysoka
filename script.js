const STORAGE_KEY = 'WARUNG_TECHNO_DATA_V1';
const API_URL = 'api.php';
const STATIC_DATA_URL = 'data.json';

// App State
let appData = {};
let selectedCategory = 'ALL';
let activeCheckoutProduct = null;
let isAdminLoggedIn = false;
let confirmCallback = null;
let isServerBackendAvailable = false;

// ==================== INITIALIZATION ====================
window.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    await loadAppData();
    applySiteSettingsToDOM();
    renderNavigation();
    renderCategoryPills();
    renderStoreProducts();
    updateAdminBadge();
});

// ==================== DATA LOADING & PERSISTENCE ====================
/**
 * Memuat data secara otomatis:
 * 1. Coba koneksi ke api.php (Untuk cPanel dengan PHP)
 * 2. Jika di Vercel/GitHub Pages (statis), fallback ke localStorage atau data.json
 */
async function loadAppData() {
    // Coba ambil dari cPanel (api.php)
    try {
        const response = await fetch(API_URL, { cache: 'no-store' });
        if (response.ok) {
            const data = await response.json();
            if (data && data.products) {
                appData = data;
                isServerBackendAvailable = true;
                localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
                return;
            }
        }
    } catch (e) {
        // api.php tidak tersedia (lingkungan statis seperti Vercel atau GitHub Pages)
        isServerBackendAvailable = false;
    }

    // Fallback 1: LocalStorage
    const local = localStorage.getItem(STORAGE_KEY);
    if (local) {
        try {
            appData = JSON.parse(local);
            return;
        } catch (e) {
            console.warn('Gagal parse localStorage, memuat data.json bawaan.');
        }
    }

    // Fallback 2: Ambil data.json mentah (statis untuk Vercel / GitHub Pages)
    try {
        const res = await fetch(STATIC_DATA_URL);
        if (res.ok) {
            appData = await res.json();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
        }
    } catch (e) {
        console.error('Gagal memuat data awal.', e);
    }
}

/**
 * Menyimpan data:
 * - Selalu simpan ke localStorage (untuk respon instan & kompatibel statis Vercel/GitHub)
 * - Jika di cPanel (ada api.php), simpan juga ke data.json di server secara background
 */
async function saveAppData() {
    try {
        // Simpan lokal
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
        updateAdminBadge();

        // Jika backend PHP tersedia, simpan permanen ke server
        if (isServerBackendAvailable || window.location.protocol.startsWith('http')) {
            fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(appData)
            }).then(res => {
                if (res.ok) {
                    isServerBackendAvailable = true;
                }
            }).catch(() => {
                // Abaikan jika di hosting statis tanpa PHP
            });
        }
    } catch (e) {
        showToast('Penyimpanan lokal penuh atau file gambar terlalu besar.', 'error');
    }
}

// ==================== THEME (DARK / LIGHT MODE) ====================
function initTheme() {
    const savedTheme = localStorage.getItem('WT_THEME') || 'dark';
    if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    updateThemeIcon();
}

function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('WT_THEME', isDark ? 'dark' : 'light');
    updateThemeIcon();
    showToast(`Mode ${isDark ? 'Gelap' : 'Terang'} diaktifkan`, 'info');
}

function updateThemeIcon() {
    const icon = document.getElementById('theme-icon');
    if (!icon) return;
    if (document.documentElement.classList.contains('dark')) {
        icon.className = 'fa-solid fa-sun text-lg';
    } else {
        icon.className = 'fa-solid fa-moon text-lg';
    }
}

// ==================== APPLY SETTINGS TO DOM ====================
function applySiteSettingsToDOM() {
    if (!appData.settings) return;
    const s = appData.settings;

    document.title = `${s.siteTitle} - Pusat Aplikasi Premium`;
    document.getElementById('meta-desc')?.setAttribute('content', s.siteDesc || '');
    document.getElementById('meta-gverify')?.setAttribute('content', s.googleVerify || '');
    document.getElementById('site-favicon')?.setAttribute('href', s.faviconUrl || '');

    // Header & Footer
    const headerLogo = document.getElementById('header-logo');
    if (headerLogo && s.logoUrl) headerLogo.src = s.logoUrl;
    const headerTitle = document.getElementById('header-title');
    if (headerTitle) headerTitle.textContent = s.siteTitle;

    const footerLogo = document.getElementById('footer-logo');
    if (footerLogo && s.logoUrl) footerLogo.src = s.logoUrl;
    const footerTitle = document.getElementById('footer-title');
    if (footerTitle) footerTitle.textContent = s.siteTitle;

    // Banner
    const badge = document.getElementById('banner-badge-text');
    if (badge) badge.textContent = s.bannerBadge || '';
    const bTitle = document.getElementById('banner-title-text');
    if (bTitle) bTitle.textContent = s.bannerTitle || '';
    const bSub = document.getElementById('banner-subtitle-text');
    if (bSub) bSub.textContent = s.bannerSubtitle || '';

    // Footer
    const footAbout = document.getElementById('footer-about-text');
    if (footAbout) footAbout.textContent = s.footerAbout || '';
    const footCopy = document.getElementById('footer-copyright');
    if (footCopy) footCopy.textContent = s.footerCopy || '';
    
    const cleanWa = (s.waNumber || '').replace(/[^0-9]/g, '');
    const footWa = document.getElementById('footer-wa-link');
    if (footWa) footWa.href = `https://wa.me/${cleanWa}`;
    
    const footTg = document.getElementById('footer-tg-link');
    if (footTg) footTg.href = s.telegramBotUrl || '#';

    const footIg = document.getElementById('footer-ig-link');
    if (footIg) footIg.href = s.footerIg || '#';

    // Cek Pesanan Custom Header from pages
    if (appData.pages) {
        const cekPage = appData.pages.find(p => p.slug === 'cek-pesanan');
        if (cekPage) {
            const pageCekTitle = document.getElementById('page-cek-title');
            if (pageCekTitle) pageCekTitle.textContent = cekPage.title;
            const pageCekDesc = document.getElementById('page-cek-desc');
            if (pageCekDesc) pageCekDesc.textContent = cekPage.content;
        }
    }
}

// ==================== NAVIGATION & VIEWS ====================
function renderNavigation() {
    const desktopNav = document.getElementById('desktop-nav');
    const mobileMenu = document.getElementById('mobile-menu');
    const footerLinks = document.getElementById('footer-links');

    if (!appData.pages) appData.pages = [];

    const navItems = [
        { label: 'Beranda', slug: 'home', icon: 'fa-solid fa-house' },
        ...appData.pages.map(p => ({
            label: p.title,
            slug: p.slug,
            icon: p.slug === 'cek-pesanan' ? 'fa-solid fa-magnifying-glass' : 'fa-solid fa-file-lines'
        }))
    ];

    if (desktopNav) {
        desktopNav.innerHTML = navItems.map(item => `
            <button onclick="switchView('store', '${item.slug}')" class="px-3.5 py-2 rounded-xl text-xs lg:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition">
                ${item.label}
            </button>
        `).join('');
    }

    if (mobileMenu) {
        mobileMenu.innerHTML = navItems.map(item => `
            <button onclick="switchView('store', '${item.slug}'); toggleMobileMenu(false);" class="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5">
                <i class="${item.icon} text-indigo-500 w-5"></i> ${item.label}
            </button>
        `).join('');
    }

    if (footerLinks) {
        footerLinks.innerHTML = navItems.map(item => `
            <li>
                <button onclick="switchView('store', '${item.slug}')" class="hover:text-indigo-500 transition">${item.label}</button>
            </li>
        `).join('');
    }
}

function toggleMobileMenu(forceState) {
    const menu = document.getElementById('mobile-menu');
    if (!menu) return;
    if (typeof forceState === 'boolean') {
        menu.classList.toggle('hidden', !forceState);
    } else {
        menu.classList.toggle('hidden');
    }
}

function switchView(mainView, subSlug = 'home') {
    const storeView = document.getElementById('storefront-view');
    const adminView = document.getElementById('admin-view');

    if (mainView === 'admin') {
        storeView?.classList.add('hidden');
        adminView?.classList.remove('hidden');
        switchAdminTab('dashboard');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    // Show Storefront
    adminView?.classList.add('hidden');
    storeView?.classList.remove('hidden');

    const homeSec = document.getElementById('store-home-section');
    const cekSec = document.getElementById('store-cek-pesanan-section');
    const dynSec = document.getElementById('store-dynamic-page-section');

    homeSec?.classList.add('hidden');
    cekSec?.classList.add('hidden');
    dynSec?.classList.add('hidden');

    if (subSlug === 'home') {
        homeSec?.classList.remove('hidden');
    } else if (subSlug === 'cek-pesanan') {
        cekSec?.classList.remove('hidden');
    } else {
        const pageObj = appData.pages ? appData.pages.find(p => p.slug === subSlug) : null;
        if (pageObj) {
            document.getElementById('dyn-page-title').textContent = pageObj.title;
            document.getElementById('dyn-page-content').textContent = pageObj.content;
            dynSec?.classList.remove('hidden');
        } else {
            homeSec?.classList.remove('hidden');
        }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==================== STOREFRONT KATALOG & FILTER ====================
function renderCategoryPills() {
    const container = document.getElementById('category-filter-list');
    if (!container) return;

    const allBtn = `
        <button onclick="selectCategoryFilter('ALL')" class="px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-2 ${selectedCategory === 'ALL' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-indigo-400'}">
            <i class="fa-solid fa-border-all"></i> Semua Produk
        </button>
    `;

    const catList = appData.categories || [];
    const catBtns = catList.map(c => {
        const active = selectedCategory === c.id;
        return `
            <button onclick="selectCategoryFilter('${c.id}')" class="px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-2 ${active ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-indigo-400'}">
                <i class="${c.icon || 'fa-solid fa-tag'}"></i> ${c.name}
            </button>
        `;
    }).join('');

    container.innerHTML = allBtn + catBtns;
}

function selectCategoryFilter(catId) {
    selectedCategory = catId;
    renderCategoryPills();
    renderStoreProducts();
}

function renderStoreProducts() {
    const grid = document.getElementById('product-grid');
    if (!grid) return;

    const keyword = (document.getElementById('search-product-input')?.value || '').toLowerCase();
    const productList = appData.products || [];

    const filtered = productList.filter(p => {
        const matchCat = selectedCategory === 'ALL' || p.categoryId === selectedCategory;
        const matchKw = p.name.toLowerCase().includes(keyword) || (p.description && p.description.toLowerCase().includes(keyword));
        return matchCat && matchKw;
    });

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                <i class="fa-solid fa-box-open text-4xl text-slate-300 dark:text-slate-700 mb-3"></i>
                <h4 class="font-bold text-base">Produk Tidak Ditemukan</h4>
                <p class="text-xs text-slate-500 mt-1">Coba gunakan kata kunci pencarian atau kategori lainnya.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = filtered.map(p => {
        const cat = (appData.categories || []).find(c => c.id === p.categoryId);
        const catName = cat ? cat.name : 'Umum';
        const outOfStock = p.stock <= 0;

        return `
            <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
                <div class="relative h-48 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <img src="${p.image}" alt="${p.name}" onerror="this.src='https://placehold.co/600x400/4f46e5/ffffff?text=Aplikasi+Premium'" class="w-full h-full object-cover">
                    <div class="absolute top-3 left-3 flex flex-wrap gap-1.5">
                        <span class="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-slate-900/80 text-white backdrop-blur-md">
                            ${catName}
                        </span>
                        ${p.autoSend ? `
                            <span class="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-400 text-slate-950 flex items-center gap-1 shadow">
                                <i class="fa-solid fa-bolt"></i> Kirim Otomatis
                            </span>
                        ` : ''}
                    </div>
                    <div class="absolute bottom-3 right-3">
                        <span class="px-2.5 py-1 rounded-lg text-[11px] font-bold ${outOfStock ? 'bg-red-600 text-white' : 'bg-emerald-500/90 text-white'} backdrop-blur-md">
                            ${outOfStock ? 'Stok Habis' : `Stok: ${p.stock}`}
                        </span>
                    </div>
                </div>
                <div class="p-5 flex-grow flex flex-col justify-between space-y-4">
                    <div>
                        <h4 class="font-extrabold text-base sm:text-lg line-clamp-1">${p.name}</h4>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">${p.description || ''}</p>
                    </div>
                    <div class="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                        <div>
                            <span class="text-[10px] text-slate-400 uppercase font-semibold block">Harga Terbaik</span>
                            <span class="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">${formatRupiah(p.price)}</span>
                        </div>
                        <button onclick="openCheckoutModal('${p.id}')" ${outOfStock ? 'disabled' : ''} class="px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2 ${outOfStock ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20'}">
                            <i class="fa-solid fa-cart-shopping"></i> ${outOfStock ? 'Habis' : 'Beli Sekarang'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ==================== CHECKOUT & ORDER CREATION ====================
// Pengisian no WhatsApp & catatan tambahan telah dihilangkan sesuai permintaan
function openCheckoutModal(productId) {
    const prod = (appData.products || []).find(p => p.id === productId);
    if (!prod || prod.stock <= 0) {
        showToast('Maaf, stok produk ini sedang habis.', 'error');
        return;
    }
    activeCheckoutProduct = prod;
    const cat = (appData.categories || []).find(c => c.id === prod.categoryId);

    document.getElementById('co-prod-img').src = prod.image;
    document.getElementById('co-prod-cat').textContent = cat ? cat.name : 'Aplikasi Premium';
    document.getElementById('co-prod-name').textContent = prod.name;
    document.getElementById('co-prod-price').textContent = formatRupiah(prod.price);
    
    // Reset field nama & jumlah beli
    document.getElementById('co-customer-name').value = '';
    document.getElementById('co-qty').value = 1;
    document.getElementById('co-qty').max = prod.stock;
    updateCheckoutTotal();

    const modal = document.getElementById('checkout-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeCheckoutModal() {
    const modal = document.getElementById('checkout-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    activeCheckoutProduct = null;
}

function updateCheckoutTotal() {
    if (!activeCheckoutProduct) return;
    let qty = parseInt(document.getElementById('co-qty').value) || 1;
    if (qty < 1) qty = 1;
    if (qty > activeCheckoutProduct.stock) {
        qty = activeCheckoutProduct.stock;
        document.getElementById('co-qty').value = qty;
        showToast(`Maksimal pembelian sesuai sisa stok (${qty})`, 'info');
    }
    const total = activeCheckoutProduct.price * qty;
    document.getElementById('co-total-display').textContent = formatRupiah(total);
}

function processCheckout(method = 'WhatsApp') {
    if (!activeCheckoutProduct) return;

    const name = document.getElementById('co-customer-name').value.trim();
    const qty = parseInt(document.getElementById('co-qty').value) || 1;

    // Validasi hanya nama pembeli
    if (!name) {
        showToast('Mohon masukkan Nama Lengkap / Panggilan Anda!', 'error');
        return;
    }

    if (qty > activeCheckoutProduct.stock) {
        showToast('Jumlah pesanan melebihi stok yang tersedia.', 'error');
        return;
    }

    // Buat ID Order Unik
    const orderId = 'WT-' + Math.floor(1000 + Math.random() * 9000);
    const total = activeCheckoutProduct.price * qty;
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

    // Kurangi stok produk secara langsung
    activeCheckoutProduct.stock -= qty;

    const newOrder = {
        id: orderId,
        customerName: name,
        productId: activeCheckoutProduct.id,
        productName: activeCheckoutProduct.name,
        qty: qty,
        total: total,
        method: method,
        status: 'PENDING',
        createdAt: dateStr,
        autoContentDelivered: activeCheckoutProduct.autoSend ? activeCheckoutProduct.autoContent : ''
    };

    if (!appData.orders) appData.orders = [];
    appData.orders.unshift(newOrder);
    saveAppData();
    renderStoreProducts();

    const prodName = activeCheckoutProduct.name;
    closeCheckoutModal();

    showToast(`Pesanan ${orderId} berhasil dibuat! Mengarahkan ke ${method}...`, 'success');

    // Buat template pesan WhatsApp rapi tanpa no WA / catatan tambahan
    const cleanWa = (appData.settings?.waNumber || '').replace(/[^0-9]/g, '');
    const message = `Halo Admin *${appData.settings?.siteTitle || 'Warung Techno'}* 👋\n` +
        `Saya ingin memesan aplikasi premium:\n\n` +
        `🧾 *ID Order:* ${orderId}\n` +
        `📦 *Produk:* ${prodName}\n` +
        `🔢 *Jumlah:* ${qty}\n` +
        `💰 *Total Bayar:* ${formatRupiah(total)}\n` +
        `👤 *Nama Pemesan:* ${name}\n\n` +
        `Mohon info metode pembayaran & nomor rekening / QRIS. Terima kasih!`;

    const waUrl = `https://wa.me/${cleanWa}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');

    // Masukkan ID order otomatis ke kolom pelacakan
    const trackInput = document.getElementById('track-order-input');
    if (trackInput) trackInput.value = orderId;
}

// ==================== CEK PESANAN (ORDER TRACKING) ====================
function handleTrackOrder() {
    const query = (document.getElementById('track-order-input')?.value || '').trim().toLowerCase();
    const resBox = document.getElementById('track-order-result');

    if (!query) {
        showToast('Masukkan ID Order atau Nama Pemesan terlebih dahulu', 'error');
        return;
    }

    const orderList = appData.orders || [];
    const matches = orderList.filter(o =>
        o.id.toLowerCase() === query ||
        o.customerName.toLowerCase().includes(query)
    );

    if (matches.length === 0) {
        resBox.innerHTML = `
            <div class="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-center text-red-600 dark:text-red-400 text-sm">
                <i class="fa-solid fa-circle-exclamation text-xl mb-1 block"></i>
                Pesanan dengan ID / Nama <b>"${escapeHtml(query)}"</b> tidak ditemukan.
            </div>
        `;
        return;
    }

    resBox.innerHTML = matches.map(o => {
        let badgeClass = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
        let statusLabel = 'PENDING (Menunggu Pembayaran)';
        if (o.status === 'PAID') {
            badgeClass = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
            statusLabel = 'PAID (Lunas / Selesai)';
        } else if (o.status === 'CANCEL') {
            badgeClass = 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30';
            statusLabel = 'CANCEL (Dibatalkan)';
        }

        return `
            <div class="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 mb-4 space-y-4">
                <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
                    <div>
                        <span class="text-xs text-slate-400">ID Pesanan:</span>
                        <span class="font-extrabold text-sm ml-1 text-indigo-600 dark:text-indigo-400">${o.id}</span>
                        <span class="text-xs text-slate-400 ml-2">• ${o.createdAt}</span>
                    </div>
                    <span class="px-3 py-1 rounded-full text-xs font-bold border ${badgeClass}">
                        ${statusLabel}
                    </span>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                        <span class="text-slate-400 block">Pemesan</span>
                        <span class="font-bold text-sm">${escapeHtml(o.customerName)}</span>
                    </div>
                    <div>
                        <span class="text-slate-400 block">Produk Dibeli</span>
                        <span class="font-bold text-sm">${escapeHtml(o.productName)} (x${o.qty})</span>
                    </div>
                    <div>
                        <span class="text-slate-400 block">Total Pembayaran</span>
                        <span class="font-extrabold text-sm text-indigo-600 dark:text-indigo-400">${formatRupiah(o.total)}</span>
                        <span class="block text-slate-500">Via ${o.method}</span>
                    </div>
                </div>
                ${o.status === 'PAID' && o.autoContentDelivered ? `
                    <div class="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1.5">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                                <i class="fa-solid fa-bolt"></i> Data Akun / Voucher Otomatis Anda:
                            </span>
                            <button onclick="copyText('${escapeHtml(o.autoContentDelivered)}')" class="text-[11px] font-semibold px-2.5 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 transition">
                                <i class="fa-regular fa-copy mr-1"></i> Salin
                            </button>
                        </div>
                        <p class="font-mono text-xs bg-white dark:bg-slate-900 p-3 rounded-lg border border-emerald-500/20 select-all">${escapeHtml(o.autoContentDelivered)}</p>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

// ==================== ADMIN AUTH & PANEL NAVIGATION ====================
function openAdminPanel() {
    if (isAdminLoggedIn) {
        switchView('admin');
    } else {
        const modal = document.getElementById('admin-login-modal');
        document.getElementById('admin-login-pass').value = '';
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function closeAdminLoginModal() {
    const modal = document.getElementById('admin-login-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function handleAdminLogin(e) {
    e.preventDefault();
    const inputPass = document.getElementById('admin-login-pass').value;
    if (inputPass === appData.adminPass) {
        isAdminLoggedIn = true;
        closeAdminLoginModal();
        switchView('admin');
        showToast('Selamat datang di Panel Admin Warung Techno!', 'success');
    } else {
        showToast('Password Admin salah!', 'error');
    }
}

function logoutAdmin() {
    isAdminLoggedIn = false;
    switchView('store', 'home');
    showToast('Anda telah keluar dari Panel Admin', 'info');
}

function switchAdminTab(tabName) {
    document.querySelectorAll('.adm-section').forEach(sec => sec.classList.add('hidden'));
    document.getElementById(`adm-content-${tabName}`)?.classList.remove('hidden');

    document.querySelectorAll('.adm-nav-btn').forEach(btn => {
        btn.className = 'adm-nav-btn w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800';
    });

    const activeBtn = document.getElementById(`adm-tab-${tabName}`);
    if (activeBtn) {
        activeBtn.className = 'adm-nav-btn w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition bg-indigo-600 text-white shadow-md shadow-indigo-600/20';
    }

    if (tabName === 'dashboard') renderAdminDashboard();
    if (tabName === 'products') renderAdminProducts();
    if (tabName === 'categories') renderAdminCategories();
    if (tabName === 'orders') renderAdminOrders();
    if (tabName === 'pages') renderAdminPages();
    if (tabName === 'settings') populateSettingsForm();
}

function updateAdminBadge() {
    const pendingCount = appData.orders ? appData.orders.filter(o => o.status === 'PENDING').length : 0;
    const badge = document.getElementById('adm-order-badge');
    if (badge) badge.textContent = pendingCount;
}

// ==================== 1. ADMIN DASHBOARD ====================
function renderAdminDashboard() {
    const orderList = appData.orders || [];
    const productList = appData.products || [];

    const paidOrders = orderList.filter(o => o.status === 'PAID');
    const pendingOrders = orderList.filter(o => o.status === 'PENDING');
    const cancelOrders = orderList.filter(o => o.status === 'CANCEL');
    const revenue = paidOrders.reduce((sum, o) => sum + o.total, 0);

    const totalProducts = productList.length;
    const autoProducts = productList.filter(p => p.autoSend).length;
    const totalStock = productList.reduce((sum, p) => sum + p.stock, 0);
    const lowStock = productList.filter(p => p.stock <= 5).length;

    document.getElementById('stat-revenue').textContent = formatRupiah(revenue);
    document.getElementById('stat-total-orders').textContent = orderList.length;
    document.getElementById('stat-orders-breakdown').textContent = `${paidOrders.length} Paid • ${pendingOrders.length} Pending • ${cancelOrders.length} Cancel`;
    document.getElementById('stat-total-products').textContent = totalProducts;
    document.getElementById('stat-auto-products').textContent = `${autoProducts} Produk Kirim Otomatis`;
    document.getElementById('stat-total-stock').textContent = totalStock;
    document.getElementById('stat-low-stock').textContent = `${lowStock} Produk stok <= 5`;

    // Recent Orders
    const recentWrap = document.getElementById('dash-recent-orders');
    const recentList = orderList.slice(0, 4);
    if (recentList.length === 0) {
        recentWrap.innerHTML = `<p class="text-xs text-slate-400 py-4 text-center">Belum ada orderan masuk.</p>`;
    } else {
        recentWrap.innerHTML = recentList.map(o => `
            <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs">
                <div>
                    <span class="font-bold text-indigo-600 dark:text-indigo-400">${o.id}</span> • <span class="font-semibold">${escapeHtml(o.customerName)}</span>
                    <p class="text-slate-500 truncate max-w-[200px]">${escapeHtml(o.productName)}</p>
                </div>
                <div class="text-right">
                    <span class="font-bold block">${formatRupiah(o.total)}</span>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded ${o.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-500' : o.status === 'CANCEL' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}">${o.status}</span>
                </div>
            </div>
        `).join('');
    }

    // Quick Stock Control
    const stockWrap = document.getElementById('dash-quick-stock');
    stockWrap.innerHTML = productList.map(p => `
        <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs">
            <div class="truncate pr-2">
                <p class="font-bold truncate">${escapeHtml(p.name)}</p>
                <span class="text-[11px] ${p.stock <= 5 ? 'text-amber-500 font-semibold' : 'text-slate-400'}">Sisa Stok: ${p.stock}</span>
            </div>
            <div class="flex items-center gap-1 shrink-0">
                <button onclick="adjustStock('${p.id}', -1)" class="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-red-500 hover:text-white transition font-bold">-</button>
                <button onclick="adjustStock('${p.id}', 1)" class="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-emerald-500 hover:text-white transition font-bold">+</button>
            </div>
        </div>
    `).join('');
}

// ==================== 2. ADMIN KELOLA PRODUK & STOK ====================
function renderAdminProducts() {
    const tbody = document.getElementById('admin-product-tbody');
    const productList = appData.products || [];

    if (productList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-slate-400 text-xs">Belum ada produk. Silakan tambah produk baru.</td></tr>`;
        return;
    }

    tbody.innerHTML = productList.map(p => {
        const cat = (appData.categories || []).find(c => c.id === p.categoryId);
        return `
            <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                <td class="py-3 px-3">
                    <div class="flex items-center gap-3">
                        <img src="${p.image}" onerror="this.src='https://placehold.co/80x80/4f46e5/fff?text=App'" class="w-10 h-10 rounded-lg object-cover shrink-0">
                        <div>
                            <p class="font-bold text-xs sm:text-sm">${escapeHtml(p.name)}</p>
                            <p class="text-[11px] text-slate-400 line-clamp-1 max-w-xs">${escapeHtml(p.description || '')}</p>
                        </div>
                    </div>
                </td>
                <td class="py-3 px-3 text-xs font-medium">${cat ? escapeHtml(cat.name) : '-'}</td>
                <td class="py-3 px-3 text-xs font-bold text-indigo-600 dark:text-indigo-400">${formatRupiah(p.price)}</td>
                <td class="py-3 px-3">
                    <button onclick="toggleProductAutoSend('${p.id}')" class="px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${p.autoSend ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}">
                        <i class="fa-solid fa-bolt mr-1"></i>${p.autoSend ? 'Aktif' : 'Manual'}
                    </button>
                </td>
                <td class="py-3 px-3">
                    <div class="flex items-center justify-center gap-1.5">
                        <button onclick="adjustStock('${p.id}', -1)" title="Kurangi Stok" class="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-red-500 hover:text-white text-xs font-bold transition">-</button>
                        <span class="w-9 text-center font-extrabold text-xs ${p.stock === 0 ? 'text-red-500' : ''}">${p.stock}</span>
                        <button onclick="adjustStock('${p.id}', 1)" title="Tambah Stok" class="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500 hover:text-white text-xs font-bold transition">+</button>
                        <button onclick="clearStock('${p.id}')" title="Kosongkan Stok (0)" class="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white text-xs transition ml-1">
                            <i class="fa-solid fa-ban"></i>
                        </button>
                    </div>
                </td>
                <td class="py-3 px-3 text-right">
                    <div class="flex items-center justify-end gap-1.5">
                        <button onclick="openProductFormModal('${p.id}')" class="px-2.5 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white text-xs font-semibold transition">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button onclick="deleteProduct('${p.id}')" class="px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white text-xs font-semibold transition">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function adjustStock(prodId, delta) {
    const prod = (appData.products || []).find(p => p.id === prodId);
    if (!prod) return;
    prod.stock = Math.max(0, prod.stock + delta);
    saveAppData();
    renderAdminProducts();
    renderAdminDashboard();
    renderStoreProducts();
}

function clearStock(prodId) {
    const prod = (appData.products || []).find(p => p.id === prodId);
    if (!prod) return;
    prod.stock = 0;
    saveAppData();
    renderAdminProducts();
    renderAdminDashboard();
    renderStoreProducts();
    showToast(`Stok "${prod.name}" diatur menjadi 0`, 'info');
}

function toggleProductAutoSend(prodId) {
    const prod = (appData.products || []).find(p => p.id === prodId);
    if (!prod) return;
    prod.autoSend = !prod.autoSend;
    saveAppData();
    renderAdminProducts();
    renderStoreProducts();
    showToast(`Kirim Otomatis "${prod.name}": ${prod.autoSend ? 'Aktif' : 'Nonaktif'}`, 'info');
}

function openProductFormModal(editId = null) {
    const modal = document.getElementById('product-form-modal');
    const catSelect = document.getElementById('prod-category');
    catSelect.innerHTML = (appData.categories || []).map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');

    if (editId) {
        const p = (appData.products || []).find(item => item.id === editId);
        if (!p) return;
        document.getElementById('prod-modal-title').textContent = 'Edit Produk';
        document.getElementById('prod-id').value = p.id;
        document.getElementById('prod-name').value = p.name;
        document.getElementById('prod-category').value = p.categoryId;
        document.getElementById('prod-price').value = p.price;
        document.getElementById('prod-stock').value = p.stock;
        document.getElementById('prod-image').value = p.image;
        document.getElementById('prod-desc').value = p.description || '';
        document.getElementById('prod-auto-send').checked = !!p.autoSend;
        document.getElementById('prod-auto-content').value = p.autoContent || '';
    } else {
        document.getElementById('prod-modal-title').textContent = 'Tambah Produk Baru';
        document.getElementById('prod-id').value = '';
        document.getElementById('prod-name').value = '';
        document.getElementById('prod-price').value = '';
        document.getElementById('prod-stock').value = 10;
        document.getElementById('prod-image').value = '';
        document.getElementById('prod-desc').value = '';
        document.getElementById('prod-auto-send').checked = true;
        document.getElementById('prod-auto-content').value = '';
    }
    toggleAutoSendField();
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeProductFormModal() {
    const modal = document.getElementById('product-form-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

function toggleAutoSendField() {
    const checked = document.getElementById('prod-auto-send').checked;
    document.getElementById('auto-send-data-wrap')?.classList.toggle('hidden', !checked);
}

function handleSaveProduct(e) {
    e.preventDefault();
    const id = document.getElementById('prod-id').value;
    const name = document.getElementById('prod-name').value.trim();
    const categoryId = document.getElementById('prod-category').value;
    const price = parseInt(document.getElementById('prod-price').value) || 0;
    const stock = parseInt(document.getElementById('prod-stock').value) || 0;
    const image = document.getElementById('prod-image').value.trim() || `https://placehold.co/600x400/4f46e5/ffffff?text=${encodeURIComponent(name)}`;
    const description = document.getElementById('prod-desc').value.trim();
    const autoSend = document.getElementById('prod-auto-send').checked;
    const autoContent = document.getElementById('prod-auto-content').value.trim();

    if (!appData.products) appData.products = [];

    if (id) {
        const idx = appData.products.findIndex(p => p.id === id);
        if (idx > -1) {
            appData.products[idx] = { id, name, categoryId, price, stock, image, description, autoSend, autoContent };
        }
        showToast('Produk berhasil diperbarui!', 'success');
    } else {
        const newProd = {
            id: 'prod-' + Date.now(),
            name, categoryId, price, stock, image, description, autoSend, autoContent
        };
        appData.products.unshift(newProd);
        showToast('Produk baru berhasil ditambahkan!', 'success');
    }

    saveAppData();
    closeProductFormModal();
    renderAdminProducts();
    renderStoreProducts();
}

function deleteProduct(prodId) {
    const prod = (appData.products || []).find(p => p.id === prodId);
    if (!prod) return;
    openConfirmModal('Hapus Produk', `Apakah Anda yakin ingin menghapus produk "${prod.name}"?`, () => {
        appData.products = appData.products.filter(p => p.id !== prodId);
        saveAppData();
        renderAdminProducts();
        renderStoreProducts();
        showToast('Produk berhasil dihapus', 'info');
    });
}

// ==================== 3. ADMIN KELOLA KATEGORI ====================
function renderAdminCategories() {
    const list = document.getElementById('admin-category-list');
    const catList = appData.categories || [];
    const prodList = appData.products || [];

    list.innerHTML = catList.map(c => {
        const count = prodList.filter(p => p.categoryId === c.id).length;
        return `
            <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                        <i class="${c.icon || 'fa-solid fa-tag'}"></i>
                    </div>
                    <div>
                        <h4 class="font-bold text-xs sm:text-sm">${escapeHtml(c.name)}</h4>
                        <p class="text-[11px] text-slate-400">${count} Produk</p>
                    </div>
                </div>
                <div class="flex gap-1.5">
                    <button onclick="editCategory('${c.id}')" class="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 hover:bg-indigo-600 hover:text-white text-xs transition"><i class="fa-solid fa-pen"></i></button>
                    <button onclick="deleteCategory('${c.id}')" class="w-8 h-8 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-600 hover:text-white text-xs transition"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        `;
    }).join('');
}

function handleSaveCategory(e) {
    e.preventDefault();
    const editId = document.getElementById('cat-edit-id').value;
    const name = document.getElementById('cat-name-input').value.trim();
    const icon = document.getElementById('cat-icon-input').value.trim() || 'fa-solid fa-layer-group';

    if (!appData.categories) appData.categories = [];

    if (editId) {
        const cat = appData.categories.find(c => c.id === editId);
        if (cat) { cat.name = name; cat.icon = icon; }
        showToast('Kategori diperbarui!', 'success');
    } else {
        appData.categories.push({ id: 'cat-' + Date.now(), name, icon });
        showToast('Kategori baru ditambahkan!', 'success');
    }

    resetCategoryForm();
    saveAppData();
    renderAdminCategories();
    renderCategoryPills();
    renderStoreProducts();
}

function editCategory(catId) {
    const cat = (appData.categories || []).find(c => c.id === catId);
    if (!cat) return;
    document.getElementById('cat-edit-id').value = cat.id;
    document.getElementById('cat-name-input').value = cat.name;
    document.getElementById('cat-icon-input').value = cat.icon;
    document.getElementById('cat-submit-btn').textContent = 'Update Kategori';
    document.getElementById('cat-cancel-btn').classList.remove('hidden');
}

function resetCategoryForm() {
    document.getElementById('cat-edit-id').value = '';
    document.getElementById('cat-name-input').value = '';
    document.getElementById('cat-icon-input').value = '';
    document.getElementById('cat-submit-btn').textContent = 'Simpan Kategori';
    document.getElementById('cat-cancel-btn').classList.add('hidden');
}

function deleteCategory(catId) {
    openConfirmModal('Hapus Kategori', 'Yakin ingin menghapus kategori ini?', () => {
        appData.categories = (appData.categories || []).filter(c => c.id !== catId);
        saveAppData();
        renderAdminCategories();
        renderCategoryPills();
        showToast('Kategori dihapus', 'info');
    });
}

// ==================== 4. ADMIN LIST ORDERAN ====================
function renderAdminOrders() {
    const tbody = document.getElementById('admin-orders-tbody');
    const filter = document.getElementById('filter-order-status').value;
    const orderList = appData.orders || [];

    const list = orderList.filter(o => filter === 'ALL' || o.status === filter);

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-slate-400 text-xs">Tidak ada data orderan.</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(o => {
        let statusBadge = `<span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">PENDING</span>`;
        if (o.status === 'PAID') statusBadge = `<span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">PAID</span>`;
        if (o.status === 'CANCEL') statusBadge = `<span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/10 text-red-600 dark:text-red-400">CANCEL</span>`;

        return `
            <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                <td class="py-3 px-3">
                    <span class="font-extrabold text-xs text-indigo-600 dark:text-indigo-400 block">${o.id}</span>
                    <span class="text-[11px] text-slate-400">${o.createdAt}</span>
                </td>
                <td class="py-3 px-3">
                    <span class="font-bold text-xs block">${escapeHtml(o.customerName)}</span>
                </td>
                <td class="py-3 px-3">
                    <span class="font-semibold text-xs block">${escapeHtml(o.productName)}</span>
                    <span class="text-[11px] text-slate-400">Qty: ${o.qty}</span>
                </td>
                <td class="py-3 px-3">
                    <span class="font-bold text-xs block">${formatRupiah(o.total)}</span>
                    <span class="text-[10px] text-slate-400">${o.method}</span>
                </td>
                <td class="py-3 px-3">${statusBadge}</td>
                <td class="py-3 px-3 text-right">
                    <div class="flex items-center justify-end gap-1">
                        <button onclick="updateOrderStatus('${o.id}', 'PAID')" title="Set Paid (Lunas)" class="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-600 hover:text-white text-[11px] font-bold transition">
                            Paid
                        </button>
                        <button onclick="updateOrderStatus('${o.id}', 'CANCEL')" title="Set Cancel (Batal)" class="px-2.5 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 hover:bg-amber-600 hover:text-white text-[11px] font-bold transition">
                            Cancel
                        </button>
                        <button onclick="deleteOrder('${o.id}')" title="Hapus Orderan" class="px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-600 hover:text-white text-[11px] font-bold transition">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function updateOrderStatus(orderId, newStatus) {
    const ord = (appData.orders || []).find(o => o.id === orderId);
    if (!ord) return;
    ord.status = newStatus;
    saveAppData();
    renderAdminOrders();
    showToast(`Status Order ${orderId} diubah menjadi ${newStatus}`, 'success');
}

function deleteOrder(orderId) {
    openConfirmModal('Hapus Orderan', `Yakin ingin menghapus permanen orderan ${orderId}?`, () => {
        appData.orders = (appData.orders || []).filter(o => o.id !== orderId);
        saveAppData();
        renderAdminOrders();
        showToast(`Orderan ${orderId} berhasil dihapus`, 'info');
    });
}

// ==================== 5. ADMIN KELOLA HALAMAN ====================
function renderAdminPages() {
    const list = document.getElementById('admin-pages-list');
    const pages = appData.pages || [];

    list.innerHTML = pages.map(p => `
        <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
            <div class="min-w-0">
                <div class="flex items-center gap-2">
                    <h4 class="font-bold text-sm">${escapeHtml(p.title)}</h4>
                    <span class="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-mono">/${p.slug}</span>
                    ${p.isSystem ? `<span class="text-[10px] px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-500">Utama</span>` : ''}
                </div>
                <p class="text-xs text-slate-400 line-clamp-1 mt-1">${escapeHtml(p.content)}</p>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
                <button onclick="editPage('${p.id}')" class="px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 hover:bg-indigo-600 hover:text-white text-xs font-semibold transition">
                    Edit
                </button>
                ${!p.isSystem ? `
                    <button onclick="deletePage('${p.id}')" class="px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-600 hover:text-white text-xs font-semibold transition">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function handleSavePage(e) {
    e.preventDefault();
    const editId = document.getElementById('page-edit-id').value;
    const title = document.getElementById('page-title-input').value.trim();
    const slug = document.getElementById('page-slug-input').value.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    const content = document.getElementById('page-content-input').value.trim();

    if (!appData.pages) appData.pages = [];

    if (editId) {
        const pg = appData.pages.find(p => p.id === editId);
        if (pg) {
            pg.title = title;
            if (!pg.isSystem) pg.slug = slug;
            pg.content = content;
        }
        showToast('Halaman berhasil diperbarui!', 'success');
    } else {
        appData.pages.push({
            id: 'page-' + Date.now(),
            title,
            slug,
            isSystem: false,
            content
        });
        showToast('Halaman baru berhasil ditambahkan!', 'success');
    }

    resetPageForm();
    saveAppData();
    applySiteSettingsToDOM();
    renderNavigation();
    renderAdminPages();
}

function editPage(pageId) {
    const pg = (appData.pages || []).find(p => p.id === pageId);
    if (!pg) return;
    document.getElementById('page-edit-id').value = pg.id;
    document.getElementById('page-title-input').value = pg.title;
    document.getElementById('page-slug-input').value = pg.slug;
    document.getElementById('page-slug-input').disabled = !!pg.isSystem;
    document.getElementById('page-content-input').value = pg.content;
}

function resetPageForm() {
    document.getElementById('page-edit-id').value = '';
    document.getElementById('page-title-input').value = '';
    document.getElementById('page-slug-input').value = '';
    document.getElementById('page-slug-input').disabled = false;
    document.getElementById('page-content-input').value = '';
}

function deletePage(pageId) {
    openConfirmModal('Hapus Halaman', 'Yakin ingin menghapus halaman ini?', () => {
        appData.pages = (appData.pages || []).filter(p => p.id !== pageId);
        saveAppData();
        renderNavigation();
        renderAdminPages();
        showToast('Halaman berhasil dihapus', 'info');
    });
}

// ==================== 6. ADMIN PENGATURAN WEBSITE ====================
function populateSettingsForm() {
    const s = appData.settings || {};
    document.getElementById('set-site-title').value = s.siteTitle || '';
    document.getElementById('set-site-desc').value = s.siteDesc || '';
    document.getElementById('set-logo-url').value = s.logoUrl || '';
    document.getElementById('set-favicon-url').value = s.faviconUrl || '';
    document.getElementById('set-google-verify').value = s.googleVerify || '';
    document.getElementById('set-wa-number').value = s.waNumber || '';
    document.getElementById('set-telegram-bot').value = s.telegramBotUrl || '';
    document.getElementById('set-banner-badge').value = s.bannerBadge || '';
    document.getElementById('set-banner-title').value = s.bannerTitle || '';
    document.getElementById('set-banner-subtitle').value = s.bannerSubtitle || '';
    document.getElementById('set-footer-about').value = s.footerAbout || '';
    document.getElementById('set-footer-copy').value = s.footerCopy || '';
    document.getElementById('set-footer-ig').value = s.footerIg || '';
}

function handleSaveSettings(e) {
    e.preventDefault();
    appData.settings = {
        siteTitle: document.getElementById('set-site-title').value.trim(),
        siteDesc: document.getElementById('set-site-desc').value.trim(),
        logoUrl: document.getElementById('set-logo-url').value.trim(),
        faviconUrl: document.getElementById('set-favicon-url').value.trim(),
        googleVerify: document.getElementById('set-google-verify').value.trim(),
        waNumber: document.getElementById('set-wa-number').value.trim(),
        telegramBotUrl: document.getElementById('set-telegram-bot').value.trim(),
        bannerBadge: document.getElementById('set-banner-badge').value.trim(),
        bannerTitle: document.getElementById('set-banner-title').value.trim(),
        bannerSubtitle: document.getElementById('set-banner-subtitle').value.trim(),
        footerAbout: document.getElementById('set-footer-about').value.trim(),
        footerCopy: document.getElementById('set-footer-copy').value.trim(),
        footerIg: document.getElementById('set-footer-ig').value.trim()
    };
    saveAppData();
    applySiteSettingsToDOM();
    showToast('Pengaturan website berhasil disimpan!', 'success');
}

// ==================== 7. ADMIN PASSWORD ====================
function handleChangePassword(e) {
    e.preventDefault();
    const oldP = document.getElementById('pwd-old').value;
    const newP = document.getElementById('pwd-new').value;
    const confP = document.getElementById('pwd-confirm').value;

    if (oldP !== appData.adminPass) {
        showToast('Password lama tidak sesuai!', 'error');
        return;
    }
    if (newP !== confP) {
        showToast('Konfirmasi password baru tidak cocok!', 'error');
        return;
    }
    appData.adminPass = newP;
    saveAppData();
    e.target.reset();
    showToast('Password Admin berhasil diperbarui!', 'success');
}

// ==================== UTILITIES (IMAGE UPLOAD, TOAST, COPY, CONFIRM) ====================
function handleImageUpload(event, targetInputId) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById(targetInputId).value = e.target.result;
        showToast('Gambar berhasil dimuat!', 'success');
    };
    reader.readAsDataURL(file);
}

function formatRupiah(num) {
    return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function copyText(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('Data akun berhasil disalin ke clipboard!', 'success');
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    let colors = 'bg-slate-900 text-white dark:bg-white dark:text-slate-900';
    let icon = 'fa-circle-info text-indigo-400';

    if (type === 'success') {
        colors = 'bg-emerald-600 text-white';
        icon = 'fa-circle-check text-white';
    } else if (type === 'error') {
        colors = 'bg-red-600 text-white';
        icon = 'fa-triangle-exclamation text-white';
    }

    toast.className = `pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl text-xs sm:text-sm font-semibold transform transition-all duration-300 ${colors}`;
    toast.innerHTML = `<i class="fa-solid ${icon} text-base"></i><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3200);
}

function openConfirmModal(title, message, onYes) {
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').textContent = message;
    confirmCallback = onYes;
    const modal = document.getElementById('confirm-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    document.getElementById('confirm-yes-btn').onclick = () => {
        if (confirmCallback) confirmCallback();
        closeConfirmModal();
    };
}

function closeConfirmModal() {
    const modal = document.getElementById('confirm-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    confirmCallback = null;
}
