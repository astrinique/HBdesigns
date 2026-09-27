const storageKey = 'hb-designs-studio';
const defaultAccount = {
	id: 'default-admin',
	name: 'Hadiza',
	email: 'hadiza@admin.com',
	password: 'Hadiza.HB_123',
	protected: true
};
const state = JSON.parse(
	localStorage.getItem(storageKey) ||
		'{"orders":[],"customers":[],"measurements":[],"accounts":[]}'
);
state.accounts = Array.isArray(state.accounts) ? state.accounts : [];

if (!state.accounts.some(account => account.id === defaultAccount.id)) {
	state.accounts.unshift(defaultAccount);
}

const statusClass = {
	'In sewing': 'sewing',
	Fitting: 'fitting',
	Ready: 'ready',
	'Awaiting fabric': 'waiting'
};

const naira = new Intl.NumberFormat('en-NG', {
	style: 'currency',
	currency: 'NGN',
	maximumFractionDigits: 2
});

function saveState() {
	localStorage.setItem(storageKey, JSON.stringify(state));
}

function orderRow(order, showGarment = false) {
	return `<tr>
		<td>
			<span class="order-name">${order.id}</span>
			<span class="order-code">${showGarment ? order.garment : 'Custom order'}</span>
		</td>
		<td>
			<span class="customer-name">${order.customer}</span>
			<span class="customer-email">${order.email || 'No email added'}</span>
		</td>
		${showGarment ? `<td>${order.garment}</td>` : ''}
		<td>${order.due || 'Not set'}</td>
		<td><span class="status-pill ${statusClass[order.status] || 'waiting'}">${order.status}</span></td>
		<td class="total-cell">${naira.format(Number(order.total) || 0)}</td>
	</tr>`;
}

function renderOrders(list = state.orders) {
	document.getElementById('recentOrdersBody').innerHTML = list.length
		? list.slice(-4).reverse().map(order => orderRow(order)).join('')
		: '<tr><td colspan="5" class="empty-cell">No orders yet. Add your first order to see it here.</td></tr>';

	document.getElementById('allOrdersBody').innerHTML = list.length
		? list.map(order => orderRow(order, true)).join('')
		: '<tr><td colspan="6" class="empty-cell">No orders yet.</td></tr>';

	updateRevenue();
}

function renderCustomers() {
	const customerGrid = document.getElementById('customerGrid');

	customerGrid.innerHTML = state.customers.length
		? state.customers.map(customer => {
			  const initials = customer.name
				  .split(' ')
				  .map(part => part[0])
				  .join('')
				  .slice(0, 2)
				  .toUpperCase();
			  const orderCount = state.orders.filter(order => order.customer === customer.name).length;
			  const hasMeasurements = state.measurements.some(profile => profile.name === customer.name);

			  return `<article class="customer-card">
				  <div class="customer-top">
					  <span class="customer-avatar">${initials}</span>
					  <div>
						  <h3>${customer.name}</h3>
						  <small>${customer.email || customer.phone || 'Customer profile'}</small>
					  </div>
				  </div>
				  <div class="customer-stats">
					  <div><span>Orders</span><strong>${orderCount}</strong></div>
					  <div><span>Measurements</span><strong>${hasMeasurements ? 'Saved' : 'Not saved'}</strong></div>
				  </div>
			  </article>`;
		  }).join('')
		: '<div class="empty-panel">No customer profiles yet.<br><span>Add a customer to start your client book.</span></div>';
}

function renderMeasurements() {
	const measurementList = document.getElementById('measurementList');

	measurementList.innerHTML = state.measurements.length
		? state.measurements.map(profile => {
			  const initials = profile.name
				  .split(' ')
				  .map(part => part[0])
				  .join('')
				  .slice(0, 2)
				  .toUpperCase();

			  return `<button class="measurement-row" data-measurement-id="${profile.id}">
				  <span class="customer-avatar">${initials}</span>
				  <span class="measurement-person">
					  <strong>${profile.name}</strong>
					  <small>${profile.updated}  |  ${Object.keys(profile.values).length} measurements</small>
				  </span>
				  <span class="measurement-date">${profile.customerId ? 'Linked customer' : 'Measurement only'} <b></b></span>
			  </button>`;
		  }).join('')
		: '<div class="empty-panel">No measurement profiles yet.<br><span>Saved measurements will appear here.</span></div>';

	document.querySelectorAll('[data-measurement-id]').forEach(row => {
		row.addEventListener('click', () => openMeasurementDetails(row.dataset.measurementId));
	});
}

