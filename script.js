// --------------------------------------------------------------------------
// 1. Global State & Constants
// --------------------------------------------------------------------------

let allData = {};
let topicChart;
let currentState = {
    subject: null,
    year: null,
    type: null,
    noteCategory: null,
    noteSubject: null
};

// --------------------------------------------------------------------------
// 2. Application Lifecycle
// --------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    fetch('4sem.json')
        .then(response => response.ok ? response.json() : Promise.reject(response.status))
        .then(data => {
            allData = data;
            initializeApp();
        })
        .catch(error => {
            console.error('Error loading data:', error);
            document.getElementById('content-area').innerHTML = `<div class="text-center text-red-500 p-8 card rounded-lg"><h3>দুঃখিত, ডেটা লোড করা যায়নি।</h3></div>`;
        });
});

function initializeApp() {
    const homeButton = document.getElementById('home-button');
    const themeToggle = document.getElementById('theme-toggle');
    const subjectNav = document.getElementById('subject-nav');
    const yearFilter = document.getElementById('year-filter');

    renderNav(subjectNav);

    if (homeButton) homeButton.onclick = showHomePage;
    if (themeToggle) themeToggle.addEventListener('change', handleThemeToggle);
    if (yearFilter) yearFilter.onchange = handleYearChange;

    window.addEventListener('scroll', () => {
    const nav = document.getElementById('subject-nav');
    nav.classList.toggle('nav-scrolled', window.scrollY > 10);
    });
    const syllabusButton = document.getElementById('syllabus-button');
    if (syllabusButton) syllabusButton.onclick = showSyllabus;

    // নতুন: URL পরিবর্তনের জন্য ইভেন্ট লিসেনার
    window.addEventListener('hashchange', handleHashChange);
    // নতুন: পেজ লোড হওয়ার সময় URL চেক করার জন্য
    handleHashChange();

    applyTheme();
}

function showHomePage() {
    document.getElementById('syllabus-section').classList.add('hidden');
    document.getElementById('intro-section').classList.remove('hidden');
    document.getElementById('chart-section').classList.add('hidden');
    document.getElementById('filter-section').classList.add('hidden');
    document.getElementById('question-display').innerHTML = '';
    document.getElementById('mcq-result-section').classList.add('hidden');

    document.querySelectorAll('#subject-nav button').forEach(btn => btn.classList.remove('active'));

    currentState = { subject: null, year: null, type: null, noteCategory: null, noteSubject: null };
    
    // নতুন: URL হ্যাশ আপডেট করা
    updateHashFromState();
}

