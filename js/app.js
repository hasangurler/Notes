"use strict";


/* =========================================================
   SABİTLER
========================================================= */

const STORAGE_KEY = "notes_app_data";

const THEME_KEY = "notes_app_theme";

const MAX_TITLE_LENGTH = 200;

const MAX_BODY_LENGTH = 5000;


/* =========================================================
   UYGULAMA DURUMU
========================================================= */

let notes = [];

let currentNoteId = null;

let currentNoteColor = "default";

let pendingAction = null;

let pendingRestoreNotes = null;

/* =========================================================
   BOOTSTRAP
========================================================= */

let noteModal;

let confirmModal;


/* =========================================================
   DOM
========================================================= */

const notesContainer =
    document.getElementById("notesContainer");

const emptyState =
    document.getElementById("emptyState");

const emptyStateIcon =
    document.getElementById("emptyStateIcon");

const emptyStateTitle =
    document.getElementById("emptyStateTitle");

const emptyStateMessage =
    document.getElementById("emptyStateMessage");


const notesCounter =
    document.getElementById("notesCounter");


const searchInput =
    document.getElementById("searchInput");

const btnClearSearch =
    document.getElementById("btnClearSearch");

const sortSelect =
    document.getElementById("sortSelect");


const btnTheme =
    document.getElementById("btnTheme");

const themeIcon =
    document.getElementById("themeIcon");

const btnBackupNotes =
    document.getElementById("btnBackupNotes");

const btnRestoreNotes =
    document.getElementById("btnRestoreNotes");

const restoreFileInput =
    document.getElementById("restoreFileInput");

const btnNewNote =
    document.getElementById("btnNewNote");

const btnEmptyNewNote =
    document.getElementById("btnEmptyNewNote");


const noteForm =
    document.getElementById("noteForm");

const noteIdInput =
    document.getElementById("noteId");

const noteTitleInput =
    document.getElementById("noteTitle");

const noteBodyInput =
    document.getElementById("noteBody");

const titleCounter =
    document.getElementById("titleCounter");

const bodyCounter =
    document.getElementById("bodyCounter");

const noteDate =
    document.getElementById("noteDate");

const noteModalTitle =
    document.getElementById("noteModalTitle");


const btnSave =
    document.getElementById("btnSave");

const btnUpdate =
    document.getElementById("btnUpdate");

const btnDelete =
    document.getElementById("btnDelete");

const btnCancel =
    document.getElementById("btnCancel");


const confirmModalTitle =
    document.getElementById("confirmModalTitle");

const confirmModalMessage =
    document.getElementById("confirmModalMessage");

const confirmationIcon =
    document.getElementById("confirmationIcon");

const btnConfirmAction =
    document.getElementById("btnConfirmAction");


const toastContainer =
    document.getElementById("toastContainer");


/* =========================================================
   BAŞLAT
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initialize
);


function initialize() {

    noteModal =
        new bootstrap.Modal(
            document.getElementById("noteModal")
        );


    confirmModal =
        new bootstrap.Modal(
            document.getElementById("confirmModal")
        );


    loadNotes();

    loadTheme();

    bindEvents();

    updateCounters();

    updateCharacterCounters();

    renderNotes();
}


/* =========================================================
   EVENTLER
========================================================= */

function bindEvents() {


    /* Yeni not */

    btnNewNote.addEventListener(
        "click",
        openNewNote
    );


    btnEmptyNewNote.addEventListener(
        "click",
        openNewNote
    );


    /* Arama */

    searchInput.addEventListener(
        "input",
        handleSearch
    );


    btnClearSearch.addEventListener(
        "click",
        clearSearch
    );


    /* Sıralama */

    sortSelect.addEventListener(
        "change",
        renderNotes
    );


    /* Tema */

    btnTheme.addEventListener(
        "click",
        toggleTheme
    );


    /* Yedekleme */

    btnBackupNotes.addEventListener(
        "click",
        backupNotes
    );

    /* Dosyadan geri yükleme */

    btnRestoreNotes.addEventListener(
        "click",
        openRestoreFilePicker
    );

    restoreFileInput.addEventListener(
        "change",
        handleRestoreFile
    );

    /* Form */

    noteTitleInput.addEventListener(
        "input",
        updateCharacterCounters
    );


    noteBodyInput.addEventListener(
        "input",
        updateCharacterCounters
    );


    /* Renk */

    document
        .querySelectorAll(".color-option")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    selectNoteColor(
                        button.dataset.color
                    );

                }
            );

        });


    /* İşlemler */

    btnSave.addEventListener(
        "click",
        requestSave
    );


    btnUpdate.addEventListener(
        "click",
        requestUpdate
    );


    btnDelete.addEventListener(
        "click",
        requestDelete
    );


    btnCancel.addEventListener(
        "click",
        cancelNote
    );


    btnConfirmAction.addEventListener(
        "click",
        executePendingAction
    );


    /* Klavye */

    document.addEventListener(
        "keydown",
        handleKeyboard
    );


    /* Modal kapandığında */

    document
        .getElementById("noteModal")
        .addEventListener(
            "hidden.bs.modal",
            resetNoteModal
        );

}


/* =========================================================
   LOCAL STORAGE
========================================================= */