function updateRevenue() {
	const range = document.getElementById('revenueRange').value;
	const now = new Date();
	const filtered = state.orders.filter(order => {
		const date = new Date(order.createdAt);

		if (range === 'today') return date.toDateString() === now.toDateString();
		if (range === 'month') return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
		if (range === 'year') return date.getFullYear() === now.getFullYear();
		return true;
	});

	const total = filtered.reduce((sum, order) => sum + Number(order.total || 0), 0);
	document.getElementById('revenueValue').textContent = naira.format(total);
	document.getElementById('revenueNote').textContent = filtered.length
		? `${filtered.length} order${filtered.length === 1 ? '' : 's'} in this period`
		: 'No orders recorded in this period';
}

function updateOverviewCounts() {
	const active = state.orders.filter(order => order.status !== 'Ready').length;
	document.getElementById('activeOrdersValue').textContent = active;
	document.getElementById('activeOrdersNote').textContent = active
		? `${active} order${active === 1 ? '' : 's'} in progress`
		: 'No orders yet';
	document.getElementById('customersValue').textContent = state.customers.length;
	document.getElementById('customersNote').textContent = state.customers.length
		? `${state.customers.length} profile${state.customers.length === 1 ? '' : 's'} saved`
		: 'No customer profiles yet';
}

function openModal(id) {
	document.getElementById(id).classList.add('open');
	document.getElementById(id).setAttribute('aria-hidden', 'false');
}

function closeModal(id) {
	document.getElementById(id).classList.remove('open');
	document.getElementById(id).setAttribute('aria-hidden', 'true');
}

function populateMeasurementCustomers() {
	document.getElementById('measurementCustomer').innerHTML =
		'<option value="">No existing customer</option>' +
		state.customers.map(customer => `<option value="${customer.id}">${customer.name}</option>`).join('');
}

const measurementLabels = {
	fullLength: 'Full Length',
	bust: 'Bust',
	underBust: 'Under bust',
	waist: 'Waist',
	shoulder: 'Shoulder',
	hips: 'Hips',
	blouseLength: 'Blouse length',
	skirtLength: 'Skirt Length',
	sleeveLength: 'Sleeve Length',
	sleeveCircumference: 'Sleeve Circumference',
	wrist: 'Wrists'
};

function formatMeasurementLabel(key) {
	return measurementLabels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, match => match.toUpperCase());
}

function openMeasurementDetails(id) {
	const profile = state.measurements.find(item => item.id === id);
	if (!profile) return;

	const values = Object.entries(profile.values || {}).map(([key, value]) => {
		const label = formatMeasurementLabel(key);
		return `<div><span>${label}</span><strong>${value} in</strong></div>`;
	}).join('');

 	document.getElementById('measurementDetailTitle').textContent = profile.name;
	document.getElementById('measurementDetailMeta').textContent = `${profile.updated} | ${profile.customerId ? 'Linked to customer record' : 'Measurement-only profile'}`;
	document.getElementById('measurementDetailGrid').innerHTML = values;
	document.getElementById('measurementDetailNotes').textContent = profile.notes
		? `Notes: ${profile.notes}`
		: 'No fit notes added.';
	openModal('measurementDetailModal');
}

function renderAll() {
	renderOrders();
	renderCustomers();
	renderMeasurements();
	populateMeasurementCustomers();
	updateOverviewCounts();
}