function showSyllabus() {
    // --- অপরিবর্তিত অংশ ---
    document.getElementById('syllabus-section').classList.remove('hidden');
    document.getElementById('intro-section').classList.add('hidden');
    document.getElementById('chart-section').classList.add('hidden');
    document.getElementById('filter-section').classList.add('hidden');
    document.getElementById('question-display').innerHTML = '';

    const customSyllabusNames = {
        bangla: "বাংলা পেপার-১",
        english: "ইংরেজি পেপার-১",
        ict: "আইসিটি শিক্ষা পেপার-১",
        shikkhaMonobiggan: "শিক্ষা মনোবিজ্ঞান ও নির্দেশনা",
        ict_in_edu: "শিক্ষায় আইসিটি",
        bangla_paper_2: "Bangla Paper-II",
        english_paper_2: "English Paper-II",
        ict_education_2: "ICT Education Paper-II",
        genderEducation: "Gender Education",
        organizationManagement: "Organization and Management of Educational Institutions"
    };

    const list = document.getElementById('syllabus-list');
    list.innerHTML = '';

    // সিলেবাস কন্টেন্ট দেখানোর জন্য হেল্পার ফাংশন (এটি আগের মতোই)
    const renderSyllabusContent = (key, showTranslated = false) => {
        const content = document.getElementById('syllabus-content');
        if (!allData.syllabus[key]) {
            content.innerHTML = '<p>এই বিষয়ের সিলেবাস পাওয়া যায়নি।</p>';
            return;
        }

        if (showTranslated && allData.syllabus[key].translated) {
            content.innerHTML = allData.syllabus[key].translated;
            const originalBtn = document.createElement('button');
            originalBtn.textContent = 'মূল সিলেবাস দেখুন';
            originalBtn.className = 'syllabus-toggle-button filter-button';
            originalBtn.onclick = () => renderSyllabusContent(key, false);
            content.appendChild(originalBtn);
        } else {
            content.innerHTML = allData.syllabus[key].content;
            if (allData.syllabus[key].translated) {
                const transBtn = document.createElement('button');
                transBtn.textContent = 'অনুবাদ দেখুন';
                transBtn.className = 'syllabus-toggle-button filter-button';
                transBtn.onclick = () => renderSyllabusContent(key, true);
                content.appendChild(transBtn);
            }
        }

        // টেবিল র‍্যাপ করার কোড
        content.querySelectorAll('table').forEach(table => {
            if (!table.parentNode.classList.contains('table-wrapper')) {
                const wrapper = document.createElement('div');
                wrapper.className = 'table-wrapper';
                table.parentNode.insertBefore(wrapper, table);
                wrapper.appendChild(table);
            }
        });
    };

    // ধাপ ২: JSON ফাইল থেকে সিলেবাসের বিষয়গুলোর তালিকা ডায়নামিকভাবে নিন
    const syllabusKeys = Object.keys(allData.syllabus);

    // --- বিষয়ভিত্তিক বাটন তৈরির চূড়ান্ত লুপ ---
    syllabusKeys.forEach(key => {
        const btn = document.createElement('button');

        // ধাপ ৩: বাটনের নামটি প্রথমে কাস্টম তালিকা থেকে খোঁজা হবে
        // যদি কাস্টম তালিকায় না পাওয়া যায়, তবে JSON ফাইলের নামটি ব্যবহৃত হবে
        const buttonText = customSyllabusNames[key] || (allData[key] ? allData[key].name : key);

        btn.textContent = buttonText;
        btn.className = 'syllabus-subject-button filter-button py-2 px-4 rounded-md';
        btn.onclick = () => renderSyllabusContent(key);
        list.appendChild(btn);
    });

    // প্রথমবার সিলেবাস সেকশন লোড হলে কন্টেন্ট এরিয়া খালি দেখানোর জন্য
    document.getElementById('syllabus-content').innerHTML = '<p class="text-center text-zinc-500">অনুগ্রহ করে উপরের তালিকা থেকে একটি বিষয় নির্বাচন করুন।</p>';
}
// --------------------------------------------------------------------------
// 3. UI Rendering Functions (কোনো পরিবর্তন নেই)
// --------------------------------------------------------------------------

function renderNav(subjectNav) {
    subjectNav.innerHTML = '';
    Object.keys(allData).forEach(key => {
        if (key === 'syllabus') return;
        const subject = allData[key];
        const button = document.createElement('button');
        button.className = 'nav-button py-2 px-5 rounded-full font-semibold flex items-center gap-2';
        button.innerHTML = `<span>${subject.icon}</span> <span>${subject.name}</span>`;
        button.dataset.subject = key;
        button.onclick = () => selectSubject(key);
        subjectNav.appendChild(button);
    });
}