function loadNotes() {

    try {

        const stored =
            localStorage.getItem(STORAGE_KEY);


        if (!stored) {

            notes = [];

            return;
        }


        const parsed =
            JSON.parse(stored);


        if (!Array.isArray(parsed)) {

            notes = [];

            return;
        }


        /*
         * Eski sürümden gelen notları da
         * güvenli şekilde normalize ediyoruz.
         */

        notes = parsed.map(note => ({

            id:
                note.id ||
                generateId(),

            title:
                String(note.title || ""),

            body:
                String(note.body || ""),

            createdAt:
                note.createdAt ||
                new Date().toISOString(),

            updatedAt:
                note.updatedAt ||
                note.createdAt ||
                new Date().toISOString(),

            color:
                note.color ||
                "default"

        }));


    } catch (error) {

        console.error(
            "Notlar yüklenemedi:",
            error
        );

        notes = [];
    }
}


function saveNotesToStorage() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(notes)
    );
}


/* =========================================================
   NOTLARI FİLTRELE
========================================================= */

function getFilteredNotes() {

    const search =
        searchInput.value
            .trim()
            .toLocaleLowerCase("tr-TR");


    let result = [...notes];


    if (search) {

        result =
            result.filter(note => {

                const title =
                    note.title
                        .toLocaleLowerCase("tr-TR");

                const body =
                    note.body
                        .toLocaleLowerCase("tr-TR");


                return (
                    title.includes(search) ||
                    body.includes(search)
                );

            });

    }


    return result;
}


/* =========================================================
   SIRALAMA
========================================================= */

function sortNotes(noteList) {

    const sortType =
        sortSelect.value;


    /*
     * Manuel sıralamada notes dizisinin
     * mevcut sırasını koruyoruz.
     */
    if (sortType === "manual") {

        return noteList;
    }


    return noteList.sort(
        (a, b) => {

            switch (sortType) {

                case "created-desc":

                    return compareDates(
                        b.createdAt,
                        a.createdAt
                    );


                case "title-asc":

                    return a.title.localeCompare(
                        b.title,
                        "tr"
                    );


                case "title-desc":

                    return b.title.localeCompare(
                        a.title,
                        "tr"
                    );


                case "updated-desc":

                default:

                    return compareDates(
                        b.updatedAt,
                        a.updatedAt
                    );

            }

        }
    );
}


function compareDates(dateA, dateB) {

    return (
        new Date(dateA).getTime() -
        new Date(dateB).getTime()
    );
}


/* =========================================================
   NOTLARI RENDER ET
========================================================= */

function renderNotes() {

    notesContainer.innerHTML = "";


    const filteredNotes =
        sortNotes(
            getFilteredNotes()
        );


    updateCounters(
        filteredNotes.length
    );


    if (filteredNotes.length === 0) {

        showEmptyState();

        return;
    }


    hideEmptyState();


    const isManualSort =
        sortSelect.value === "manual";


    filteredNotes.forEach(
        note => {

            const column =
                document.createElement("div");


            column.className =
                "col-12 col-md-6 col-lg-4";


            column.innerHTML =
                createNoteCard(note);


            const card =
                column.querySelector(".note-card");


            card.addEventListener(
                "click",
                event => {

                    /*
                     * Drag handle üzerinden yapılan
                     * tıklamayı normal kart tıklaması
                     * olarak değerlendirmiyoruz.
                     */

                    if (
                        event.target.closest(
                            ".note-card-drag-handle"
                        )
                    ) {

                        return;
                    }


                    /*
                     * Gerçek bir sürükleme sonrasında
                     * click event'i oluşmasını engelliyoruz.
                     */

                    if (card.dataset.dragged === "true") {

                        delete card.dataset.dragged;

                        return;
                    }


                    openNote(note.id);

                }
            );


            card.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key === "Enter" ||
                        event.key === " "
                    ) {

                        event.preventDefault();

                        openNote(note.id);
                    }

                }
            );


            notesContainer.appendChild(
                column
            );


            /*
             * Sadece manuel sıralamada
             * drag & drop aktif.
             */

            if (isManualSort) {

                initializeDragHandle(
                    card,
                    note.id
                );
            }

        }
    );
}

/* =========================================================
   YEDEK VERİSİNİ DOĞRULA
========================================================= */

function validateBackupData(data) {

    if (!Array.isArray(data)) {
        return null;
    }


    const validNotes =
        data.filter(note => {

            if (
                !note ||
                typeof note !== "object"
            ) {

                return false;
            }


            if (
                typeof note.id !== "string" ||
                !note.id
            ) {

                return false;
            }


            if (
                typeof note.title !== "string"
            ) {

                return false;
            }


            if (
                typeof note.body !== "string"
            ) {

                return false;
            }


            return true;

        });


    if (
        validNotes.length !==
        data.length
    ) {

        return null;
    }


    /*
     * Yedekteki notları normalize et.
     */

    return validNotes.map(note => ({

        id:
            note.id,

        title:
            note.title,

        body:
            note.body,

        createdAt:
            note.createdAt ||
            new Date().toISOString(),

        updatedAt:
            note.updatedAt ||
            note.createdAt ||
            new Date().toISOString(),

        color:
            note.color ||
            "default"

    }));
}

/* =========================================================
   GERİ YÜKLEME ONAYI
========================================================= */

function showRestoreConfirmation(
    noteCount,
    fileName
) {

    pendingAction =
        "restore";


    confirmModalTitle.textContent =
        "Notları Geri Yükle";


    confirmModalMessage.innerHTML = `

        <div>
            <strong>${noteCount} not</strong>
            geri yüklenecek.
        </div>

        <div class="confirmation-note-title">
            "${escapeHtml(fileName)}"
        </div>

        <div style="margin-top: 12px;">
            Mevcut notlarınızın yerine
            yedekteki notlar yüklenecek.
            Devam etmek istiyor musunuz?
        </div>

    `;


    confirmationIcon.className =
        "bi bi-upload";


    btnConfirmAction.className =
        "btn btn-primary";


    confirmModal.show();
}

