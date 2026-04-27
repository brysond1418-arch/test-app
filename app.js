const STORAGE_KEY = "personal-crm.contacts.v1";

const seedContacts = [
  {
    id: "sample-1",
    name: "Maya Patel",
    company: "Northstar Studio",
    relationship: "Work",
    priority: "High",
    email: "maya@northstar.example",
    phone: "(555) 014-2388",
    lastContacted: "2026-04-19",
    nextFollowUp: "2026-04-30",
    tags: ["Design", "Referral"],
    notes: "Met at a product meetup. Interested in a lightweight collaboration tool."
  },
  {
    id: "sample-2",
    name: "Jordan Lee",
    company: "Lee Advisory",
    relationship: "Prospect",
    priority: "Medium",
    email: "jordan@leeadvisory.example",
    phone: "(555) 018-4412",
    lastContacted: "2026-04-11",
    nextFollowUp: "2026-05-03",
    tags: ["Consulting"],
    notes: "Asked for an intro to local operators. Follow up with a curated list."
  },
  {
    id: "sample-3",
    name: "Sofia Ramirez",
    company: "Personal",
    relationship: "Friend",
    priority: "Low",
    email: "sofia@example.com",
    phone: "(555) 019-7701",
    lastContacted: "2026-04-25",
    nextFollowUp: "2026-05-10",
    tags: ["Running", "Family"],
    notes: "Remember to ask about the marathon training plan."
  }
];

const state = {
  contacts: loadContacts(),
  selectedId: null,
  search: "",
  relationship: "all"
};

const today = startOfDay(new Date());
const contactList = document.querySelector("#contact-list");
const contactCountLabel = document.querySelector("#contact-count-label");
const contactForm = document.querySelector("#contact-form");
const emptyState = document.querySelector("#empty-state");
const formTitle = document.querySelector("#form-title");
const searchInput = document.querySelector("#search-input");
const relationshipFilter = document.querySelector("#relationship-filter");
const newContactButton = document.querySelector("#new-contact-button");
const cancelButton = document.querySelector("#cancel-button");
const deleteButton = document.querySelector("#delete-button");
const totalContacts = document.querySelector("#total-contacts");
const dueSoon = document.querySelector("#due-soon");
const priorityCount = document.querySelector("#priority-count");
const cardTemplate = document.querySelector("#contact-card-template");

function loadContacts() {
  try {
    const contacts = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(contacts)) {
      return contacts;
    }
  } catch (error) {
    console.warn("Could not load saved contacts.", error);
  }

  return seedContacts.map(copyContact);
}

function saveContacts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.contacts));
}

function copyContact(contact) {
  return { ...contact, tags: [...contact.tags] };
}