function renderFilters() {
    const subjectData = allData[currentState.subject];
    const yearFilter = document.getElementById('year-filter');
    const typeFilter = document.getElementById('type-filter');

    yearFilter.innerHTML = '';
    subjectData.years.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);
    });
    yearFilter.value = currentState.year;

    typeFilter.innerHTML = '';
    const availableTypes = allData[currentState.subject].questions[currentState.year] || {};

    // createFilterButton এখন আর onclick সেট করে না, তাই এখানে করতে হবে
    if (availableTypes.written && availableTypes.written.length > 0) {
        const button = createFilterButton('written', 'লিখিত');
        button.classList.toggle('active', 'written' === currentState.type);
        button.onclick = () => handleTypeChange('written');
        typeFilter.appendChild(button);
    }
    if (availableTypes.mcq && availableTypes.mcq.length > 0) {
        const button = createFilterButton('mcq', 'MCQ');
        button.classList.toggle('active', 'mcq' === currentState.type);
        button.onclick = () => handleTypeChange('mcq');
        typeFilter.appendChild(button);
    }
}

function renderQuestions() {
    const questionDisplay = document.getElementById('question-display');
    questionDisplay.innerHTML = '';
    const { subject, year, type } = currentState;
    const questions = allData[subject]?.questions[year]?.[type] || [];
    updateMCQResultVisibility(type, questions.length);
    if (questions.length === 0) {
        questionDisplay.innerHTML = `<div class="text-center text-zinc-500 p-8 card rounded-lg fade-in">এই সেকশনে কোনো প্রশ্ন পাওয়া যায়নি।</div>`;
        return;
    }
    questions.forEach((item, index) => {
        let element;
        if (type === 'written') element = createWrittenQuestionElement(item, index);
        else if (type === 'mcq') element = createMCQElement(item, index);
        if (element) questionDisplay.appendChild(element);
    });
    setTimeout(setupNewQuestionAnimations, 50);
}

function renderChart() {
    const ctx = document.getElementById('topicChart').getContext('2d');
    if (topicChart) topicChart.destroy();
    const analysisData = allData[currentState.subject]?.analysis;
    if (!analysisData) return;
    const isDarkMode = document.body.classList.contains('dark');
    const gridColor = isDarkMode ? 'rgba(228, 228, 231, 0.2)' : 'rgba(228, 228, 231, 0.7)';
    const tickColor = isDarkMode ? '#a1a1aa' : '#52525b';
    topicChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: analysisData.labels,
            datasets: [{
                label: 'প্রশ্ন সংখ্যা',
                data: analysisData.data,
                backgroundColor: isDarkMode ? 'rgba(161, 161, 170, 0.6)' : 'rgba(113, 113, 122, 0.6)',
                borderColor: isDarkMode ? 'rgba(161, 161, 170, 1)' : 'rgba(113, 113, 122, 1)',
                borderWidth: 1,
                borderRadius: 5
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, grid: { color: gridColor }, ticks: { color: tickColor, font: { family: 'Hind Siliguri' } } },
                x: { grid: { display: false }, ticks: { color: tickColor, font: { family: 'Hind Siliguri' } } }
            },
            plugins: {
                legend: { display: false },
                tooltip: { backgroundColor: '#52525b', titleFont: { family: 'Hind Siliguri' }, bodyFont: { family: 'Hind Siliguri' }, padding: 10, cornerRadius: 5 }
            }
        }
    });
}

// ... Component Creation Functions (createWrittenQuestionElement, createMCQElement, etc. এখানে কোনো পরিবর্তন নেই) ...

function createWrittenQuestionElement(item, index) {
    const answerWrapper = document.createElement('div');
    answerWrapper.className = 'answer-content prose max-w-none dark:prose-invert';
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = item.a || "<p>উত্তর পাওয়া যায়নি।</p>";
    sanitizeContent(tempDiv);
    answerWrapper.appendChild(tempDiv);
    return createAccordionComponent(formatQuestionText(item.q), answerWrapper, index);
}