/* =========================================================
   KART HTML
========================================================= */

function createNoteCard(note) {

    const color =
        note.color || "default";


    const isManualSort =
        sortSelect.value === "manual";


    const dragHandle =
        isManualSort
            ? `
                <button
                    type="button"
                    class="note-card-drag-handle"
                    aria-label="Notu sürükleyerek sırasını değiştir"
                    title="Sürükleyerek sırala"
                >
                    <i class="bi bi-grip-vertical"></i>
                </button>
            `
            : "";


    return `

        <div
            class="note-card color-${escapeHtml(color)}"
            data-note-id="${escapeHtml(note.id)}"
            role="button"
            tabindex="0"
        >

            <div class="note-card-header">

                ${dragHandle}

                <h2 class="note-card-title">
                    ${escapeHtml(note.title)}
                </h2>

            </div>


            <div class="note-card-body">

                <p class="note-card-text">
                    ${escapeHtml(note.body)}
                </p>

            </div>


            <div class="note-card-footer">

                <span class="note-card-date">
                    ${formatDate(note.updatedAt)}
                </span>

                <span class="note-card-open">
                    Aç
                    <i class="bi bi-chevron-right"></i>
                </span>

            </div>

        </div>
    `;
}


/* =========================================================
   EMPTY STATE
========================================================= */

function showEmptyState() {

    emptyState.classList.remove(
        "d-none"
    );


    const hasSearch =
        searchInput.value.trim() !== "";


    if (hasSearch) {

        emptyStateIcon.className =
            "bi bi-search";


        emptyStateTitle.textContent =
            "Not bulunamadı";


        emptyStateMessage.textContent =
            "Aramanızla eşleşen herhangi bir not bulunamadı.";


        btnEmptyNewNote.classList.add(
            "d-none"
        );

    } else {

        emptyStateIcon.className =
            "bi bi-journal-x";


        emptyStateTitle.textContent =
            "Henüz not yok";


        emptyStateMessage.textContent =
            "İlk notunuzu oluşturmak için Yeni Not butonuna tıklayın.";


        btnEmptyNewNote.classList.remove(
            "d-none"
        );

    }
}


function hideEmptyState() {

    emptyState.classList.add(
        "d-none"
    );
}


/* =========================================================
   NOT SAYACI
========================================================= */

function updateCounters(
    visibleCount = notes.length
) {

    const total =
        notes.length;


    if (searchInput.value.trim()) {

        notesCounter.textContent =
            `${visibleCount} / ${total} Not`;

    } else {

        notesCounter.textContent =
            `${total} Not`;

    }
}


/* =========================================================
   ARAMA
========================================================= */

function handleSearch() {

    const hasSearch =
        searchInput.value.trim() !== "";


    btnClearSearch.classList.toggle(
        "d-none",
        !hasSearch
    );


    renderNotes();
}


function clearSearch() {

    searchInput.value = "";

    btnClearSearch.classList.add(
        "d-none"
    );

    renderNotes();

    searchInput.focus();
}


/* =========================================================
   YENİ NOT
========================================================= */

function openNewNote() {

    currentNoteId = null;

    currentNoteColor = "default";


    noteIdInput.value = "";

    noteTitleInput.value = "";

    noteBodyInput.value = "";

    noteDate.textContent = "";


    noteModalTitle.textContent =
        "Yeni Not";


    resetValidation();

    updateCharacterCounters();

    selectNoteColor("default");


    btnSave.disabled = false;

    btnUpdate.disabled = true;

    btnDelete.disabled = true;


    noteModal.show();


    setTimeout(
        () => noteTitleInput.focus(),
        300
    );
}


/* =========================================================
   NOT AÇ
========================================================= */

function openNote(id) {

    const note =
        notes.find(
            item => item.id === id
        );


    if (!note) {
        return;
    }


    currentNoteId = id;

    currentNoteColor =
        note.color || "default";


    noteIdInput.value =
        note.id;


    noteTitleInput.value =
        note.title;


    noteBodyInput.value =
        note.body;


    noteDate.textContent =
        "Son güncelleme: " +
        formatDate(note.updatedAt);


    noteModalTitle.textContent =
        "Notu Düzenle";


    resetValidation();

    updateCharacterCounters();

    selectNoteColor(
        currentNoteColor
    );


    btnSave.disabled = true;

    btnUpdate.disabled = false;

    btnDelete.disabled = false;


    noteModal.show();
}


/* =========================================================
   RENK SEÇ
========================================================= */

function selectNoteColor(color) {

    currentNoteColor =
        color || "default";


    document
        .querySelectorAll(".color-option")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.color ===
                    currentNoteColor
            );

        });
}


/* =========================================================
   KARAKTER SAYACI
========================================================= */

function updateCharacterCounters() {

    updateCharacterCounter(
        noteTitleInput,
        titleCounter,
        MAX_TITLE_LENGTH
    );


    updateCharacterCounter(
        noteBodyInput,
        bodyCounter,
        MAX_BODY_LENGTH
    );
}


