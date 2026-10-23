const scriptURL = "https://script.google.com/macros/s/AKfycbyym-WvY93nk1QHeTlZZQ-1aK48CH1BMltTLlIIgLwmbaoDsfnE-YWG34KpkZjTY1X-/exec";
const form = document.getElementById("perpusForm");
const successCard = document.getElementById("successCard");
const backBtn = document.getElementById("backBtn");
const submitError = document.getElementById("submitError");
const submitButton = form.querySelector('button[type="submit"]');
const submitButtonMarkup = submitButton.innerHTML;
const whatsappInput = document.getElementById("whatsapp");
const durationInput = document.getElementById("lama-meminjam");
const bookInput = document.getElementById("judul-buku");
const bookSuggestions = document.getElementById("daftar-judul-buku");
const bookListStatus = document.getElementById("status-daftar-buku");
const bookTitles = new Set();
let bookListLoaded = false;

function parseCsv(text) {
	const rows = [];
	let row = [];
	let field = "";
	let insideQuotes = false;

	for (let i = 0; i < text.length; i += 1) {
		const character = text[i];

		if (insideQuotes) {
			if (character === '"' && text[i + 1] === '"') {
				field += '"';
				i += 1;
			} else if (character === '"') {
				insideQuotes = false;
			} else {
				field += character;
			}
		} else if (character === '"' && field.length === 0) {
			insideQuotes = true;
		} else if (character === ",") {
			row.push(field);
			field = "";
		} else if (character === "\n" || character === "\r") {
			row.push(field);
			if (row.some((value) => value.trim() !== "")) {
				rows.push(row);
			}
			row = [];
			field = "";
			if (character === "\r" && text[i + 1] === "\n") {
				i += 1;
			}
		} else {
			field += character;
		}
	}

	row.push(field);
	if (row.some((value) => value.trim() !== "")) {
		rows.push(row);
	}
	return rows;
}

async function loadBookList() {
	try {
		const response = await fetch("databuku.csv");
		if (!response.ok) {
			throw new Error(`Could not load databuku.csv (${response.status}).`);
		}

		const rows = parseCsv(await response.text());
		const headers = rows.shift()?.map((header) => header.trim().toLowerCase());
		const titleColumn = headers?.indexOf("judul") ?? -1;
		if (titleColumn < 0) {
			throw new Error('The CSV must include a "judul" column.');
		}

		for (const row of rows) {
			const title = row[titleColumn]?.trim();
			if (!title) {
				continue;
			}

			bookTitles.add(title.toLocaleLowerCase("id"));
			const option = document.createElement("option");
			option.value = title;
			bookSuggestions.append(option);
		}

		if (bookTitles.size === 0) {
			throw new Error("No book titles were found in databuku.csv.");
		}

		bookListLoaded = true;
		bookInput.disabled = false;
	} catch (error) {
		bookListStatus.hidden = false;
		bookListStatus.textContent = "Daftar buku gagal dimuat. Muat ulang halaman atau hubungi petugas perpustakaan.";
		bookListStatus.classList.add("book-list-error");
		console.error("Failed to load book list:", error);
	}
}

loadBookList();

bookInput.addEventListener("input", () => {
	const selectedTitle = bookInput.value.trim().toLocaleLowerCase("id");
	bookInput.setCustomValidity(
		bookTitles.has(selectedTitle)
			? ""
			: "Pilih judul buku dari daftar yang tersedia."
	);
});

form.addEventListener("submit", async (event) => {
	event.preventDefault();
	if (!bookListLoaded) {
		bookListStatus.textContent = "Daftar buku belum siap. Tunggu sebentar lalu coba lagi.";
		bookListStatus.classList.add("book-list-error");
		return;
	}
	submitError.hidden = true;
	submitButton.disabled = true;
	submitButton.textContent = "Mengirim...";

	try {
		const formData = new FormData(form);
		formData.set("whatsapp", `62${whatsappInput.value}`);

		await fetch(scriptURL, {
			method: "POST",
			mode: "no-cors",
			body: new URLSearchParams(formData)
		});
		form.hidden = true;
		successCard.hidden = false;
		successCard.focus();
	} catch {
		submitError.hidden = false;
	} finally {
		submitButton.disabled = false;
		submitButton.innerHTML = submitButtonMarkup;
	}
});

backBtn.addEventListener("click", () => {
	form.reset();
	whatsappInput.setCustomValidity("");
	durationInput.setCustomValidity("");
	bookInput.setCustomValidity("");
	successCard.hidden = true;
	form.hidden = false;
	form.scrollIntoView({ behavior: "smooth", block: "start" });
});

whatsappInput.addEventListener("input", () => {
	whatsappInput.setCustomValidity(
		/^8[0-9]{7,12}$/.test(whatsappInput.value)
			? ""
			: "Masukkan nomor setelah +62, mulai dengan 8 (contoh: 85xxxxxxxx)."
	);
});

durationInput.addEventListener("input", () => {
	durationInput.setCustomValidity(
		/^[1-9][0-9]?$/.test(durationInput.value)
			? ""
			: "Masukkan jumlah hari dengan angka bulat dari 1 sampai 99."
	);
});