function renderAccounts() {
	const accountsList = document.getElementById('accountsList');

	accountsList.innerHTML = state.accounts
		.map(account => `<article class="account-entry">
			<div>
				<span class="log-date">${account.protected ? 'PROTECTED DEFAULT' : 'ADMIN ACCOUNT'}</span>
				<h3>${account.name}</h3>
				<p>${account.email}</p>
			</div>
			<div class="account-entry-actions">
				${account.protected
					? '<span class="protected-label">Cannot delete</span>'
					: `<button class="text-button edit-account" data-account-id="${account.id}">Edit</button>
					   <button class="log-delete delete-account" data-account-id="${account.id}" aria-label="Delete ${account.name}">Delete</button>`}
			</div>
		</article>`)
		.join('');

	document.querySelectorAll('.edit-account').forEach(button => {
		button.addEventListener('click', () => editAccount(button.dataset.accountId));
	});

	document.querySelectorAll('.delete-account').forEach(button => {
		button.addEventListener('click', () => {
			const index = state.accounts.findIndex(account => account.id === button.dataset.accountId);
			if (index >= 0) {
				state.accounts.splice(index, 1);
				saveState();
				renderAccounts();
				showToast('Admin account deleted.');
			}
		});
	});
}

function showView(view) {
	document.querySelectorAll('.page-view').forEach(page => page.classList.remove('active-view'));
	document.getElementById(`${view}View`).classList.add('active-view');
	document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.view === view));
	document.getElementById('pageLabel').textContent = view === 'settings'
		? 'Account settings'
		: view.charAt(0).toUpperCase() + view.slice(1);

	if (view === 'settings') renderAccounts();
	window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showToast(message) {
	const toast = document.getElementById('toast');
	toast.textContent = message;
	toast.classList.add('show');
	setTimeout(() => toast.classList.remove('show'), 2600);
}

function clearLoginForm() {
	const form = document.getElementById('loginForm');
	form.reset();
	document.getElementById('loginError').textContent = '';
	form.querySelector('[name="email"]').value = '';
	form.querySelector('[name="password"]').value = '';
}

function openLogin() {
	clearLoginForm();
	document.getElementById('loginModal').classList.add('open');
	document.getElementById('loginModal').setAttribute('aria-hidden', 'false');
}

function closeLogin() {
	clearLoginForm();
	document.getElementById('loginModal').classList.remove('open');
	document.getElementById('loginModal').setAttribute('aria-hidden', 'true');
}

function resetStudioData() {
	state.orders.length = 0;
	state.customers.length = 0;
	state.measurements.length = 0;
	state.accounts.length = 0;
	state.accounts.push(defaultAccount);
	localStorage.removeItem(storageKey);
	sessionStorage.clear();
	renderAll();
	renderAccounts();
	closeModal('resetModal');
	showView('overview');
	showToast('Studio data reset. Default admin account kept.');
}

document.querySelectorAll('.nav-item, [data-view="orders"]').forEach(button => {
	button.addEventListener('click', () => showView(button.dataset.view));
});

document.querySelectorAll('#landingLoginButton, #heroLoginButton, #storyLoginButton, #bottomLoginButton, #collectionLoginButton').forEach(button => {
	button.addEventListener('click', openLogin);
});

document.getElementById('loginButton').addEventListener('click', () => {
	clearLoginForm();
	document.getElementById('dashboardApp').hidden = true;
	document.getElementById('landingPage').hidden = false;
});

document.getElementById('profileButton').addEventListener('click', () => showView('settings'));
document.getElementById('closeLogin').addEventListener('click', closeLogin);
document.getElementById('loginModal').addEventListener('click', event => {
	if (event.target.id === 'loginModal') closeLogin();
});

document.getElementById('resetDataButton').addEventListener('click', () => openModal('resetModal'));
document.getElementById('confirmResetButton').addEventListener('click', resetStudioData);

document.getElementById('loginForm').addEventListener('submit', event => {
	event.preventDefault();
	const data = Object.fromEntries(new FormData(event.target));
	const account = state.accounts.find(
		item => item.email.toLowerCase() === data.email.toLowerCase() && item.password === data.password
	);

	if (!account) {
		document.getElementById('loginError').textContent = 'Incorrect email or password.';
		return;
	}

	document.getElementById('loginError').textContent = '';
	closeLogin();
	document.getElementById('landingPage').hidden = true;
	document.getElementById('dashboardApp').hidden = false;
	showToast(`Welcome, ${account.name}.`);
});

document.querySelectorAll('#newOrderButton, #newOrderButtonTwo').forEach(button => {
	button.addEventListener('click', () => openModal('orderModal'));
});