function updateCharacterCounter(
    input,
    counter,
    maximum
) {

    const length =
        input.value.length;


    counter.textContent =
        `${length} / ${maximum}`;


    counter.classList.remove(
        "limit-near",
        "limit-reached"
    );


    const percentage =
        length / maximum;


    if (length >= maximum) {

        counter.classList.add(
            "limit-reached"
        );

    } else if (percentage >= 0.9) {

        counter.classList.add(
            "limit-near"
        );

    }
}


/* =========================================================
   FORM DOĞRULAMA
========================================================= */

function validateForm() {

    const title =
        noteTitleInput.value.trim();

    const body =
        noteBodyInput.value.trim();


    let valid = true;


    resetValidation();


    if (!title) {

        noteTitleInput.classList.add(
            "is-invalid"
        );

        valid = false;
    }


    if (!body) {

        noteBodyInput.classList.add(
            "is-invalid"
        );

        valid = false;
    }


    return valid;
}


function resetValidation() {

    noteTitleInput.classList.remove(
        "is-invalid"
    );

    noteBodyInput.classList.remove(
        "is-invalid"
    );
}


/* =========================================================
   KAYDET ONAYI
========================================================= */

function requestSave() {

    if (!validateForm()) {
        return;
    }


    pendingAction = "save";


    showConfirmation(
        "Notu Kaydet",
        "Bu not kaydedilecek. Devam etmek istiyor musunuz?",
        false
    );
}


/* =========================================================
   GÜNCELLE ONAYI
========================================================= */

function requestUpdate() {

    if (!validateForm()) {
        return;
    }


    pendingAction = "update";


    showConfirmation(
        "Notu Güncelle",
        "Bu not güncellenecek. Devam etmek istiyor musunuz?",
        false
    );
}


/* =========================================================
   SİL ONAYI
========================================================= */

function requestDelete() {

    if (!currentNoteId) {
        return;
    }


    const note =
        notes.find(
            item => item.id === currentNoteId
        );


    if (!note) {
        return;
    }


    pendingAction = "delete";


    showConfirmation(
        "Notu Sil",
        "Bu not kalıcı olarak silinecek.",
        true,
        note.title
    );
}


/* =========================================================
   ONAY MODALI
========================================================= */

function showConfirmation(
    title,
    message,
    isDanger = false,
    noteTitle = ""
) {

    confirmModalTitle.textContent =
        title;


    confirmModalMessage.innerHTML =
        escapeHtml(message);


    if (noteTitle) {

        confirmModalMessage.innerHTML += `

            <div class="confirmation-note-title">
                "${escapeHtml(noteTitle)}"
            </div>
        `;
    }


    if (isDanger) {

        confirmationIcon.className =
            "bi bi-exclamation-triangle";


        btnConfirmAction.className =
            "btn btn-danger";

    } else {

        confirmationIcon.className =
            "bi bi-question-circle";


        btnConfirmAction.className =
            "btn btn-primary";
    }


    confirmModal.show();
}


/* =========================================================
   ONAYLANAN İŞLEM
========================================================= */

function executePendingAction() {

    if (!pendingAction) {
        return;
    }


    switch (pendingAction) {

        case "save":

            executeSave();

            break;


        case "update":

            executeUpdate();

            break;


        case "delete":

            executeDelete();

            break;

        case "restore":

            executeRestore();

            break;
    }


    pendingAction = null;

    confirmModal.hide();
}


/* =========================================================
   KAYDET
========================================================= */

function executeSave() {

    const now =
        new Date().toISOString();


    const newNote = {

        id:
            generateId(),

        title:
            noteTitleInput.value.trim(),

        body:
            noteBodyInput.value.trim(),

        color:
            currentNoteColor,

        createdAt:
            now,

        updatedAt:
            now
    };


    notes.unshift(
        newNote
    );


    saveNotesToStorage();

    renderNotes();


    noteModal.hide();


    showToast(
        "Not başarıyla kaydedildi.",
        "success"
    );
}


/* =========================================================
   GÜNCELLE
========================================================= */

function executeUpdate() {

    const index =
        notes.findIndex(
            note => note.id === currentNoteId
        );


    if (index === -1) {
        return;
    }


    notes[index].title =
        noteTitleInput.value.trim();


    notes[index].body =
        noteBodyInput.value.trim();


    notes[index].color =
        currentNoteColor;


    notes[index].updatedAt =
        new Date().toISOString();


    saveNotesToStorage();

    renderNotes();


    noteModal.hide();


    showToast(
        "Not başarıyla güncellendi.",
        "success"
    );
}


/* =========================================================
   SİL
========================================================= */

function executeDelete() {

    const index =
        notes.findIndex(
            note => note.id === currentNoteId
        );


    if (index === -1) {
        return;
    }


    notes.splice(
        index,
        1
    );


    saveNotesToStorage();

    renderNotes();


    noteModal.hide();


    showToast(
        "Not silindi.",
        "danger"
    );
}


/* =========================================================
   İPTAL
========================================================= */

function cancelNote() {

    noteModal.hide();
}

/* =========================================================
   GERİ YÜKLE
========================================================= */

function executeRestore() {

    if (
        !Array.isArray(
            pendingRestoreNotes
        )
    ) {

        return;
    }


    notes =
        pendingRestoreNotes;


    saveNotesToStorage();


    /*
     * Manuel sıralamayı göstermek için
     * sıralama seçimini manuel yap.
     */

    sortSelect.value =
        "manual";


    renderNotes();


    pendingRestoreNotes =
        null;


    showToast(
        `${notes.length} not başarıyla geri yüklendi.`,
        "success"
    );
}

