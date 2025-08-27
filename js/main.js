// =============================================================
// ==      الملف الرئيسي (نقطة انطلاق التطبيق والغراء)        ==
// =============================================================

import * as ui from './ui.js';
import { fetchPageData } from './api.js';
import * as quiz from './quiz.js';
import * as player from './player.js';
import * as progression from './progression.js';
import * as store from './store.js';

// --- 1. دالة التهيئة الرئيسية ---
async function initialize() {
    console.log("التطبيق قيد التشغيل...");
    
    // تهيئة الخيارات المقفلة في الواجهة أولاً
    ui.initializeLockedOptions();

    // جلب كل الإعدادات من لوحة التحكم بالتوازي لزيادة السرعة
    await Promise.all([
        quiz.initializeQuiz(),
        progression.initializeProgression()
    ]);
    
    // بعد جلب الإعدادات، قم بتطبيق قواعد اللعبة على الواجهة
    const rules = progression.getGameRules();
    if (rules) {
        ui.applyGameRules(rules);
    }
    
    console.log("تم جلب جميع الإعدادات وتطبيق القواعد. التطبيق جاهز.");
    
    // الآن، قم بإعداد مستمعي الأحداث
    setupEventListeners();
    
    // وأخيراً، أظهر شاشة البداية
    ui.showScreen(ui.startScreen);
}

// --- 2. ربط الأحداث (Event Listeners) ---
function setupEventListeners() {
    ui.startButton.addEventListener('click', onStartButtonClick);
    ui.reloadButton.addEventListener('click', () => location.reload());
    ui.storeButton.addEventListener('click', onStoreButtonClick);
    ui.closeStoreButton.addEventListener('click', () => ui.showScreen(ui.startScreen));
}

/**
 * يتم تشغيلها عند النقر على زر "المتجر".
 */
function onStoreButtonClick() {
    // لا يمكن فتح المتجر قبل تسجيل الدخول
    if (ui.userNameInput.disabled === false) {
        alert("الرجاء إدخال اسمك وتسجيل الدخول أولاً لزيارة المتجر.");
        return;
    }
    store.openStore();
}

// --- 3. منطق بدء الاختبار وتسجيل الدخول ---
async function onStartButtonClick() {
    const userName = ui.userNameInput.value.trim();
    if (!userName) {
        alert('الرجاء إدخال اسمك أولاً.');
        return;
    }

    // --- الحالة الأولى: تسجيل الدخول ---
    // إذا كان حقل الاسم مفعّلاً، فهذا يعني أن المستخدم لم يسجل دخوله بعد
    if (ui.userNameInput.disabled === false) {
        ui.toggleLoader(true);
        const playerLoaded = await player.loadPlayer(userName);
        ui.toggleLoader(false);

        if (!playerLoaded) return; // في حالة فشل التحميل

        // تطبيق تأثيرات العناصر التي يمتلكها اللاعب
        ui.applyInventoryEffects(player.playerData.inventory);

        // عرض معلومات اللاعب وتعطيل حقل الاسم
        const levelInfo = progression.getLevelInfo(player.playerData.xp);
        ui.updatePlayerDisplay(player.playerData, levelInfo);
        ui.userNameInput.disabled = true;
        ui.startButton.textContent = "ابدأ الاختبار"; // تغيير نص الزر
        alert(`مرحباً بك ${userName}! تم تحميل تقدمك. الآن اختر صفحة وابدأ الاختبار.`);
        return;
    }

    // --- الحالة الثانية: بدء الاختبار ---
    // إذا كان حقل الاسم معطلاً، فهذا يعني أن المستخدم مسجل دخوله وجاهز للعب
    const pageNumber = ui.pageNumberInput.value;
    const rules = progression.getGameRules();
    const allowedPages = String(rules.allowedPages || '').split(',').map(p => p.trim());

    if (!pageNumber || !allowedPages.includes(pageNumber)) {
        alert(`الرجاء إدخال رقم صفحة مسموح به فقط: ${allowedPages.join(', ')}`);
        return;
    }

    const questionsCount = rules.questionsCount || 5;

    ui.toggleLoader(true);
    const ayahs = await fetchPageData(pageNumber);
    ui.toggleLoader(false);

    if (ayahs) {
        quiz.start({
            pageAyahs: ayahs,
            totalQuestions: questionsCount,
            selectedQari: ui.qariSelect.value,
            userName: player.playerData.name,
            pageNumber: pageNumber
        });
    }
}

// --- 4. تشغيل التطبيق ---
initialize();
