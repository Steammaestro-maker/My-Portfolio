// ===== Вспомогательная функция: общее поведение для окон <dialog> =====
// Окно закрывается по кнопке с атрибутом data-close и по клику на тёмный фон.
// (Esc закрывает окно сам, это умеет сам <dialog>.)
const setupDialog = dialog => {
	dialog.addEventListener('click', event => {
		if (event.target.closest('[data-close]')) dialog.close()

		if (event.target === dialog) {
			const box = dialog.getBoundingClientRect()
			const inside =
				event.clientX >= box.left &&
				event.clientX <= box.right &&
				event.clientY >= box.top &&
				event.clientY <= box.bottom
			if (!inside) dialog.close()
		}
	})
}

// ===== Функция 1. Светлая и тёмная тема =====
// Класс "dark" на <body> подменяет CSS-переменные. Выбор запоминается в localStorage.
const initTheme = () => {
	const button = document.querySelector('#themeToggle')
	const meta = document.querySelector('meta[name="theme-color"]')

	const getSaved = () => {
		try {
			return localStorage.getItem('theme')
		} catch {
			return null
		}
	}

	const apply = isDark => {
		document.body.classList.toggle('dark', isDark)
		button.textContent = isDark ? 'light mode.' : 'dark mode.'
		button.setAttribute('aria-pressed', isDark)
		meta.setAttribute('content', isDark ? '#111111' : '#ffffff')
	}

	apply(getSaved() === 'dark')

	button.addEventListener('click', () => {
		const isDark = !document.body.classList.contains('dark')
		apply(isDark)
		try {
			localStorage.setItem('theme', isDark ? 'dark' : 'light')
		} catch {}
	})
}

// ===== Функция 2. Проекты: "show more" и окно с подробностями =====
const initProjects = () => {
	// --- показать / скрыть дополнительные карточки ---
	const moreButton = document.querySelector('#moreProjects')
	const extraCards = document.querySelectorAll('.p-card.extra')

	moreButton.addEventListener('click', () => {
		const wasOpen = moreButton.getAttribute('aria-expanded') === 'true'
		extraCards.forEach(card => (card.hidden = wasOpen))
		moreButton.setAttribute('aria-expanded', !wasOpen)
		moreButton.textContent = wasOpen ? 'show more projects' : 'show fewer projects'
	})

	// --- окно "see project": данные берём прямо из карточки ---
	const dialog = document.querySelector('#projectDialog')
	setupDialog(dialog)

	document.querySelectorAll('.p-card').forEach(card => {
		card.querySelector('.u-link').addEventListener('click', () => {
			const title = card.querySelector('h3').firstChild.textContent.trim()
			const tags = [...card.querySelectorAll('.tags i')].map(tag => tag.textContent)

			dialog.querySelector('#projectTitle').textContent = title
			dialog.querySelector('#projectText').textContent = card.querySelector('p').textContent.trim()
			dialog.querySelector('#projectTags').textContent = tags.join(' · ')
			dialog.querySelector('#projectLink').href = card.dataset.url
			dialog.showModal()
		})
	})
}

// ===== Функция 3. Слайдер "amazing cases": листание колесом мыши =====
// Вертикальное колесо двигает ленту вбок. На краях ленты колесо снова листает страницу.
const initSlider = () => {
	const track = document.querySelector('#casesTrack')
	const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

	let target = track.scrollLeft // куда лента должна доехать
	let frame = null // id анимации, пока она идёт

	// Каждый кадр подъезжаем к цели на 16% оставшегося расстояния: получается плавно
	const animate = () => {
		const diff = target - track.scrollLeft
		if (Math.abs(diff) < 0.5) {
			track.scrollLeft = target
			frame = null
			return
		}
		track.scrollLeft += diff * 0.16
		frame = requestAnimationFrame(animate)
	}

	track.addEventListener(
		'wheel',
		event => {
			// горизонтальный жест на трекпаде браузер обработает сам
			if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return

			const max = track.scrollWidth - track.clientWidth
			if (max <= 0) return // всё помещается, листать нечего

			const delta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY
			const current = frame ? target : track.scrollLeft
			const atStart = current <= 0 && delta < 0
			const atEnd = current >= max - 1 && delta > 0
			if (atStart || atEnd) return // на краю отпускаем страницу

			event.preventDefault()
			target = Math.max(0, Math.min(max, current + delta))

			if (reduceMotion) track.scrollLeft = target
			else if (!frame) frame = requestAnimationFrame(animate)
		},
		{ passive: false },
	)

	// Если пользователь листает по-другому (свайп, стрелки), синхронизируем цель
	track.addEventListener('scroll', () => {
		if (!frame) target = track.scrollLeft
	})
}