function createMCQElement(item, index) {
    const card = document.createElement('div');
    card.className = 'card p-6 rounded-lg shadow-sm';
    card.innerHTML = `<h4 class="mcq-question-title">${item.q}</h4>`;
    const optionsGrid = document.createElement('div');
    optionsGrid.className = 'grid grid-cols-1 md:grid-cols-2 gap-3 mt-4';
    item.o.forEach(optionText => {
        const optionEl = document.createElement('div');
        optionEl.className = 'mcq-option p-3 rounded-md flex items-center gap-3';
        optionEl.innerHTML = `<span class="option-icon font-bold w-4"></span><span>${optionText}</span>`;
        optionEl.onclick = () => handleMCQOptionClick(optionEl, item);
        optionsGrid.appendChild(optionEl);
    });
    card.appendChild(optionsGrid);
    return card;
}

function createAccordionComponent(title, contentElement, index) {
    const accordionItem = document.createElement('div');
    accordionItem.className = 'card p-0 rounded-lg shadow-sm overflow-hidden';
    const accordionHeader = document.createElement('button');
    accordionHeader.className = 'question-accordion-header';

    // ---- মূল পরিবর্তন এখানেই ----
    // এখন থেকে title হিসেবে সাধারণ লেখা এবং HTML কোড দুটোই এখানে কাজ করবে
    const finalTitle = (typeof title === 'string' && title.trim().startsWith('<')) 
        ? title 
        : `<span class="pr-4">${title}</span>`;

    accordionHeader.innerHTML = `${finalTitle}<span class="text-2xl font-light transition-transform duration-300 transform_plus">+</span>`;
    
    const accordionBody = document.createElement('div');
    accordionBody.className = 'question-accordion-body';
    accordionBody.appendChild(contentElement);
    accordionHeader.onclick = () => handleAccordionClick(accordionHeader, accordionBody);
    accordionItem.append(accordionHeader, accordionBody);
    return accordionItem;
}

function createFilterButton(key, text) {
    const button = document.createElement('button');
    button.className = 'filter-button py-2 px-4 rounded-md text-sm font-medium';
    button.textContent = text;
    button.dataset.key = key; // data-type এর পরিবর্তে data-key ব্যবহার করা হলো
    return button;
}

// --------------------------------------------------------------------------
// 4. Event Handlers & Logic
// --------------------------------------------------------------------------

function selectSubject(subjectKey) {
    document.getElementById('syllabus-section').classList.add('hidden');
    const subjectData = allData[subjectKey];

    // ক্লাস নোটস ক্যাটাগরির জন্য বিশেষ ব্যবস্থা
    if (subjectData.isNoteCategory) {
        currentState.subject = subjectKey;
        currentState.year = null;
        currentState.type = 'notes';
        currentState.noteSubject = null;

        document.getElementById('intro-section').classList.add('hidden');
        document.getElementById('chart-section').classList.add('hidden');
        document.getElementById('question-display').innerHTML = '';
        document.getElementById('mcq-result-section').classList.add('hidden');
        
        document.getElementById('filter-section').classList.remove('hidden');
        document.getElementById('regular-filters').classList.add('hidden');
        
        const notesFilterDiv = document.getElementById('classnotes-filters');
        notesFilterDiv.classList.remove('hidden');
        notesFilterDiv.innerHTML = '';

        Object.keys(subjectData.subjects).forEach(noteSubKey => {
            const button = createFilterButton(noteSubKey, allData[noteSubKey].name);
            button.onclick = () => selectNoteSubject(noteSubKey); // সঠিক onclick সেট করা
            notesFilterDiv.appendChild(button);
        });

    } else {
        // অন্যান্য সাধারণ বিষয়ের জন্য
        currentState.subject = subjectKey;
        currentState.year = subjectData.years[0];
        const firstYearTypes = subjectData.questions[currentState.year] || {};
        currentState.type = (firstYearTypes.written && firstYearTypes.written.length > 0) ? 'written' : 'mcq';
        
        document.getElementById('regular-filters').classList.remove('hidden');
        document.getElementById('classnotes-filters').classList.add('hidden');
    }
    
    updateHashFromState();
}

