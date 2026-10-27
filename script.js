const button = document.querySelector('#themeToggle')

button.addEventListener('click', () => {
	const isDark = document.body.classList.toggle('dark')

	button.textContent = isDark ? 'light mode.' : 'dark mode.'
})
