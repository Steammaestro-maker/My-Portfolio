const body = document.body
const themeToggle = document.querySelector('#themeToggle')
const themeMeta = document.querySelector('meta[name="theme-color"]')

// ---------- тема ----------
const setTheme = (isDark, save) => {
	body.classList.toggle('dark', isDark)
	themeToggle.textContent = isDark ? 'light mode.' : 'dark mode.'
	themeToggle.setAttribute('aria-pressed', String(isDark))
	themeMeta?.setAttribute('content', isDark ? '#111111' : '#ffffff')
	if (save) {
		try {
			localStorage.setItem('theme', isDark ? 'dark' : 'light')
		} catch (e) {}
	}
}

try {
	if (localStorage.getItem('theme') === 'dark') setTheme(true, false)
} catch (e) {}

themeToggle.addEventListener('click', () => {
	setTheme(!body.classList.contains('dark'), true)
})

// ---------- show more projects ----------
const moreBtn = document.querySelector('#moreProjects')

moreBtn.addEventListener('click', () => {
	const isOpen = moreBtn.getAttribute('aria-expanded') === 'true'
	document.querySelectorAll('.p-card.extra').forEach(card => {
		card.hidden = isOpen
	})
	moreBtn.setAttribute('aria-expanded', String(!isOpen))
	moreBtn.textContent = isOpen ? 'show more projects' : 'show fewer projects'
})

// ---------- amazing cases: листание колесом мыши и перетаскиванием ----------
const track = document.querySelector('#casesTrack')
const reduceMotion = window.matchMedia(
	'(prefers-reduced-motion: reduce)',
).matches

let target = track.scrollLeft
let rafId = null

const animate = () => {
	const diff = target - track.scrollLeft
	if (Math.abs(diff) < 0.5) {
		track.scrollLeft = target
		rafId = null
		return
	}
	track.scrollLeft += diff * 0.16
	rafId = requestAnimationFrame(animate)
}

track.addEventListener(
	'wheel',
	e => {
		// горизонтальный жест на трекпаде браузер обрабатывает сам
		if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return

		const max = track.scrollWidth - track.clientWidth
		if (max <= 0) return

		const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY
		const current = rafId ? target : track.scrollLeft

		// на краях отдаём колесо странице, чтобы не застревать
		if ((current <= 0 && delta < 0) || (current >= max - 1 && delta > 0)) return

		e.preventDefault()
		target = Math.max(0, Math.min(max, current + delta))

		if (reduceMotion) track.scrollLeft = target
		else if (!rafId) rafId = requestAnimationFrame(animate)
	},
	{ passive: false },
)

track.addEventListener('scroll', () => {
	if (!rafId) target = track.scrollLeft
})

// перетаскивание мышью
let dragging = false
let startX = 0
let startScroll = 0

track.addEventListener('pointerdown', e => {
	if (e.pointerType !== 'mouse') return
	dragging = true
	startX = e.clientX
	startScroll = track.scrollLeft
	track.classList.add('dragging')
})

window.addEventListener('pointermove', e => {
	if (!dragging) return
	track.scrollLeft = startScroll - (e.clientX - startX)
})

window.addEventListener('pointerup', () => {
	dragging = false
	track.classList.remove('dragging')
})

track.addEventListener('dragstart', e => e.preventDefault())

// ---------- подсветка текущего пункта меню ----------
const links = [...document.querySelectorAll('.menu a')]
const sections = links
	.map(link => document.querySelector(link.getAttribute('href')))
	.filter(Boolean)

const observer = new IntersectionObserver(
	entries => {
		entries.forEach(entry => {
			if (!entry.isIntersecting) return
			links.forEach(link => {
				link.classList.toggle(
					'active',
					link.getAttribute('href') === `#${entry.target.id}`,
				)
			})
		})
	},
	{ rootMargin: '-45% 0px -45% 0px' },
)

sections.forEach(section => observer.observe(section))