document.getElementById('newCustomerButton').addEventListener('click', () => openModal('customerModal'));
document.getElementById('newMeasurementButton').addEventListener('click', () => {
	populateMeasurementCustomers();
	openModal('measurementModal');
});
document.getElementById('measurementInfoButton').addEventListener('click', () => {
	showToast('Profiles keep fit notes and measurements together.');
});

document.querySelectorAll('[data-close-modal]').forEach(button => {
	button.addEventListener('click', () => closeModal(button.dataset.closeModal));
});

document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
	backdrop.addEventListener('click', event => {
		if (event.target === backdrop) closeModal(backdrop.id);
	});
});

document.getElementById('orderForm').addEventListener('submit', event => {
	event.preventDefault();
	const data = Object.fromEntries(new FormData(event.target));
	const matchingCustomer = state.customers.find(customer =>
		customer.name.trim().toLowerCase() === data.customer.trim().toLowerCase() ||
		(data.email && customer.email && customer.email.toLowerCase() === data.email.toLowerCase())
	);

	if (matchingCustomer) {
		matchingCustomer.email = data.email || matchingCustomer.email;
	} else {
		state.customers.push({
			id: crypto.randomUUID(),
			name: data.customer,
			email: data.email || '',
			phone: ''
		});
	}

	state.orders.push({
		id: `HB-${String(state.orders.length + 1).padStart(4, '0')}`,
		...data,
		total: Number(data.total),
		createdAt: new Date().toISOString()
	});

	saveState();
	renderAll();
	event.target.reset();
	closeModal('orderModal');
	showToast('Order saved, customer synced, and revenue updated.');
});

document.getElementById('customerForm').addEventListener('submit', event => {
	event.preventDefault();
	const data = Object.fromEntries(new FormData(event.target));
	state.customers.push({ id: crypto.randomUUID(), ...data });
	saveState();
	renderAll();
	event.target.reset();
	closeModal('customerModal');
	showToast('Customer added to your client book.');
});

document.getElementById('measurementCustomer').addEventListener('change', event => {
	const customer = state.customers.find(item => item.id === event.target.value);
	if (customer) document.getElementById('measurementName').value = customer.name;
});

document.getElementById('measurementForm').addEventListener('submit', event => {
	event.preventDefault();
	const data = Object.fromEntries(new FormData(event.target));
	const customer = state.customers.find(item => item.id === data.customerId);
	let customerId = customer?.id || '';

	if (!customer && data.syncCustomer) {
		const newCustomer = { id: crypto.randomUUID(), name: data.name };
		state.customers.push(newCustomer);
		customerId = newCustomer.id;
	}

	const values = {};
	['fullLength', 'bust', 'underBust', 'waist', 'shoulder', 'hips', 'blouseLength', 'skirtLength', 'sleeveLength', 'sleeveCircumference', 'wrist'].forEach(key => {
		if (data[key]) values[key] = Number(data[key]);
	});

	state.measurements.push({
		id: crypto.randomUUID(),
		name: customer?.name || data.name,
		customerId,
		values,
		notes: data.notes || '',
		updated: new Date().toLocaleDateString()
	});

	saveState();
	renderAll();
	event.target.reset();
	closeModal('measurementModal');
	showToast(customer
		? 'Measurements linked to the customer.'
		: data.syncCustomer
			? 'Measurements saved and customer created.'
			: 'Measurements saved without a customer.');
});

document.getElementById('revenueRange').addEventListener('change', updateRevenue);
document.getElementById('orderSearch').addEventListener('input', event => {
	const term = event.target.value.toLowerCase();
	renderOrders(state.orders.filter(order => `${order.id} ${order.customer} ${order.garment}`.toLowerCase().includes(term)));
});

document.querySelectorAll('.filter-button').forEach(button => {
	button.addEventListener('click', () => {
		document.querySelectorAll('.filter-button').forEach(item => item.classList.remove('active'));
		button.classList.add('active');
		const status = button.dataset.status;
		renderOrders(state.orders.filter(order => status === 'all' || (status === 'ready' ? order.status === 'Ready' : order.status !== 'Ready')));
	});
});