// ===== Функция 4. Форма "order of service" с проверкой =====
const initOrderForm = () => {
	const dialog = document.querySelector('#orderDialog')
	const form = document.querySelector('#orderForm')
	const status = document.querySelector('#formStatus')
	const fields = [...form.querySelectorAll('input, textarea')]

	setupDialog(dialog)
	document.querySelector('#orderOpen').addEventListener('click', () => dialog.showModal())

	// Для каждого поля своё правило. Пустая строка = ошибок нет.
	const rules = {
		name: value => (value.trim().length >= 2 ? '' : 'Please enter your name (at least 2 letters).'),
		email: value => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'Please enter a valid email.'),
		message: value => (value.trim().length >= 10 ? '' : 'Message should be at least 10 characters.'),
	}

	// Проверяет одно поле, показывает или убирает сообщение об ошибке
	const check = field => {
		const error = rules[field.name](field.value)
		document.querySelector(`#${field.id}Error`).textContent = error
		field.setAttribute('aria-invalid', error ? 'true' : 'false')
		return !error
	}

	// После первой ошибки проверяем поле прямо во время ввода
	fields.forEach(field => {
		field.addEventListener('input', () => {
			if (field.getAttribute('aria-invalid') === 'true') check(field)
		})
	})

	form.addEventListener('submit', event => {
		event.preventDefault()
		const allValid = fields.map(check).every(Boolean) // проверяем все поля, а не до первой ошибки

		if (!allValid) {
			status.textContent = ''
			return
		}

		status.textContent = `Thank you, ${form.name.value.trim()}! Your message is ready to be sent.`
		form.reset()
	})

	// При повторном открытии окна очищаем старое сообщение
	dialog.addEventListener('close', () => (status.textContent = ''))
}

// ===== Функция 5. Подсветка текущего пункта меню при прокрутке =====
const initMenu = () => {
	const links = [...document.querySelectorAll('.menu a')]

	const observer = new IntersectionObserver(
		entries => {
			entries.forEach(entry => {
				if (!entry.isIntersecting) return
				links.forEach(link => {
					link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`)
				})
			})
		},
		{ rootMargin: '-45% 0px -45% 0px' }, // секция считается текущей, когда в центре экрана
	)

	links.forEach(link => observer.observe(document.querySelector(link.getAttribute('href'))))
}

 const g = document.getElementById('greeting');
    const btn = document.getElementById('askName');

    // Функция показывает приветствие
    function showGreeting(name) {
      g.textContent = name
        ? `Yo, ${name}!`
        : 'Sup!';
    }

    // Функция спрашивает имя
    function askName() {
      const name = prompt('What yo name?');
      if (name) {
        localStorage.setItem('visitorName', name);
      } else {
        localStorage.removeItem('visitorName');
      }
      showGreeting(localStorage.getItem('visitorName'));
    }

    // Когда нажимаем кнопку — спрашиваем имя
    btn.addEventListener('click', askName);

    // Если имя уже сохранено — показываем сразу
    showGreeting(localStorage.getItem('visitorName'));


// ===== Функция 6. Бургер-меню на телефоне =====
const initBurger = () => {
	const burger = document.querySelector('#hamburger')
	const menu = document.querySelector('#menu')
	const mobile = window.matchMedia('(max-width: 700px)')

	// Открывает или закрывает меню и обновляет всё, что с этим связано
	const setOpen = isOpen => {
		menu.classList.toggle('open', isOpen)
		burger.setAttribute('aria-expanded', isOpen)
		burger.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu')
	}

	burger.addEventListener('click', () => {
		setOpen(burger.getAttribute('aria-expanded') !== 'true')
	})

	// Клик по пункту меню закрывает панель
	menu.addEventListener('click', event => {
		if (event.target.closest('a')) setOpen(false)
	})

	// Клик в любом месте мимо меню и кнопки закрывает панель
	document.addEventListener('click', event => {
		if (!event.target.closest('#menu, #hamburger')) setOpen(false)
	})

	// Клавиша Esc закрывает панель
	document.addEventListener('keydown', event => {
		if (event.key === 'Escape') setOpen(false)
	})

	// Если окно растянули до компьютерной ширины (или обратно), сбрасываем состояние
	mobile.addEventListener('change', () => setOpen(false))
}

// Кнопка «Наверх»
const scrollTopBtn = document.getElementById('scrollTopBtn');

// Порог появления (в пикселях)
const SHOW_AFTER = 300;

// Следим за прокруткой и показываем/скрываем кнопку
window.addEventListener('scroll', () => {
  if (window.scrollY > SHOW_AFTER) {
    scrollTopBtn.classList.add('show');
  } else {
    scrollTopBtn.classList.remove('show');
  }
});

// Плавно прокручиваем к началу страницы
scrollTopBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

initBurger()
initTheme()
initProjects()
initSlider()
initOrderForm()
initMenu()