function handleYearChange(event) {
    currentState.year = event.target.value;
    // নতুন: URL হ্যাশ আপডেট করা
    updateHashFromState();
}

function handleTypeChange(typeKey) {
    currentState.type = typeKey;
    // নতুন: URL হ্যাশ আপডেট করা
    updateHashFromState();
}

function handleThemeToggle(event) {
    localStorage.setItem('theme', event.target.checked ? 'dark' : 'light');
    applyTheme(true);
}

function handleAccordionClick(header, body) {
    const isOpening = !header.classList.contains('active');
    document.querySelectorAll('.question-accordion-header.active').forEach(h => {
        if (h !== header) {
            h.classList.remove('active');
            const b = h.nextElementSibling;
            b.style.maxHeight = null;
            b.style.paddingTop = '0';
            b.style.paddingBottom = '0';
            h.querySelector('.transform_plus').textContent = '+';
        }
    });
    header.classList.toggle('active', isOpening);
    body.style.paddingTop = isOpening ? '1rem' : '0';
    body.style.paddingBottom = isOpening ? '1.5rem' : '0';
    body.style.maxHeight = isOpening ? body.scrollHeight + 'px' : null;
    if (isOpening) {
        setTimeout(() => {
            header.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
            });
        }, 150); 
    }
}

function handleMCQOptionClick(optionEl, item) {
    const parentCard = optionEl.closest('.card');
    if (parentCard.dataset.answered) return;
    parentCard.dataset.answered = 'true';
    parentCard.querySelectorAll('.mcq-option').forEach(el => el.style.pointerEvents = 'none');
    const correctOptionIndex = item.a;
    const selectedOptionIndex = Array.from(parentCard.querySelectorAll('.mcq-option')).indexOf(optionEl);
    const correctOptionEl = parentCard.querySelectorAll('.mcq-option')[correctOptionIndex];
    correctOptionEl.classList.add('correct');
    correctOptionEl.querySelector('.option-icon').textContent = '✔';
    if (selectedOptionIndex !== correctOptionIndex) {
        optionEl.classList.add('incorrect');
        optionEl.querySelector('.option-icon').textContent = '✖';
    }
    updateMCQScore();
}
/**
 * MCQ পরীক্ষার উত্তর রিসেট করে।
 */
function resetMCQAnswers() {
    // সব উত্তর দেওয়া MCQ কার্ডগুলো খুঁজে বের করুন
    document.querySelectorAll('.card[data-answered="true"]').forEach(card => {
        // কার্ড থেকে 'answered' স্ট্যাটাস মুছে দিন
        card.removeAttribute('data-answered');
        
        // সব অপশন থেকে ক্লাস এবং আইকন মুছে দিন এবং ক্লিক করার সুবিধা চালু করুন
        card.querySelectorAll('.mcq-option').forEach(el => {
            el.style.pointerEvents = 'auto';
            el.classList.remove('correct', 'incorrect');
            el.querySelector('.option-icon').textContent = '';
        });
    });
    
    // স্কোর রিসেট করে UI আপডেট করুন
    updateMCQScore();
}
// --------------------------------------------------------------------------
// 5. নতুন: URL Routing Functions
// --------------------------------------------------------------------------

function updateHashFromState() {
    const { subject, year, type } = currentState;
    if (!subject) {
        history.pushState("", document.title, window.location.pathname + window.location.search);
        return;
    }
    const hashParts = new URLSearchParams();
    hashParts.append('subject', subject);
    if (year) hashParts.append('year', year);
    if (type) hashParts.append('type', type);
    
    // হ্যাশ সেট করার সময় hashchange ইভেন্ট বন্ধ রাখা, যেন লুপ তৈরি না হয়
    window.removeEventListener('hashchange', handleHashChange);
    window.location.hash = hashParts.toString();
    window.addEventListener('hashchange', handleHashChange);
}