function filteredContacts() {
  const query = state.search.trim().toLowerCase();

  return state.contacts
    .filter((contact) => state.relationship === "all" || contact.relationship === state.relationship)
    .filter((contact) => {
      if (!query) return true;

      return [
        contact.name,
        contact.company,
        contact.relationship,
        contact.priority,
        contact.email,
        contact.phone,
        contact.notes,
        ...(contact.tags || [])
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    })
    .sort((a, b) => {
      const nextA = a.nextFollowUp || "9999-12-31";
      const nextB = b.nextFollowUp || "9999-12-31";
      return nextA.localeCompare(nextB) || a.name.localeCompare(b.name);
    });
}

function render() {
  renderStats();
  renderList();
  renderDetails();
}

function renderStats() {
  totalContacts.textContent = state.contacts.length;
  dueSoon.textContent = state.contacts.filter((contact) => daysUntil(contact.nextFollowUp) <= 7).length;
  priorityCount.textContent = state.contacts.filter((contact) => contact.priority === "High").length;
}

function renderList() {
  const contacts = filteredContacts();
  contactList.textContent = "";
  contactCountLabel.textContent = `${contacts.length} ${contacts.length === 1 ? "person" : "people"}`;

  if (!contacts.length) {
    const empty = document.createElement("p");
    empty.className = "list-empty";
    empty.textContent = "No contacts match your filters.";
    contactList.append(empty);
    return;
  }

  contacts.forEach((contact) => {
    const card = cardTemplate.content.firstElementChild.cloneNode(true);
    const tags = (contact.tags || []).slice(0, 2).join(" · ");

    card.classList.toggle("active", contact.id === state.selectedId);
    card.setAttribute("aria-pressed", String(contact.id === state.selectedId));
    card.querySelector(".avatar").textContent = initials(contact.name);
    card.querySelector(".contact-name").textContent = contact.name || "Unnamed";
    card.querySelector(".contact-meta").textContent = [contact.company, contact.relationship].filter(Boolean).join(" · ");
    card.querySelector(".contact-tags").textContent = tags || "No tags yet";
    const followUpBadge = card.querySelector(".follow-up-badge");
    followUpBadge.textContent = followUpLabel(contact.nextFollowUp);
    followUpBadge.dataset.status = followUpStatus(contact.nextFollowUp);
    card.addEventListener("click", () => selectContact(contact.id));

    contactList.append(card);
  });
}

function renderDetails() {
  const contact = selectedContact();
  emptyState.classList.toggle("hidden", Boolean(contact));
  contactForm.classList.toggle("hidden", !contact);

  if (!contact) {
    contactForm.reset();
    deleteButton.classList.add("hidden");
    return;
  }

  formTitle.textContent = contact.id.startsWith("draft-") ? "New contact" : contact.name;
  deleteButton.classList.toggle("hidden", contact.id.startsWith("draft-"));
  setValue("name", contact.name);
  setValue("company", contact.company);
  setValue("relationship", contact.relationship || "Friend");
  setValue("priority", contact.priority || "Medium");
  setValue("email", contact.email);
  setValue("phone", contact.phone);
  setValue("lastContacted", contact.lastContacted);
  setValue("nextFollowUp", contact.nextFollowUp);
  setValue("tags", (contact.tags || []).join(", "));
  setValue("notes", contact.notes);
}

function selectContact(id) {
  state.selectedId = id;
  render();
}

function selectedContact() {
  return state.contacts.find((contact) => contact.id === state.selectedId);
}

function startDraft() {
  const draft = {
    id: `draft-${Date.now()}`,
    name: "",
    company: "",
    relationship: "Friend",
    priority: "Medium",
    email: "",
    phone: "",
    lastContacted: "",
    nextFollowUp: "",
    tags: [],
    notes: ""
  };

  state.contacts.unshift(draft);
  state.selectedId = draft.id;
  render();
  document.querySelector("#name").focus();
}

function handleSubmit(event) {
  event.preventDefault();

  const contact = selectedContact();
  if (!contact) return;

  const formData = new FormData(contactForm);
  const savedContact = {
    id: contact.id.startsWith("draft-") ? crypto.randomUUID() : contact.id,
    name: String(formData.get("name")).trim(),
    company: String(formData.get("company")).trim(),
    relationship: String(formData.get("relationship")),
    priority: String(formData.get("priority")),
    email: String(formData.get("email")).trim(),
    phone: String(formData.get("phone")).trim(),
    lastContacted: String(formData.get("lastContacted")),
    nextFollowUp: String(formData.get("nextFollowUp")),
    tags: String(formData.get("tags"))
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    notes: String(formData.get("notes")).trim()
  };

  state.contacts = state.contacts.map((entry) => (entry.id === contact.id ? savedContact : entry));
  state.selectedId = savedContact.id;
  saveContacts();
  render();
}

function cancelEdit() {
  const contact = selectedContact();
  if (contact?.id.startsWith("draft-")) {
    state.contacts = state.contacts.filter((entry) => entry.id !== contact.id);
    state.selectedId = state.contacts[0]?.id || null;
  }

  render();
}

function deleteContact() {
  const contact = selectedContact();
  if (!contact) return;

  const confirmed = window.confirm(`Delete ${contact.name}? This cannot be undone.`);
  if (!confirmed) return;

  state.contacts = state.contacts.filter((entry) => entry.id !== contact.id);
  state.selectedId = state.contacts[0]?.id || null;
  saveContacts();
  render();
}

function setValue(id, value = "") {
  document.querySelector(`#${id}`).value = value;
}

function initials(name) {
  return String(name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function followUpLabel(dateValue) {
  if (!dateValue) return "No follow-up";

  const days = daysUntil(dateValue);
  if (days < 0) return "Overdue";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days <= 7) return `${days} days`;

  return formatDate(dateValue);
}

function followUpStatus(dateValue) {
  if (!dateValue) return "none";

  const days = daysUntil(dateValue);
  if (days < 0) return "overdue";
  if (days <= 1) return "urgent";
  if (days <= 7) return "soon";
  return "later";
}

function daysUntil(dateValue) {
  if (!dateValue) return Number.POSITIVE_INFINITY;
  const target = startOfDay(new Date(`${dateValue}T00:00:00`));
  return Math.round((target - today) / 86400000);
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDate(dateValue) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric"
  }).format(new Date(`${dateValue}T00:00:00`));
}

newContactButton.addEventListener("click", startDraft);
cancelButton.addEventListener("click", cancelEdit);
deleteButton.addEventListener("click", deleteContact);
contactForm.addEventListener("submit", handleSubmit);
searchInput.addEventListener("input", (event) => {
  state.search = event.target.value;
  renderList();
});
relationshipFilter.addEventListener("change", (event) => {
  state.relationship = event.target.value;
  renderList();
});

state.selectedId = state.contacts[0]?.id || null;
render();