function editAccount(id) {
	const account = state.accounts.find(item => item.id === id);
	if (!account) return;

	const form = document.getElementById('accountForm');
	form.elements.id.value = account.id;
	form.elements.name.value = account.name;
	form.elements.email.value = account.email;
	form.elements.password.value = account.password;
	form.hidden = false;
	document.getElementById('newAccountButton').hidden = true;
}

document.getElementById('newAccountButton')?.addEventListener('click', () => {
	const form = document.getElementById('accountForm');
	form.reset();
	form.elements.id.value = '';
	form.hidden = false;
	document.getElementById('newAccountButton').hidden = true;
});

document.getElementById('cancelAccountButton')?.addEventListener('click', () => {
	const form = document.getElementById('accountForm');
	form.reset();
	form.hidden = true;
	document.getElementById('newAccountButton').hidden = false;
});

document.getElementById('accountForm')?.addEventListener('submit', event => {
	event.preventDefault();
	const data = Object.fromEntries(new FormData(event.target));
	const existing = state.accounts.find(account => account.id === data.id);

	if (existing) {
		Object.assign(existing, {
			name: data.name,
			email: data.email,
			password: data.password
		});
	} else {
		state.accounts.push({
			id: crypto.randomUUID(),
			name: data.name,
			email: data.email,
			password: data.password,
			protected: false
		});
	}

	saveState();
	renderAccounts();
	event.target.reset();
	event.target.hidden = true;
	document.getElementById('newAccountButton').hidden = false;
	showToast('Dashboard account saved.');
});

const scrollProgress = document.getElementById('scrollProgress');
const cursorGlow = document.getElementById('cursorGlow');

function updateScrollProgress() {
	const scrollable = document.documentElement.scrollHeight - window.innerHeight;
	const progress = scrollable ? window.scrollY / scrollable : 0;
	scrollProgress.style.transform = `scaleX(${progress})`;
}

function updateEditorialMotion() {
	const viewport = window.innerHeight;

	document.querySelectorAll('.feature-band, .services-section, .process-section, .landing-cta, .look-feature, .look-duo, .look-pair, .look-finale').forEach(section => {
		const bounds = section.getBoundingClientRect();
		const progress = Math.max(-1, Math.min(1, (viewport / 2 - (bounds.top + bounds.height / 2)) / (viewport + bounds.height)));
		section.style.setProperty('--scroll-shift', `${progress * 34}px`);
		section.style.setProperty('--scroll-tilt', `${progress * -1.2}deg`);
	});

	const process = document.querySelector('.process-section');
	if (process) {
		const bounds = process.getBoundingClientRect();
		const progress = Math.max(0, Math.min(1, (viewport - bounds.top) / (viewport + bounds.height)));
		process.style.setProperty('--thread-progress', progress.toFixed(3));
		process.querySelectorAll('.process-step').forEach((step, index) => {
			step.style.setProperty('--step-delay', `${Math.max(0, progress * 1.4 - index * 0.2)}`);
		});
	}

	document.querySelectorAll('.collection-image').forEach(frame => {
		const frameBounds = frame.getBoundingClientRect();
		const imageProgress = (viewport - frameBounds.top) / (viewport + frameBounds.height);
		const imageShift = (0.5 - imageProgress) * 52;
		frame.style.setProperty('--photo-shift', `${imageShift}px`);
	});
}

window.addEventListener('scroll', () => {
	updateScrollProgress();
	updateEditorialMotion();
}, { passive: true });

updateScrollProgress();
updateEditorialMotion();

window.addEventListener('pointermove', event => {
	cursorGlow.style.transform = `translate3d(${event.clientX - 120}px, ${event.clientY - 120}px, 0)`;
});

const revealObserver = new IntersectionObserver(entries => {
	entries.forEach(entry => {
		if (entry.isIntersecting) {
			entry.target.classList.add('is-visible');
			revealObserver.unobserve(entry.target);
		}
	});
}, { threshold: 0.01, rootMargin: '0px 0px 160px 0px' });

document.querySelectorAll('[data-reveal], .landing-intro, .feature-band, .services-section, .process-section, .landing-cta, .look-copy, .look-interlude, .look-pair-note, .look-finale-copy').forEach(section => {
	revealObserver.observe(section);
});

saveState();
renderAll();
renderAccounts();