function handleHashChange() {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const subject = params.get('subject');
    const year = params.get('year');
    const type = params.get('type');

    if (subject && allData[subject]) {
        const subjectData = allData[subject];
        
        // --- মূল সমাধান এখানেই ---
        // এটি ক্লাস নোট ক্যাটাগরি কিনা তা পরীক্ষা করবে
        if (subjectData.isNoteCategory) {
            selectSubject(subject); // শুধু selectSubject কে কল করবে, যা ক্লাস নোট হ্যান্ডেল করতে পারে
            const noteSubject = params.get('noteSubject');
            if (noteSubject) {
                selectNoteSubject(noteSubject);
            }
            return; // এখানেই ফাংশনের কাজ শেষ, যেন নিচের কোড না চলে
        }
        // --- সমাধান শেষ ---

        currentState.subject = subject;
        currentState.year = year || subjectData.years[0]; // এই লাইনে error হচ্ছিল
        const availableTypes = subjectData.questions[currentState.year] || {};
        const defaultType = (availableTypes.written && availableTypes.written.length > 0) ? 'written' : 'mcq';
        currentState.type = type || defaultType;

        document.getElementById('intro-section').classList.add('hidden');
        document.getElementById('filter-section').classList.remove('hidden');
        document.querySelectorAll('#subject-nav button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.subject === subject);
        });
        if (subjectData.analysis && subjectData.analysis.data.length > 0) {
            document.getElementById('chart-section').classList.remove('hidden');
            renderChart();
        } else {
            document.getElementById('chart-section').classList.add('hidden');
        }
        renderFilters();
        renderQuestions();
    } else {
        showHomePage();
    }
}
// --------------------------------------------------------------------------
// 6. Utility Functions (কোনো পরিবর্তন নেই)
// --------------------------------------------------------------------------

function applyTheme(isToggle = false) {
    const isDark = localStorage.getItem('theme') === 'dark';
    document.body.classList.toggle('dark', isDark);
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) themeToggle.checked = isDark;
    const isChartVisible = currentState.subject && !allData[currentState.subject]?.isNoteCategory && allData[currentState.subject]?.analysis;
    if (isToggle && topicChart && isChartVisible) renderChart();
}

function formatQuestionText(text) {
    // এই রেগুলার এক্সপ্রেশনটি সব ধরনের প্রশ্নের নম্বর ও শিরোনাম খুঁজে বের করার জন্য তৈরি করা হয়েছে
    const regex = /(^(\d+|[০-৯]+)[\.。]\s*(?:\([a-zA-Zক-ৎivx]+\))?|^(\([a-zA-Zক-ৎivx]+\))|^টীকা:|^(?:Or|অথবা),?:?|^Short Note:\s*\([ivx]+\)|Explain:|Marks: \d+)/g;
    return text.replace(regex, '<strong>$&</strong>');
}

function sanitizeContent(element) {
    element.querySelectorAll('[style]').forEach(el => el.removeAttribute('style'));
    element.querySelectorAll('table').forEach(table => {
        if (!table.parentNode.classList.contains('table-wrapper')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'table-wrapper';
            table.parentNode.insertBefore(wrapper, table);
            wrapper.appendChild(table);
        }
    });
}

function updateMCQResultVisibility(type, questionCount) {
    const mcqResultSection = document.getElementById('mcq-result-section');
    const mcqResetButtonContainer = document.getElementById('mcq-reset-button-container');

    if (type === 'mcq' && questionCount > 0) {
        mcqResultSection.classList.remove('hidden');
        mcqResetButtonContainer.classList.remove('hidden'); 
        document.getElementById('mcq-score').textContent = '0';
        document.getElementById('mcq-total').textContent = questionCount;
    } else {
        mcqResultSection.classList.add('hidden');
        mcqResetButtonContainer.classList.add('hidden'); 
    }
}