/* =========================================================
   MODAL RESET
========================================================= */

function resetNoteModal() {

    currentNoteId = null;

    currentNoteColor = "default";

    pendingAction = null;

    noteForm.reset();

    resetValidation();

    updateCharacterCounters();

    selectNoteColor("default");
}


/* =========================================================
   KLAVYE KISAYOLLARI
========================================================= */

function handleKeyboard(event) {

    /*
     * Ctrl + Enter
     */

    if (
        event.ctrlKey &&
        event.key === "Enter"
    ) {

        const modalOpen =
            document
                .getElementById("noteModal")
                .classList
                .contains("show");


        if (!modalOpen) {
            return;
        }


        event.preventDefault();


        if (!btnSave.disabled) {

            requestSave();

        } else if (!btnUpdate.disabled) {

            requestUpdate();
        }

    }


    /*
     * Escape
     *
     * Bootstrap zaten modalı kapatıyor.
     * Burada ayrıca bir işlem yapmıyoruz.
     */

}


/* =========================================================
   TEMA
========================================================= */

function loadTheme() {

    const savedTheme =
        localStorage.getItem(
            THEME_KEY
        );


    if (savedTheme === "dark") {

        applyTheme("dark");

    } else {

        applyTheme("light");
    }
}


function toggleTheme() {

    const currentTheme =
        document.documentElement
            .getAttribute("data-theme");


    const newTheme =
        currentTheme === "dark"
            ? "light"
            : "dark";


    applyTheme(
        newTheme
    );


    localStorage.setItem(
        THEME_KEY,
        newTheme
    );
}


function applyTheme(theme) {

    if (theme === "dark") {

        document.documentElement
            .setAttribute(
                "data-theme",
                "dark"
            );


        themeIcon.className =
            "bi bi-sun-fill";


        btnTheme.title =
            "Açık temaya geç";

    } else {

        document.documentElement
            .setAttribute(
                "data-theme",
                "light"
            );


        themeIcon.className =
            "bi bi-moon-fill";


        btnTheme.title =
            "Koyu temaya geç";
    }
}


/* =========================================================
   ID
========================================================= */

function generateId() {

    if (
        typeof crypto !== "undefined" &&
        crypto.randomUUID
    ) {

        return crypto.randomUUID();
    }


    return (
        Date.now().toString(36) +
        Math.random()
            .toString(36)
            .substring(2)
    );
}


/* =========================================================
   TARİH
========================================================= */