function updateMCQScore() {
    const answeredCount = document.querySelectorAll('.card[data-answered="true"]').length;
    const incorrectCount = document.querySelectorAll('.mcq-option.incorrect').length;
    const userScore = answeredCount - incorrectCount;
    document.getElementById('mcq-score').textContent = userScore;
}
// ==========================================================================
// 7. অ্যানিমেশন লজিক
// ==========================================================================

// এই IntersectionObserver টি পুরো অ্যাপে একবারই তৈরি হবে এবং বারবার ব্যবহৃত হবে।
const animationObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target); // অ্যানিমেশন দেখানোর পর আর পর্যবেক্ষণ করা হবে না
        }
    });
}, { threshold: 0.1 });

/**
 * নির্দিষ্ট এলিমেন্টগুলোতে স্ক্রল-ট্রিগারড অ্যানিমেশন যুক্ত করে।
 * @param {string | HTMLElement[]} targets - একটি CSS সিলেক্টর অথবা এলিমেন্টের তালিকা।
 */
function applyScrollAnimation(targets) {
    const elements = typeof targets === 'string' ? document.querySelectorAll(targets) : targets;
    elements.forEach(el => {
        el.classList.add('reveal-on-scroll');
        animationObserver.observe(el);
    });
}

// পেজ লোড হওয়ার সময় শুধুমাত্র স্থায়ী এলিমেন্টগুলোর জন্য অ্যানিমেশন চালু করা হবে
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        // পরিচিতি সেকশনটি ডিফল্টভাবে অ্যানিমেট হবে
        applyScrollAnimation('#intro-section');
    }, 100);
});
// এটি নিশ্চিত করবে যে শুধুমাত্র নতুন প্রশ্নগুলোতেই অ্যানিমেশন কাজ করবে।
function setupNewQuestionAnimations() {
    applyScrollAnimation('#question-display .card');
}

// নতুন ফাংশন: ক্লাস নোটের ভেতরের বিষয় (যেমন: ইংরেজি) নির্বাচন করার জন্য
function selectNoteSubject(noteSubjectKey) {
    currentState.noteSubject = noteSubjectKey;

    // বাটনের active স্টাইল ঠিক করার জন্য
    const notesFilterDiv = document.getElementById('classnotes-filters');
    notesFilterDiv.querySelectorAll('button').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.key === noteSubjectKey);
    });

    renderNotes(); // নোট দেখানোর জন্য এই ফাংশনকে কল করা হলোk
}

function renderNotes() {
    const questionDisplay = document.getElementById('question-display');
    questionDisplay.innerHTML = '';
    const { subject, noteSubject } = currentState;

    if (!subject || !noteSubject) return;

    const notes = allData[subject].subjects[noteSubject] || [];

    if (notes.length === 0) {
        questionDisplay.innerHTML = `<div class="text-center text-zinc-500 p-8 card rounded-lg fade-in">অনুগ্রহ করে ক্লাস করুন।</div>`;
        return;
    }

    notes.forEach((note, index) => {
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'answer-content prose max-w-none dark:prose-invert';
        contentWrapper.innerHTML = note.content;
        
        // --- নতুন পরিবর্তন এখানেই ---
        // শিরোনাম এবং তারিখ একসাথে দেখানোর জন্য HTML তৈরি করা হলো
        const titleWithDateHTML = `
            <div class="flex justify-between items-center w-full">
                <span>${note.title}</span>
                <small class="text-xs text-zinc-500 dark:text-zinc-400 font-normal pr-2">${note.date || ''}</small>
            </div>
        `;

        // Accordion কম্পোনেন্ট তৈরি করার সময় নতুন HTML টি ব্যবহার করা হলো
        const noteElement = createAccordionComponent(titleWithDateHTML, contentWrapper, index);
        if (noteElement) {
            questionDisplay.appendChild(noteElement);
        }
    });

    setTimeout(setupNewQuestionAnimations, 50); // অ্যানিমেশন যোগ করা হলো
}