function formatDate(
    dateString
) {

    if (!dateString) {
        return "";
    }


    const date =
        new Date(dateString);


    return date.toLocaleString(
        "tr-TR",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


/* =========================================================
   HTML ESCAPE
========================================================= */

function escapeHtml(value) {

    return String(value)
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}


/* =========================================================
   TOAST
========================================================= */

function showToast(
    message,
    type = "success"
) {

    const toastId =
        "toast-" +
        Date.now();


    const icon =
        type === "success"
            ? "bi-check-circle-fill"
            : "bi-exclamation-triangle-fill";


    const toastHtml = `

        <div
            id="${toastId}"
            class="toast"
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
        >

            <div class="toast-header">

                <i
                    class="bi ${icon} me-2 text-${type}"
                ></i>

                <strong class="me-auto">
                    Notlarım
                </strong>

                <button
                    type="button"
                    class="btn-close"
                    data-bs-dismiss="toast"
                    aria-label="Kapat"
                ></button>

            </div>


            <div class="toast-body">
                ${escapeHtml(message)}
            </div>

        </div>
    `;


    toastContainer.insertAdjacentHTML(
        "beforeend",
        toastHtml
    );


    const toastElement =
        document.getElementById(
            toastId
        );


    const toast =
        new bootstrap.Toast(
            toastElement,
            {
                delay: 2500
            }
        );


    toast.show();


    toastElement.addEventListener(
        "hidden.bs.toast",
        () => toastElement.remove()
    );
}

/* =========================================================
   NOTLARI YEDEKLE
========================================================= */

async function backupNotes() {

    if (notes.length === 0) {

        showToast(
            "Yedeklenecek not bulunmuyor.",
            "danger"
        );

        return;
    }


    /*
     * Mevcut notes dizisini JSON olarak
     * yedekliyoruz.
     *
     * Böylece manuel sıralama da korunur.
     */

    const backupData =
        JSON.stringify(
            notes,
            null,
            2
        );


    const now =
        new Date();


    const date =
        now.toISOString()
            .slice(0, 10);


    const time =
        now.toTimeString()
            .slice(0, 8)
            .replaceAll(":", "-");


    const fileName =
        `notlarim-yedek-${date}-${time}.json`;


    /*
     * JSON dosyasını oluştur.
     */

    const file =
        new File(
            [backupData],
            fileName,
            {
                type:
                    "application/json"
            }
        );


    /*
     * =====================================================
     * MOBİL / PWA
     * =====================================================
     *
     * Android'in paylaşım ekranını kullan.
     */

    if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({
            files: [file]
        })
    ) {

        try {

            await navigator.share({

                title:
                    "Notlarım Yedeği",

                text:
                    "Notlarım uygulamasının yedeği.",

                files: [file]

            });


            showToast(
                `${notes.length} not başarıyla yedeklendi.`,
                "success"
            );


            return;

        } catch (error) {

            /*
             * Kullanıcı paylaşım ekranını
             * iptal ettiyse bunu hata olarak
             * göstermiyoruz.
             */

            if (
                error.name ===
                "AbortError"
            ) {

                return;
            }


            console.error(
                "Dosya paylaşımı başarısız:",
                error
            );

        }

    }


    /*
     * =====================================================
     * MASAÜSTÜ / FALLBACK
     * =====================================================
     *
     * Web Share API kullanılamıyorsa
     * mevcut klasik indirme yöntemini kullan.
     */

    const blob =
        new Blob(
            [backupData],
            {
                type:
                    "application/json;charset=utf-8"
            }
        );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");


    link.href =
        url;


    link.download =
        fileName;


    link.style.display =
        "none";


    document.body.appendChild(
        link
    );


    link.click();


    /*
     * Android / bazı tarayıcıların
     * dosyayı başlatabilmesi için URL'yi
     * hemen iptal etmiyoruz.
     */

    setTimeout(
        () => {

            URL.revokeObjectURL(
                url
            );

            link.remove();

        },
        1000
    );


    showToast(
        `${notes.length} not başarıyla yedeklendi.`,
        "success"
    );
}

/* =========================================================
   YEDEKTEN GERİ YÜKLE
========================================================= */

function openRestoreFilePicker() {

    restoreFileInput.value = "";

    restoreFileInput.click();
}


/* =========================================================
   YEDEK DOSYASINI OKU
========================================================= */

function handleRestoreFile(event) {

    const file =
        event.target.files[0];


    if (!file) {
        return;
    }


    /*
     * Yalnızca JSON dosyalarını kabul et.
     */

    const isJson =
        file.type === "application/json" ||
        file.name.toLowerCase().endsWith(".json");


    if (!isJson) {

        showToast(
            "Geçersiz dosya. Lütfen JSON yedek dosyası seçin.",
            "danger"
        );

        return;
    }


    const reader =
        new FileReader();


    reader.onload = function () {

        try {

            const importedData =
                JSON.parse(
                    reader.result
                );


            const importedNotes =
                validateBackupData(
                    importedData
                );


            if (!importedNotes) {

                showToast(
                    "Geçersiz not yedek dosyası.",
                    "danger"
                );

                return;
            }


            if (
                importedNotes.length === 0
            ) {

                showToast(
                    "Yedek dosyasında hiç not bulunmuyor.",
                    "danger"
                );

                return;
            }


            /*
             * Geri yükleme için geçici olarak
             * veriyi saklıyoruz.
             */

            pendingRestoreNotes =
                importedNotes;


            showRestoreConfirmation(
                importedNotes.length,
                file.name
            );

        } catch (error) {

            console.error(
                "Yedek dosyası okunamadı:",
                error
            );


            showToast(
                "Yedek dosyası okunamadı.",
                "danger"
            );

        }

    };


    reader.onerror = function () {

        showToast(
            "Dosya okunurken bir hata oluştu.",
            "danger"
        );

    };


    reader.readAsText(
        file,
        "UTF-8"
    );
}

/* =========================================================
   DRAG & DROP
========================================================= */

let dragState = null;


/* =========================================================
   DRAG HANDLE BAŞLAT
========================================================= */

function initializeDragHandle(
    card,
    noteId
) {

    const handle =
        card.querySelector(
            ".note-card-drag-handle"
        );


    if (!handle) {
        return;
    }


    handle.addEventListener(
        "pointerdown",
        event => {

            /*
             * Mouse kullanımında yalnızca
             * sol tuş ile drag başlat.
             */

            if (
                event.pointerType === "mouse" &&
                event.button !== 0
            ) {

                return;
            }


            /*
             * Manuel sıralama dışında
             * drag çalışmasın.
             */

            if (
                sortSelect.value !== "manual"
            ) {

                return;
            }


            event.preventDefault();

            event.stopPropagation();


            startDrag(
                event,
                card,
                handle,
                noteId
            );

        }
    );

}


/* =========================================================
   DRAG BAŞLAT
========================================================= */

function startDrag(
    event,
    card,
    handle,
    noteId
) {

    if (dragState) {
        return;
    }


    const column =
        card.parentElement;


    const cardRect =
        card.getBoundingClientRect();


    dragState = {

        pointerId:
            event.pointerId,

        noteId:
            noteId,

        card:
            card,

        handle:
            handle,

        column:
            column,

        placeholder:
            null,

        startX:
            event.clientX,

        startY:
            event.clientY,

        offsetX:
            event.clientX -
            cardRect.left,

        offsetY:
            event.clientY -
            cardRect.top,

        width:
            cardRect.width,

        height:
            cardRect.height,

        dragging:
            false

    };


    /*
     * Pointer capture.
     */

    try {

        handle.setPointerCapture(
            event.pointerId
        );

    } catch (error) {

        console.warn(
            "Pointer capture başlatılamadı:",
            error
        );

    }


    document.body.classList.add(
        "drag-ready"
    );


    document.addEventListener(
        "pointermove",
        handleDragPointerMove
    );


    document.addEventListener(
        "pointerup",
        handleDragPointerUp
    );


    document.addEventListener(
        "pointercancel",
        handleDragPointerCancel
    );

}


/* =========================================================
   POINTER MOVE
========================================================= */

function handleDragPointerMove(event) {

    if (!dragState) {
        return;
    }


    if (
        dragState.pointerId !==
        event.pointerId
    ) {

        return;
    }


    const deltaX =
        event.clientX -
        dragState.startX;


    const deltaY =
        event.clientY -
        dragState.startY;


    const distance =
        Math.sqrt(
            deltaX * deltaX +
            deltaY * deltaY
        );


    /*
     * Çok küçük hareketleri drag kabul etme.
     */

    if (
        !dragState.dragging &&
        distance < 6
    ) {

        return;
    }


    if (!dragState.dragging) {

        beginActualDrag();

    }


    moveDraggedCard(
        event.clientX,
        event.clientY
    );

}


/* =========================================================
   GERÇEK DRAG BAŞLAT
========================================================= */

function beginActualDrag() {

    if (!dragState) {
        return;
    }


    dragState.dragging = true;


    const card =
        dragState.card;


    const column =
        dragState.column;


    const rect =
        card.getBoundingClientRect();


    dragState.width =
        rect.width;


    dragState.height =
        rect.height;


    /*
     * =====================================================
     * PLACEHOLDER
     * =====================================================
     *
     * Orijinal Bootstrap kolonunun yerine
     * yeni bir kolon koyuyoruz.
     */

    const placeholderColumn =
        document.createElement("div");


    placeholderColumn.className =
        column.className;


    placeholderColumn.classList.add(
        "note-card-placeholder-column"
    );


    const placeholder =
        document.createElement("div");


    placeholder.className =
        "note-card-drag-placeholder";


    placeholder.style.width =
        `${rect.width}px`;


    placeholder.style.height =
        `${rect.height}px`;


    placeholderColumn.appendChild(
        placeholder
    );


    dragState.placeholder =
        placeholderColumn;


    /*
     * Placeholder'ı orijinal kolonun
     * bulunduğu yere koy.
     */

    notesContainer.insertBefore(
        placeholderColumn,
        column
    );


    /*
     * Orijinal kolonu grid'den çıkar.
     */

    column.remove();


    /*
     * Kartı doğrudan body'ye taşıyoruz.
     *
     * Böylece hiçbir parent'ın
     * display/overflow durumundan etkilenmez.
     */

    document.body.appendChild(
        card
    );


    /*
     * Kartın mevcut görsel konumunu koru.
     */

    card.style.width =
        `${rect.width}px`;


    card.style.height =
        `${rect.height}px`;


    card.style.position =
        "fixed";


    card.style.left =
        `${rect.left}px`;


    card.style.top =
        `${rect.top}px`;


    card.style.margin =
        "0";


    card.style.zIndex =
        "1050";


    card.style.pointerEvents =
        "none";


    /*
     * Görsel drag durumu.
     */

    card.classList.add(
        "note-card-dragging"
    );


    card.dataset.dragged =
        "true";


    card.setAttribute(
        "aria-grabbed",
        "true"
    );


    document.body.classList.add(
        "is-dragging"
    );

}


/* =========================================================
   KARTI HAREKET ETTİR
========================================================= */

function moveDraggedCard(
    clientX,
    clientY
) {

    if (
        !dragState ||
        !dragState.dragging
    ) {

        return;
    }


    const card =
        dragState.card;


    /*
     * Kart fareyi takip eder.
     */

    const left =
        clientX -
        dragState.offsetX;


    const top =
        clientY -
        dragState.offsetY;


    card.style.left =
        `${left}px`;


    card.style.top =
        `${top}px`;


    /*
     * Placeholder'ın konumunu
     * güncelle.
     */

    updatePlaceholderPosition(
        clientX,
        clientY
    );

}


/* =========================================================
   PLACEHOLDER KONUMUNU BELİRLE
========================================================= */

function updatePlaceholderPosition(
    clientX,
    clientY
) {

    if (
        !dragState ||
        !dragState.placeholder
    ) {

        return;
    }


    const placeholder =
        dragState.placeholder;


    const columns =
        Array.from(
            notesContainer.children
        )
        .filter(
            column =>
                column !==
                placeholder
        );


    if (
        columns.length === 0
    ) {

        return;
    }


    /*
     * Fareye en uygun kartı bul.
     */

    let targetColumn = null;

    let targetScore =
        Infinity;


    columns.forEach(
        column => {

            const rect =
                column.getBoundingClientRect();


            const centerX =
                rect.left +
                rect.width / 2;


            const centerY =
                rect.top +
                rect.height / 2;


            const horizontalDistance =
                Math.abs(
                    clientX -
                    centerX
                );


            const verticalDistance =
                Math.abs(
                    clientY -
                    centerY
                );


            let score;


            if (
                window.innerWidth >= 768
            ) {

                /*
                 * Masaüstünde yatay konuma
                 * biraz daha fazla önem ver.
                 */

                score =
                    horizontalDistance +
                    verticalDistance * 1.5;

            } else {

                /*
                 * Mobilde dikey konuma
                 * daha fazla önem ver.
                 */

                score =
                    verticalDistance +
                    horizontalDistance * 0.25;

            }


            if (
                score <
                targetScore
            ) {

                targetScore =
                    score;

                targetColumn =
                    column;

            }

        }
    );


    if (!targetColumn) {
        return;
    }


    const targetRect =
        targetColumn.getBoundingClientRect();


    let insertBefore;


    if (
        window.innerWidth >= 768
    ) {

        insertBefore =
            clientX <
            targetRect.left +
            targetRect.width / 2;

    } else {

        insertBefore =
            clientY <
            targetRect.top +
            targetRect.height / 2;

    }


    /*
     * Placeholder zaten olması gereken
     * yerdeyse DOM'u değiştirme.
     */

    if (insertBefore) {

        if (
            placeholder.nextElementSibling ===
            targetColumn
        ) {

            return;
        }


        notesContainer.insertBefore(
            placeholder,
            targetColumn
        );

    } else {

        const next =
            targetColumn.nextElementSibling;


        if (
            next === placeholder
        ) {

            return;
        }


        notesContainer.insertBefore(
            placeholder,
            next
        );

    }

}


/* =========================================================
   POINTER UP
========================================================= */

function handleDragPointerUp(event) {

    if (!dragState) {
        return;
    }


    if (
        dragState.pointerId !==
        event.pointerId
    ) {

        return;
    }


    finishDrag();

}


/* =========================================================
   DRAG TAMAMLA
========================================================= */

function finishDrag() {

    if (!dragState) {
        return;
    }


    const state =
        dragState;


    const card =
        state.card;


    const wasDragging =
        state.dragging;


    if (wasDragging) {

        const placeholder =
            state.placeholder;


        /*
         * Önce kartı placeholder'ın
         * bulunduğu konuma yerleştir.
         */

        if (placeholder) {

            notesContainer.insertBefore(
                state.column,
                placeholder
            );


            placeholder.remove();

        } else {

            notesContainer.appendChild(
                state.column
            );

        }


        /*
         * Kartı tekrar kendi kolonuna
         * taşı.
         */

        state.column.appendChild(
            card
        );


        /*
         * Drag stillerini temizle.
         */

        resetDraggedCardStyles(
            card
        );


        card.classList.remove(
            "note-card-dragging"
        );


        card.setAttribute(
            "aria-grabbed",
            "false"
        );


        /*
         * DOM sırasını notes dizisine aktar.
         */

        updateNotesOrderFromDOM();


        /*
         * Kalıcı olarak kaydet.
         */

        saveNotesToStorage();

    }


    /*
     * Drag sonrası oluşabilecek click'i
     * engelle.
     */

    card.dataset.dragged =
        wasDragging
            ? "true"
            : "";


    cleanupDragState();

}


/* =========================================================
   POINTER CANCEL
========================================================= */

function handleDragPointerCancel(event) {

    if (!dragState) {
        return;
    }


    if (
        dragState.pointerId !==
        event.pointerId
    ) {

        return;
    }


    cancelDrag();

}


/* =========================================================
   DRAG İPTAL
========================================================= */

function cancelDrag() {

    if (!dragState) {
        return;
    }


    const state =
        dragState;


    /*
     * Gerçek drag başladıysa
     * kartı eski yerine geri koy.
     */

    if (
        state.dragging
    ) {

        const placeholder =
            state.placeholder;


        if (placeholder) {

            notesContainer.insertBefore(
                state.column,
                placeholder
            );


            placeholder.remove();

        } else {

            notesContainer.appendChild(
                state.column
            );

        }


        state.column.appendChild(
            state.card
        );


        resetDraggedCardStyles(
            state.card
        );


        state.card.classList.remove(
            "note-card-dragging"
        );


        state.card.setAttribute(
            "aria-grabbed",
            "false"
        );

    }


    cleanupDragState();


    renderNotes();

}


/* =========================================================
   DRAG STILLERİNİ TEMİZLE
========================================================= */

function resetDraggedCardStyles(
    card
) {

    card.style.width = "";

    card.style.height = "";

    card.style.position = "";

    card.style.left = "";

    card.style.top = "";

    card.style.margin = "";

    card.style.zIndex = "";

    card.style.pointerEvents = "";

}


/* =========================================================
   DRAG TEMİZLE
========================================================= */

function cleanupDragState() {

    document.removeEventListener(
        "pointermove",
        handleDragPointerMove
    );


    document.removeEventListener(
        "pointerup",
        handleDragPointerUp
    );


    document.removeEventListener(
        "pointercancel",
        handleDragPointerCancel
    );


    document.body.classList.remove(
        "drag-ready"
    );


    document.body.classList.remove(
        "is-dragging"
    );


    dragState = null;

}


/* =========================================================
   DOM SIRASINDAN NOTES DİZİSİNİ GÜNCELLE
========================================================= */

function updateNotesOrderFromDOM() {

    const visibleIds =
        Array.from(
            notesContainer.children
        )
        .map(
            column =>
                column
                    .querySelector(
                        ".note-card"
                    )
                    ?.dataset.noteId
        )
        .filter(Boolean);


    if (
        visibleIds.length === 0
    ) {

        return;
    }


    /*
     * Arama yoksa tüm notes dizisini
     * DOM sırasına göre oluştur.
     */

    if (
        searchInput.value.trim() === ""
    ) {

        const noteMap =
            new Map(
                notes.map(
                    note => [
                        note.id,
                        note
                    ]
                )
            );


        const reorderedNotes =
            visibleIds
                .map(
                    id =>
                        noteMap.get(id)
                )
                .filter(Boolean);


        notes =
            reorderedNotes;


        return;
    }


    /*
     * Arama aktifse yalnızca görünen
     * notların sırasını değiştir.
     */

    const visibleSet =
        new Set(
            visibleIds
        );


    const reorderedVisibleNotes =
        visibleIds.map(
            id =>
                notes.find(
                    note =>
                        note.id === id
                )
        );


    let visibleIndex =
        0;


    notes =
        notes.map(
            note => {

                if (
                    visibleSet.has(
                        note.id
                    )
                ) {

                    return (
                        reorderedVisibleNotes[
                            visibleIndex++
                        ]
                    );

                }


                return note;

            }
        );

}